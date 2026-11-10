import os
import time
import threading
import cv2
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from services.farm_service import FarmService
from services.rokae_service import RokaeRobotService
from services.ai_analytics_service import ai_analytics_service
from services import analytics_service
from models.melon_predictor import MelonRipenessPredictor
from models.disease_predictor import PlantDiseasePredictor

app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = 'smart-agro-secret-key-2026'
CORS(app)

# Inisialisasi Service dan Model Prediktif
farm_service = FarmService()
melon_model = MelonRipenessPredictor()
disease_model = PlantDiseasePredictor()
rokae_robot = RokaeRobotService()

# Pengiriman sinyal robot dari live detection dijalankan di background & dibatasi,
# agar inferensi per-frame tidak tertahan oleh koneksi Modbus (terutama saat robot offline).
_live_send_lock = threading.Lock()
_live_send_state = {'busy': False, 'last_key': None, 'last_time': 0.0}
LIVE_SEND_MIN_INTERVAL = 1.5  # detik


def _send_live_result_async(kind, cls_name):
    key = f"{kind}:{cls_name}"
    now = time.time()
    with _live_send_lock:
        st = _live_send_state
        if st['busy']:
            return
        if key == st['last_key'] and (now - st['last_time']) < LIVE_SEND_MIN_INTERVAL:
            return
        st['busy'] = True
        st['last_key'] = key
        st['last_time'] = now

    def _worker():
        try:
            if kind == 'melon':
                rokae_robot.send_melon_result(cls_name)
            else:
                rokae_robot.send_disease_result(cls_name)
        except Exception:
            pass
        finally:
            with _live_send_lock:
                _live_send_state['busy'] = False

    threading.Thread(target=_worker, daemon=True).start()

# ----------------- REST API UNTUK REACT FRONTEND -----------------

@app.route('/api/greenhouses')
def api_greenhouses():
    return jsonify({
        'success': True,
        'data': farm_service.get_all_greenhouses()
    })

@app.route('/api/stats')
def api_stats():
    stats = farm_service.get_global_stats()
    stats['rokae_robot'] = rokae_robot.get_telemetry()
    return jsonify({
        'success': True,
        'data': stats
    })

@app.route('/api/analytics/ripeness')
def api_analytics_ripeness():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    stats = farm_service.get_global_stats()
    result = ai_analytics_service.get_ripeness_analytics(stats, force_refresh=force_refresh)
    return jsonify({
        'success': True,
        'data': result
    })

@app.route('/api/analytics/disease')
def api_analytics_disease():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    stats = farm_service.get_global_stats()
    result = ai_analytics_service.get_disease_analytics(stats, force_refresh=force_refresh)
    return jsonify({
        'success': True,
        'data': result
    })

@app.route('/api/fruits')
def api_fruits():
    gh_filter = request.args.get('gh', 'all')
    ripeness_filter = request.args.get('ripeness', 'all')
    search_q = request.args.get('q', '').strip()
    fruits = farm_service.get_fruits(gh_id=gh_filter, ripeness=ripeness_filter, search=search_q)
    return jsonify({
        'success': True,
        'total': len(fruits),
        'data': fruits
    })

@app.route('/api/trees')
def api_trees():
    gh_filter = request.args.get('gh', 'all')
    kondisi_filter = request.args.get('kondisi', 'all')
    search_q = request.args.get('q', '').strip()
    trees = farm_service.get_trees(gh_id=gh_filter, kondisi=kondisi_filter, search=search_q)
    return jsonify({
        'success': True,
        'total': len(trees),
        'data': trees
    })

@app.route('/api/fruit/<fruit_id>')
def api_fruit_detail(fruit_id):
    fruit = farm_service.get_fruit_by_id(fruit_id)
    if fruit:
        return jsonify({'success': True, 'data': fruit})
    return jsonify({'success': False, 'message': 'Buah tidak ditemukan'}), 404

@app.route('/api/tree/<tree_id>')
def api_tree_detail(tree_id):
    tree = farm_service.get_tree_by_id(tree_id)
    if tree:
        companion_fruit = next((f for f in farm_service.fruits if f['tree_id'] == tree['tree_id']), None)
        return jsonify({
            'success': True,
            'data': tree,
            'companion_fruit': companion_fruit
        })
    return jsonify({'success': False, 'message': 'Pohon tidak ditemukan'}), 404

@app.route('/api/ripeness/summary')
def api_ripeness_summary():
    """Summary report kematangan dengan rincian posisi pohon untuk React."""
    report = farm_service.get_ripeness_summary_with_tree_positions()
    return jsonify({
        'success': True,
        'data': report
    })

@app.route('/api/disease/summary')
def api_disease_summary():
    """Summary sakit dan sehat grouping by greenhouse dan jalur untuk React."""
    grouped = farm_service.get_disease_summary_grouped_by_gh_and_row()
    return jsonify({
        'success': True,
        'data': grouped
    })

@app.route('/api/greenhouse/<gh_id>/spatial')
def api_greenhouse_spatial(gh_id):
    data = farm_service.get_greenhouse_spatial_grid(gh_id)
    if data:
        return jsonify({'success': True, 'data': data})
    return jsonify({'success': False, 'message': 'Greenhouse tidak ditemukan'}), 404

# ----------------- REST API B2B HILIR MARKETPLACE -----------------

@app.route('/api/b2b/commodities')
def api_b2b_commodities():
    """Endpoint B2B Hilir untuk komoditas Siap Jual (matang) dan Pre-Order (mengkal)."""
    return jsonify(farm_service.get_b2b_commodities())

@app.route('/api/predict/melon', methods=['POST'])
def api_predict_melon():
    data = request.form if request.form else (request.get_json() or {})
    fruit_id = data.get('fruit_id', '').strip()
    try:
        age_days = int(data.get('age_days', 90) or 90)
    except (ValueError, TypeError):
        age_days = 90
    force_stage = data.get('force_stage', None)

    images = []
    for angle_key in ['angle1', 'angle2', 'angle3']:
        file = request.files.get(angle_key)
        if file and file.filename != '':
            images.append(file.read())
        else:
            images.append(None)

    prediction = melon_model.predict(images=images, age_days=age_days, force_stage=force_stage)

    # Kirim sinyal otomatis ke controller robot ROKAE XMS5-R800 via Modbus TCP (Addr 67)
    rokae_feedback = rokae_robot.send_melon_result(prediction.get('tingkat_kematangan', 'mentah'))

    updated_record = None
    if fruit_id:
        updated_record = farm_service.record_melon_scan(fruit_id, prediction, prediction.get('angles'))

    return jsonify({
        'success': True,
        'prediction': prediction,
        'updated_record': updated_record,
        'rokae_robot': rokae_feedback
    })

@app.route('/api/predict/live_frame', methods=['POST'])
def api_predict_live_frame():
    """Deteksi real-time frame kamera browser dengan Bounding Box Dinamis YOLO & Modbus trigger."""
    task = request.form.get('task', 'melon')  # 'melon' or 'disease'
    file = request.files.get('frame')
    if not file:
        return jsonify({'success': False, 'message': 'No frame received'}), 400

    raw_bytes = file.read()
    file_bytes = np.frombuffer(raw_bytes, np.uint8)
    frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify({'success': False, 'message': 'Invalid image'}), 400

    if task == 'melon':
        boxes = melon_model.detect_frame(frame, conf_threshold=0.20)
        del frame, file_bytes
        if boxes:
            # Batasi deteksi tepat 1 objek target (buah melon utama) untuk memaksimalkan presisi & akurasi
            primary_box = boxes[0]
            single_boxes = [primary_box]
            stage = primary_box['stage']
            rokae_robot_stage = stage
            _send_live_result_async('melon', rokae_robot_stage)
            prediction = melon_model.predict(images=None, force_stage=stage)
            prediction['confidence'] = primary_box['confidence']
            return jsonify({
                'success': True,
                'found': True,
                'boxes': single_boxes,
                'box': primary_box,
                'prediction': prediction,
                'rokae_telemetry': rokae_robot.get_telemetry()
            })
        else:
            return jsonify({
                'success': True,
                'found': False,
                'boxes': [],
                'box': None,
                'prediction': None,
                'rokae_telemetry': rokae_robot.get_telemetry()
            })
    else:
        boxes = disease_model.detect_frame(frame, conf_threshold=0.20)
        del frame, file_bytes
        if boxes:
            # Batasi deteksi tepat 1 objek target (helai daun utama) untuk memaksimalkan presisi & akurasi
            primary_box = boxes[0]
            single_boxes = [primary_box]
            d_cls = primary_box['stage']
            _send_live_result_async('disease', d_cls)
            prediction = disease_model.predict(images=None, force_disease=d_cls)
            prediction['confidence'] = primary_box['confidence']
            return jsonify({
                'success': True,
                'found': True,
                'boxes': single_boxes,
                'box': primary_box,
                'prediction': prediction,
                'rokae_telemetry': rokae_robot.get_telemetry()
            })
        else:
            return jsonify({
                'success': True,
                'found': False,
                'boxes': [],
                'box': None,
                'prediction': None,
                'rokae_telemetry': rokae_robot.get_telemetry()
            })

@app.route('/api/predict/disease', methods=['POST'])
def api_predict_disease():
    data = request.form if request.form else (request.get_json() or {})
    tree_id = data.get('tree_id', '').strip()
    force_disease = data.get('force_disease', None)

    images = []
    for angle_key in ['angle1', 'angle2', 'angle3']:
        file = request.files.get(angle_key)
        if file and file.filename != '':
            images.append(file.read())
        else:
            images.append(None)

    prediction = disease_model.predict(images=images, force_disease=force_disease)

    # Kirim sinyal otomatis ke controller robot ROKAE XMS5-R800 via Modbus TCP (Addr 67)
    d_class = prediction.get('disease_class') or prediction.get('nama_penyakit', 'normal')
    rokae_feedback = rokae_robot.send_disease_result(d_class)

    updated_record = None
    if tree_id:
        updated_record = farm_service.record_disease_scan(tree_id, prediction, prediction.get('angles'))

    return jsonify({
        'success': True,
        'prediction': prediction,
        'updated_record': updated_record,
        'rokae_robot': rokae_feedback
    })

@app.route('/api/rokae/status')
def api_rokae_status():
    """Mengambil status real-time robot arm ROKAE XMS5-R800 dan Modbus TCP."""
    return jsonify({
        'success': True,
        'data': rokae_robot.get_telemetry()
    })

@app.route('/api/rokae/send', methods=['POST'])
def api_rokae_send():
    """Mengirim nilai custom INT16 ke register datacam ROKAE (Address 67)."""
    data = request.get_json() or request.form or {}
    value = int(data.get('value', 0))
    label = data.get('label', 'Manual Control')
    result = rokae_robot.send_code(value, label)
    return jsonify({
        'success': True,
        'result': result
    })

# Serve build React dist with anti-stale-cache headers
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    dist_dir = os.path.join(os.path.dirname(__file__), 'static', 'dist')
    
    # Check if direct file exists in dist_dir
    if os.path.exists(dist_dir) and path != '':
        target_file = os.path.join(dist_dir, path)
        if os.path.exists(target_file):
            resp = send_from_directory(dist_dir, path)
            if path == 'sw.js' or path.endswith('.html'):
                resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                resp.headers['Pragma'] = 'no-cache'
                resp.headers['Expires'] = '0'
            return resp
        elif path.startswith('assets/') or path.startswith('static/'):
            # Don't serve index.html for non-existent asset chunks!
            return jsonify({'error': 'Asset not found', 'path': path}), 404

    # Serve index.html for SPA routes with no-cache so browsers always get newest build chunk
    if os.path.exists(dist_dir) and os.path.exists(os.path.join(dist_dir, 'index.html')):
        resp = send_from_directory(dist_dir, 'index.html')
        resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        resp.headers['Pragma'] = 'no-cache'
        resp.headers['Expires'] = '0'
        return resp

    return jsonify({'error': 'Frontend build not found. Jalankan npm run build di frontend/.'}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
