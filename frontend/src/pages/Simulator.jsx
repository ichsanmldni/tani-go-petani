import React, { useState, useEffect, useRef } from 'react';
import {
  Plant,
  Bug,
  VideoCamera,
  Camera,
  ArrowsClockwise,
  UploadSimple
} from '@phosphor-icons/react';
import ImageDetailModal from '../components/ImageDetailModal.jsx';

export default function Simulator() {
  const [activeTab, setActiveTab] = useState('melon'); // 'melon' or 'disease'
  const [inputMode, setInputMode] = useState('preset'); // 'preset' or 'camera'

  // Form State - Melon
  const [melonFruitId, setMelonFruitId] = useState('MLN-GH-1-R01-P01-F1');
  const [melonAge, setMelonAge] = useState(96);
  const [melonStage, setMelonStage] = useState('matang');
  const [melonSampleIndex, setMelonSampleIndex] = useState(1);
  const [melonLoading, setMelonLoading] = useState(false);
  const [melonResult, setMelonResult] = useState(null);

  // Form State - Penyakit Daun
  const [diseaseTreeId, setDiseaseTreeId] = useState('PHN-GH-1-R01-P01');
  const [diseasePreset, setDiseasePreset] = useState('aphid');
  const [diseaseSampleIndex, setDiseaseSampleIndex] = useState(1);
  const [diseaseLoading, setDiseaseLoading] = useState(false);
  const [diseaseResult, setDiseaseResult] = useState(null);

  // Modal Detail Foto Sampel
  const [previewImageModal, setPreviewImageModal] = useState(null);

  // Background Telemetri Robot
  const [rokaeStatus, setRokaeStatus] = useState(null);
  const [lastModbusFeedback, setLastModbusFeedback] = useState(null);

  // Live Camera State & Realtime Auto-Detection
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hudCanvasRef = useRef(null);
  const isInferringRef = useRef(false);
  const animFrameIdRef = useRef(null);
  const lastDetectTimeRef = useRef(0);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isUploadedImage, setIsUploadedImage] = useState(false);
  const [uploadedImgSrc, setUploadedImgSrc] = useState(null);
  const fileUploadRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [isAutoDetection, setIsAutoDetection] = useState(true);
  const [liveBox, setLiveBox] = useState(null);
  const [liveBoxes, setLiveBoxes] = useState([]);
  const [isObjectDetected, setIsObjectDetected] = useState(false);
  const targetBoxesRef = useRef([]);
  const renderedBoxesRef = useRef([]);
  const [liveFps, setLiveFps] = useState(30);
  const [liveConfidence, setLiveConfidence] = useState(0);
  const [stabilityCounter, setStabilityCounter] = useState(0);
  const [lastDetectedClass, setLastDetectedClass] = useState(null);

  const fetchRokaeStatus = () => {
    fetch('/api/rokae/status')
      .then(res => res.json())
      .then(d => {
        if (d.success) setRokaeStatus(d.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchRokaeStatus();
  }, []);

  const startCamera = async () => {
    setCameraError(null);

    // Hentikan stream sebelumnya jika ada
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const oldTracks = videoRef.current.srcObject.getTracks();
        oldTracks.forEach(t => t.stop());
      } catch (e) {}
      videoRef.current.srcObject = null;
    }

    let stream = null;
    let lastError = null;

    // Tingkat 1: Coba kamera dengan resolusi ideal
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
    } catch (err1) {
      console.warn('Percobaan resolusi ideal gagal, mencoba fallback standar:', err1);
      lastError = err1;
      // Tingkat 2: Fallback ke kamera default perangkat apa pun
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      } catch (err2) {
        lastError = err2;
      }
    }

    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(e => console.warn('Play error:', e));
      };
      setIsCameraActive(true);
      setCameraError(null);
    } else {
      let rawMsg = (lastError && lastError.message) ? lastError.message : '';
      let userMsg = 'Gagal membuka kamera: ' + rawMsg;
      if (rawMsg.toLowerCase().includes('timeout') || rawMsg.toLowerCase().includes('starting video')) {
        userMsg = 'Kamera tidak merespons (Timeout). Pastikan tidak ada aplikasi lain (Zoom, Google Meet, aplikasi Kamera Windows, atau tab browser lain) yang sedang memakai webcam, lalu klik "Buka kamera" lagi.';
      } else if (rawMsg.toLowerCase().includes('permission') || rawMsg.toLowerCase().includes('denied') || rawMsg.toLowerCase().includes('notallowed')) {
        userMsg = 'Izin kamera ditolak. Klik ikon gembok di sebelah alamat web browser (address bar), ubah izin kamera menjadi "Izinkan", lalu refresh.';
      } else if (rawMsg.toLowerCase().includes('notfound') || rawMsg.toLowerCase().includes('devicesnotfound') || rawMsg.toLowerCase().includes('not found') || rawMsg.toLowerCase().includes('requested device')) {
        userMsg = 'Perangkat kamera tidak ditemukan oleh browser (Requested device not found). Pastikan webcam terpasang/aktif di laptop, penutup lensa (slider privasi) terbuka, dan akses kamera diizinkan di Pengaturan Windows (Privacy & Security > Camera). Anda juga dapat mengunggah foto langsung melalui tombol di bawah.';
      }
      setCameraError(userMsg);
      setIsCameraActive(false);
    }
  };

  const handleCustomImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const oldTracks = videoRef.current.srcObject.getTracks();
        oldTracks.forEach(t => t.stop());
      } catch (err) {}
      videoRef.current.srcObject = null;
    }

    setCameraError(null);
    const objectUrl = URL.createObjectURL(file);
    setUploadedImgSrc(objectUrl);
    setIsUploadedImage(true);
    setIsCameraActive(true);

    const fd = new FormData();
    fd.append('frame', file, 'uploaded_frame.jpg');
    fd.append('task', activeTab);

    try {
      const res = await fetch('/api/predict/live_frame', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.success) {
        if (d.found && d.boxes && d.boxes.length > 0) {
          targetBoxesRef.current = d.boxes;
          setLiveBoxes(d.boxes);
          setLiveBox(d.box || d.boxes[0]);
          setIsObjectDetected(true);
          const topBox = d.box || d.boxes[0];
          setLiveConfidence(topBox.confidence || 0);

          if (d.prediction) {
            if (activeTab === 'melon') setMelonResult(d.prediction);
            else setDiseaseResult(d.prediction);
          }
        } else {
          targetBoxesRef.current = [];
          setLiveBoxes([]);
          setLiveBox(null);
          setIsObjectDetected(false);
        }
      }
    } catch (err) {
      console.error('Error infer custom image:', err);
    }
  };

  const handleLoadDemoImage = async (demoIndex = 1) => {
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const oldTracks = videoRef.current.srcObject.getTracks();
        oldTracks.forEach(t => t.stop());
      } catch (err) {}
      videoRef.current.srcObject = null;
    }

    setCameraError(null);
    const demoUrl = activeTab === 'melon'
      ? `/static/img/real_samples/fruits/fully_ripe_${demoIndex}.jpg`
      : `/static/img/real_samples/leaves/aphid_${demoIndex}.jpg`;

    try {
      const response = await fetch(demoUrl);
      const blob = await response.blob();
      setUploadedImgSrc(demoUrl);
      setIsUploadedImage(true);
      setIsCameraActive(true);

      const fd = new FormData();
      fd.append('frame', blob, 'demo_frame.jpg');
      fd.append('task', activeTab);

      const res = await fetch('/api/predict/live_frame', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.success) {
        if (d.found && d.boxes && d.boxes.length > 0) {
          targetBoxesRef.current = d.boxes;
          setLiveBoxes(d.boxes);
          setLiveBox(d.box || d.boxes[0]);
          setIsObjectDetected(true);
          const topBox = d.box || d.boxes[0];
          setLiveConfidence(topBox.confidence || 0);

          if (d.prediction) {
            if (activeTab === 'melon') setMelonResult(d.prediction);
            else setDiseaseResult(d.prediction);
          }
        } else {
          targetBoxesRef.current = [];
          setLiveBoxes([]);
          setLiveBox(null);
          setIsObjectDetected(false);
        }
      }
    } catch (err) {
      console.error('Error loading demo image:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsUploadedImage(false);
    setUploadedImgSrc(null);
    targetBoxesRef.current = [];
    setLiveBoxes([]);
    setLiveBox(null);
    setIsObjectDetected(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const captureFrameBlob = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.92));
  };

  // Inference Loop Real-Time ke /api/predict/live_frame
  const runLiveInference = async () => {
    if (!videoRef.current || !canvasRef.current || isInferringRef.current) return;
    if (videoRef.current.readyState < 2) return;

    isInferringRef.current = true;
    try {
      const blob = await captureFrameBlob();
      if (!blob) {
        isInferringRef.current = false;
        return;
      }

      const fd = new FormData();
      fd.append('frame', blob, 'live_frame.jpg');
      fd.append('task', activeTab);

      const res = await fetch('/api/predict/live_frame', { method: 'POST', body: fd });
      const d = await res.json();

      if (d.success) {
        if (d.found && d.boxes && d.boxes.length > 0) {
          targetBoxesRef.current = d.boxes;
          setLiveBoxes(d.boxes);
          setLiveBox(d.box || d.boxes[0]);
          setIsObjectDetected(true);

          const topBox = d.box || d.boxes[0];
          setLiveConfidence(topBox.confidence || 0);

          setLastDetectedClass(prev => {
            if (prev === topBox.stage) {
              setStabilityCounter(c => Math.min(c + 1, 8));
            } else {
              setStabilityCounter(1);
            }
            return topBox.stage;
          });

          if (d.prediction) {
            if (activeTab === 'melon') {
              setMelonResult(d.prediction);
            } else {
              setDiseaseResult(d.prediction);
            }
          }

          if (d.rokae_telemetry) {
            setLastModbusFeedback(d.rokae_telemetry);
            setRokaeStatus(d.rokae_telemetry);
          }
        } else {
          // Tidak ada objek terdeteksi oleh YOLO di frame saat ini
          targetBoxesRef.current = [];
          setLiveBoxes([]);
          setLiveBox(null);
          setIsObjectDetected(false);
          setStabilityCounter(0);
        }
      }
    } catch (err) {
      console.log('Live inference error:', err);
    } finally {
      isInferringRef.current = false;
    }
  };

  // Rendering Loop Canvas HUD 30-60 FPS untuk Bounding Box Dinamis & Pelacakan Real-Time
  useEffect(() => {
    if (!isCameraActive) {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      return;
    }

    const canvas = hudCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let frameCount = 0;
    let lastFpsUpdateTime = performance.now();

    const renderLoop = (now) => {
      const video = videoRef.current;
      if (video && video.videoWidth && canvas) {
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }
      }

      frameCount++;
      if (now - lastFpsUpdateTime >= 1000) {
        setLiveFps(Math.max(15, Math.round((frameCount * 1000) / (now - lastFpsUpdateTime))));
        frameCount = 0;
        lastFpsUpdateTime = now;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      if (w > 0 && h > 0) {
        const targetBoxes = targetBoxesRef.current || [];

        if (targetBoxes.length > 0) {
          // --- KONDISI 1: ADA OBJEK TERDETEKSI (DINAMIS MELACAK OBJEK) ---
          if (renderedBoxesRef.current.length !== targetBoxes.length) {
            renderedBoxesRef.current = targetBoxes.map(tb => ({ ...tb }));
          } else {
            targetBoxes.forEach((tb, idx) => {
              const cur = renderedBoxesRef.current[idx];
              if (cur) {
                const lerp = 0.40;
                cur.norm_x += (tb.norm_x - cur.norm_x) * lerp;
                cur.norm_y += (tb.norm_y - cur.norm_y) * lerp;
                cur.norm_w += (tb.norm_w - cur.norm_w) * lerp;
                cur.norm_h += (tb.norm_h - cur.norm_h) * lerp;
                cur.label = tb.label;
                cur.confidence = tb.confidence;
                cur.color = tb.color;
              }
            });
          }

          renderedBoxesRef.current.forEach(box => {
            const bx = box.norm_x * w;
            const by = box.norm_y * h;
            const bw = Math.max(20, box.norm_w * w);
            const bh = Math.max(20, box.norm_h * h);
            const color = box.color || '#16a34a';

            // Semi-transparan tint
            ctx.fillStyle = color === '#16a34a' 
              ? 'rgba(34, 197, 94, 0.12)' 
              : (color === '#ca8a04' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(239, 68, 68, 0.12)');
            ctx.fillRect(bx, by, bw, bh);

            // Garis bounding box dinamis
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(bx, by, bw, bh);

            // Sudut Aksen Presisi (Corner Accents)
            const cornerLen = Math.min(18, Math.min(bw, bh) * 0.25);
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(bx, by + cornerLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerLen, by);
            ctx.moveTo(bx + bw - cornerLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cornerLen);
            ctx.moveTo(bx, by + bh - cornerLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cornerLen, by + bh);
            ctx.moveTo(bx + bw - cornerLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cornerLen);
            ctx.stroke();

            // Floating Label Tag Chip
            const labelText = `${box.label} (${box.confidence}%)`;
            ctx.font = 'bold 11px sans-serif';
            const textWidth = ctx.measureText(labelText).width;
            const tagHeight = 22;
            const tagY = Math.max(10, by - tagHeight - 4);

            ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
            ctx.fillRect(bx, tagY, textWidth + 14, tagHeight);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(bx, tagY, textWidth + 14, tagHeight);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, bx + 7, tagY + 15);
          });
        } else {
          // --- KONDISI 2: TIDAK ADA OBJEK (SCANNING VIEWFINDER MODE) ---
          renderedBoxesRef.current = [];

          // Viewfinder Corners di tepi viewport
          const pad = 24;
          const cornerLen = 22;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pad, pad + cornerLen); ctx.lineTo(pad, pad); ctx.lineTo(pad + cornerLen, pad);
          ctx.moveTo(w - pad - cornerLen, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + cornerLen);
          ctx.moveTo(pad, h - pad - cornerLen); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + cornerLen, h - pad);
          ctx.moveTo(w - pad - cornerLen, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - cornerLen);
          ctx.stroke();

          // Laser Scanning Bar Bolak-Balik Halus
          const scanCycle = (now % 2800) / 2800;
          const scanNorm = (Math.sin(scanCycle * Math.PI * 2 - Math.PI / 2) + 1) / 2;
          const scanY = pad + scanNorm * (h - pad * 2);

          const grad = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
          grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
          grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.85)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(w * 0.15, scanY);
          ctx.lineTo(w * 0.85, scanY);
          ctx.stroke();

          // Efek ekor laser
          const trailGrad = ctx.createLinearGradient(0, scanY - 24, 0, scanY);
          trailGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
          trailGrad.addColorStop(1, 'rgba(56, 189, 248, 0.10)');
          ctx.fillStyle = trailGrad;
          ctx.fillRect(w * 0.15, scanY - 24, w * 0.70, 24);

          // Status Badge Scanner di Bawah Viewport
          const scanMsg = activeTab === 'melon'
            ? 'Mencari buah melon...'
            : 'Mencari daun melon...';
          ctx.font = '11px sans-serif';
          const msgWidth = ctx.measureText(scanMsg).width;
          const msgX = (w - msgWidth - 24) / 2;
          const msgY = h - 38;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(msgX, msgY, msgWidth + 24, 24);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 1;
          ctx.strokeRect(msgX, msgY, msgWidth + 24, 24);

          ctx.fillStyle = '#38bdf8';
          ctx.fillText(scanMsg, msgX + 12, msgY + 16);
        }

        // 3. Telemetry HUD Bar di Kiri Atas
        const hudWidth = Math.min(280, w - 20);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(10, 10, hudWidth, 44);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, hudWidth, 44);

        const pulse = (Math.sin(now / 200) + 1) / 2;
        ctx.fillStyle = !isAutoDetection 
          ? '#94a3b8' 
          : (targetBoxes.length > 0 ? `rgba(34, 197, 94, ${0.4 + pulse * 0.6})` : `rgba(56, 189, 248, ${0.4 + pulse * 0.6})`);
        ctx.beginPath();
        ctx.arc(22, 24, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(
          !isAutoDetection 
            ? 'Deteksi dijeda' 
            : (targetBoxes.length > 0 ? `Terdeteksi (${targetBoxes.length})` : 'Mencari objek...'),
          32, 
          28
        );

        ctx.font = '10px sans-serif';
        ctx.fillStyle = targetBoxes.length > 0 ? '#4ade80' : '#38bdf8';
        ctx.fillText(
          targetBoxes.length > 0 
            ? `Pelacakan aktif · ${liveFps} FPS` 
            : `Kamera aktif · ${liveFps} FPS`, 
          20, 
          44
        );
      }

      if (isAutoDetection && (now - lastDetectTimeRef.current >= 300)) {
        lastDetectTimeRef.current = now;
        runLiveInference();
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isCameraActive, isAutoDetection, activeTab]);

  // Eksekusi Model Kematangan Melon
  const handleMelonInfer = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setMelonLoading(true);

    const formData = new FormData();
    formData.append('fruit_id', melonFruitId);
    formData.append('age_days', melonAge);

    if (inputMode === 'preset') {
      formData.append('force_stage', melonStage);
    } else if (isCameraActive) {
      const blob = await captureFrameBlob();
      if (blob) {
        formData.append('angle1', blob, 'cam_angle1.jpg');
        formData.append('angle2', blob, 'cam_angle2.jpg');
        formData.append('angle3', blob, 'cam_angle3.jpg');
      }
    } else {
      formData.append('force_stage', melonStage);
    }

    fetch('/api/predict/melon', {
      method: 'POST',
      body: formData
    })
      .then(res => {
        if (!res.ok) throw new Error('Respon error status ' + res.status);
        return res.json();
      })
      .then(d => {
        setMelonLoading(false);
        if (d && d.success && d.prediction) {
          setMelonResult(d.prediction);
          if (d.rokae_robot) {
            setLastModbusFeedback(d.rokae_robot);
            fetchRokaeStatus();
          }
        }
      })
      .catch((err) => {
        console.error('Gagal memeriksa kematangan:', err);
        setMelonLoading(false);
      });
  };

  // Eksekusi Model Penyakit Daun
  const handleDiseaseInfer = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setDiseaseLoading(true);

    const formData = new FormData();
    formData.append('tree_id', diseaseTreeId);

    if (inputMode === 'preset') {
      formData.append('force_disease', diseasePreset);
    } else if (isCameraActive) {
      const blob = await captureFrameBlob();
      if (blob) {
        formData.append('angle1', blob, 'cam_angle1.jpg');
        formData.append('angle2', blob, 'cam_angle2.jpg');
        formData.append('angle3', blob, 'cam_angle3.jpg');
      }
    } else {
      formData.append('force_disease', diseasePreset);
    }

    fetch('/api/predict/disease', {
      method: 'POST',
      body: formData
    })
      .then(res => {
        if (!res.ok) throw new Error('Respon error status ' + res.status);
        return res.json();
      })
      .then(d => {
        setDiseaseLoading(false);
        if (d && d.success && d.prediction) {
          setDiseaseResult(d.prediction);
          if (d.rokae_robot) {
            setLastModbusFeedback(d.rokae_robot);
            fetchRokaeStatus();
          }
        }
      })
      .catch((err) => {
        console.error('Gagal memeriksa penyakit daun:', err);
        setDiseaseLoading(false);
      });
  };

  const fruitImgKey = melonStage === 'matang' ? 'fully_ripe' : melonStage === 'mengkal' ? 'half_ripe' : 'unripe';
  const leafImgKey = diseasePreset.replace(' ', '_');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Bersih & Profesional */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        border: '1px solid #DDE5DC',
        padding: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ margin: '0 0 0.2rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#1B2A22' }}>
            Uji Kamera
          </h2>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
            Cek kondisi buah atau daun lewat kamera langsung atau foto sampel.
          </p>
        </div>

        {/* Tab Pilihan Pengujian */}
        <div style={{ display: 'flex', backgroundColor: '#F6F8F4', padding: '0.25rem', borderRadius: '0.5rem', gap: '0.25rem', border: '1px solid #DDE5DC' }}>
          <button
            onClick={() => setActiveTab('melon')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '0.4rem',
              border: 'none',
              backgroundColor: activeTab === 'melon' ? '#166534' : 'transparent',
              color: activeTab === 'melon' ? '#ffffff' : '#64748B',
              fontWeight: 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Plant size={15} weight="bold" /> Kematangan Buah
          </button>
          <button
            onClick={() => setActiveTab('disease')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '0.4rem',
              border: 'none',
              backgroundColor: activeTab === 'disease' ? '#B91C1C' : 'transparent',
              color: activeTab === 'disease' ? '#ffffff' : '#64748B',
              fontWeight: 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Bug size={15} weight="bold" /> Kesehatan Daun
          </button>
        </div>
      </div>

      {/* Pilihan Sumber Citra */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        border: '1px solid #DDE5DC',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1B2A22' }}>
          Pilih sumber gambar:
        </span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => { setInputMode('preset'); if (isCameraActive) stopCamera(); }}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '0.4rem',
              border: 'none',
              backgroundColor: inputMode === 'preset' ? '#166534' : '#F6F8F4',
              color: inputMode === 'preset' ? '#ffffff' : '#64748B',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Camera size={15} weight="bold" /> Foto Sampel
          </button>
          <button
            onClick={() => { setInputMode('camera'); if (!isCameraActive) startCamera(); }}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '0.4rem',
              border: 'none',
              backgroundColor: inputMode === 'camera' ? '#166534' : '#F6F8F4',
              color: inputMode === 'camera' ? '#ffffff' : '#64748B',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <VideoCamera size={15} weight="bold" /> Kamera Langsung
          </button>
        </div>
      </div>

      {/* Live Stream Kamera Jika Mode Kamera */}
      {inputMode === 'camera' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          border: '1px solid #DDE5DC',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1B2A22' }}>
                Kamera Langsung
              </span>
              {isCameraActive && (
                <span className="badge badge-success" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#047857', display: 'inline-block' }} />
                  {isAutoDetection ? 'Deteksi aktif' : 'Deteksi dijeda'}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {isCameraActive && (
                <>
                  <button
                    onClick={() => setIsAutoDetection(!isAutoDetection)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: isAutoDetection ? '#047857' : '#F6F8F4',
                      color: isAutoDetection ? '#ffffff' : '#1B2A22',
                      border: 'none',
                      borderRadius: '0.35rem',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <ArrowsClockwise size={13} weight="bold" />
                    {isAutoDetection ? 'Jeda deteksi' : 'Lanjutkan deteksi'}
                  </button>
                </>
              )}

              {!isCameraActive ? (
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleLoadDemoImage(1)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: '#ecfdf5',
                      color: '#166534',
                      border: '1px solid #a7f3d0',
                      borderRadius: '0.35rem',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Plant size={14} weight="bold" /> Contoh kebun
                  </button>
                  <button
                    type="button"
                    onClick={() => fileUploadRef.current && fileUploadRef.current.click()}
                    style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: '#F6F8F4',
                      color: '#1B2A22',
                      border: '1px solid #DDE5DC',
                      borderRadius: '0.35rem',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <UploadSimple size={14} weight="bold" /> Unggah foto
                  </button>
                  <button
                    onClick={startCamera}
                    style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: '#166534',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.35rem',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Buka kamera
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {isUploadedImage && (
                    <button
                      type="button"
                      onClick={() => fileUploadRef.current && fileUploadRef.current.click()}
                      style={{
                        padding: '0.35rem 0.75rem',
                        backgroundColor: '#F6F8F4',
                        color: '#1B2A22',
                        border: '1px solid #DDE5DC',
                        borderRadius: '0.35rem',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <UploadSimple size={14} weight="bold" /> Ganti foto
                    </button>
                  )}
                  <button
                    onClick={stopCamera}
                    style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: '#B91C1C',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.35rem',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {isUploadedImage ? 'Hapus foto' : 'Tutup kamera'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <input
            ref={fileUploadRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleCustomImageUpload}
          />

          {cameraError && (
            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.45rem', color: '#B91C1C', fontSize: '0.75rem', lineHeight: '1.4' }}>
              {cameraError}
            </div>
          )}

          {/* Viewport Kamera Proporsional Alami (16:9, Tidak Gepeng) */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '680px',
            margin: '0 auto',
            aspectRatio: '16 / 9',
            backgroundColor: '#0f172a',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: (isCameraActive && !isUploadedImage) ? 'block' : 'none'
              }}
            />
            {isUploadedImage && uploadedImgSrc && (
              <img
                src={uploadedImgSrc}
                alt="Foto pengujian"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <canvas
              ref={hudCanvasRef}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10,
                display: isCameraActive ? 'block' : 'none'
              }}
            />

            {!isCameraActive && (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
                <div>Kamera belum aktif. Tekan <strong>"Buka kamera"</strong> untuk mulai memantau.</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Atau jika laptop/PC tidak memiliki webcam:</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleLoadDemoImage(1)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      backgroundColor: '#166534',
                      border: 'none',
                      borderRadius: '0.4rem',
                      color: '#ffffff',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Plant size={15} weight="bold" /> Contoh Foto Kebun
                  </button>
                  <button
                    type="button"
                    onClick={() => fileUploadRef.current && fileUploadRef.current.click()}
                    style={{
                      padding: '0.4rem 0.85rem',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '0.4rem',
                      color: '#F8FAFC',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <UploadSimple size={15} weight="bold" /> Unggah Foto / Galeri HP
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Telemetri Bersih di Bawah Kamera */}
          {isCameraActive && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: '#F6F8F4',
              border: '1px solid #DDE5DC',
              borderRadius: '0.45rem',
              fontSize: '0.75rem',
              maxWidth: '680px',
              margin: '0 auto',
              width: '100%'
            }}>
              {liveBox ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#64748B' }}>Objek terdeteksi:</span>
                    <strong style={{ color: liveBox.color }}>{liveBox.label} ({liveBox.confidence}%)</strong>
                    {liveBoxes.length > 1 && (
                      <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                        +{liveBoxes.length - 1} Titik Lain
                      </span>
                    )}
                    <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                      Terlacak
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#64748B' }}>Status:</span>
                    <strong style={{ color: '#166534' }}>Pelacakan aktif</strong>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'inline-block' }} />
                    <span style={{ color: '#64748B' }}>Status kamera:</span>
                    <strong style={{ color: '#1B2A22' }}>Mencari objek di kamera...</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#64748B' }}>Arahkan ke buah atau daun melon</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Konten Uji Kematangan Buah */}
      {activeTab === 'melon' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Kolom Kiri: Input & Citra */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            border: '1px solid #DDE5DC',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1B2A22' }}>
                Foto Sampel Buah (3 Sudut)
              </h3>
              <span style={{ fontSize: '0.68rem', color: '#166534', fontWeight: 600 }}>
                Klik foto untuk memperbesar
              </span>
            </div>

            {/* Preview 3 Sudut Melon Tidak Terpotong & Interaktif */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              {/* Angle 1: Pangkal tangkai */}
              <div
                onClick={() => setPreviewImageModal({
                  src: `/static/img/real_samples/fruits/${fruitImgKey}_${melonSampleIndex}.jpg`,
                  title: 'Pangkal tangkai',
                  description: 'Tampak pangkal dan mahkota tangkai buah melon pada pohon di greenhouse.',
                  badge: `Kondisi: ${melonStage.charAt(0).toUpperCase() + melonStage.slice(1)}`
                })}
                style={{
                  border: '1px solid #DDE5DC',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  textAlign: 'center',
                  backgroundColor: '#F6F8F4',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#166534'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 101, 52, 0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDE5DC'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: '100%', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8F4', padding: '4px' }}>
                  <img
                    src={`/static/img/real_samples/fruits/${fruitImgKey}_${melonSampleIndex}.jpg`}
                    alt="Pangkal tangkai"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                    onError={e => { e.target.src = '/static/img/real_samples/fruits/fully_ripe_1.jpg'; }}
                  />
                </div>
                <small style={{ fontSize: '0.7rem', padding: '0.35rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#1B2A22', fontWeight: 600 }}>
                  Pangkal tangkai <span style={{ fontSize: '0.62rem', color: '#166534', fontWeight: 'normal' }}>(Lihat)</span>
                </small>
              </div>

              {/* Angle 2: Jaring kulit */}
              <div
                onClick={() => setPreviewImageModal({
                  src: `/static/img/real_samples/fruits/${fruitImgKey}_${(melonSampleIndex % 6) + 1}.jpg`,
                  title: 'Jaring kulit',
                  description: 'Tampak kerapatan jaring kulit buah melon.',
                  badge: `Kondisi: ${melonStage.charAt(0).toUpperCase() + melonStage.slice(1)}`
                })}
                style={{
                  border: '1px solid #DDE5DC',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  textAlign: 'center',
                  backgroundColor: '#F6F8F4',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#166534'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 101, 52, 0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDE5DC'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: '100%', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8F4', padding: '4px' }}>
                  <img
                    src={`/static/img/real_samples/fruits/${fruitImgKey}_${(melonSampleIndex % 6) + 1}.jpg`}
                    alt="Jaring kulit"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                    onError={e => { e.target.src = '/static/img/real_samples/fruits/fully_ripe_2.jpg'; }}
                  />
                </div>
                <small style={{ fontSize: '0.7rem', padding: '0.35rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#1B2A22', fontWeight: 600 }}>
                  Jaring kulit <span style={{ fontSize: '0.62rem', color: '#166534', fontWeight: 'normal' }}>(Lihat)</span>
                </small>
              </div>

              {/* Angle 3: Ujung buah */}
              <div
                onClick={() => setPreviewImageModal({
                  src: `/static/img/real_samples/fruits/${fruitImgKey}_${((melonSampleIndex + 1) % 6) + 1}.jpg`,
                  title: 'Ujung buah',
                  description: 'Tampak dasar dan keretakan ujung buah melon.',
                  badge: `Kondisi: ${melonStage.charAt(0).toUpperCase() + melonStage.slice(1)}`
                })}
                style={{
                  border: '1px solid #DDE5DC',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  textAlign: 'center',
                  backgroundColor: '#F6F8F4',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#166534'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 101, 52, 0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDE5DC'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: '100%', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8F4', padding: '4px' }}>
                  <img
                    src={`/static/img/real_samples/fruits/${fruitImgKey}_${((melonSampleIndex + 1) % 6) + 1}.jpg`}
                    alt="Ujung buah"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                    onError={e => { e.target.src = '/static/img/real_samples/fruits/fully_ripe_3.jpg'; }}
                  />
                </div>
                <small style={{ fontSize: '0.7rem', padding: '0.35rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#1B2A22', fontWeight: 600 }}>
                  Ujung buah <span style={{ fontSize: '0.62rem', color: '#166534', fontWeight: 'normal' }}>(Lihat)</span>
                </small>
              </div>
            </div>

            {/* Form Input */}
            <form onSubmit={handleMelonInfer}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1B2A22', marginBottom: '0.25rem' }}>
                  ID Buah:
                </label>
                <input
                  type="text"
                  value={melonFruitId}
                  onChange={e => setMelonFruitId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '0.4rem',
                    border: '1px solid #DDE5DC',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    color: '#1B2A22'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1B2A22', marginBottom: '0.25rem' }}>
                    Umur tanaman (hari ke-90 sampai 100):
                  </label>
                  <input
                    type="number"
                    min="85"
                    max="105"
                    value={melonAge}
                    onChange={e => setMelonAge(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '0.4rem',
                      border: '1px solid #DDE5DC',
                      fontSize: '0.8rem',
                      color: '#1B2A22'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1B2A22', marginBottom: '0.25rem' }}>
                    Kondisi Sampel:
                  </label>
                  <select
                    value={melonStage}
                    onChange={e => setMelonStage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '0.4rem',
                      border: '1px solid #DDE5DC',
                      fontSize: '0.8rem',
                      backgroundColor: '#fff',
                      color: '#1B2A22'
                    }}
                  >
                    <option value="matang">Matang</option>
                    <option value="mengkal">Mengkal (2–4 hari)</option>
                    <option value="mentah">Mentah (5–8 hari)</option>
                  </select>
                </div>
              </div>

              {/* Sample index buttons */}
              <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
                {[1, 2, 3, 4, 5, 6].map(idx => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setMelonSampleIndex(idx);
                      setMelonFruitId(`MLN-GH-1-R01-P0${idx}-F1`);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.3rem',
                      borderRadius: '0.35rem',
                      border: melonSampleIndex === idx ? '2px solid #166534' : '1px solid #DDE5DC',
                      backgroundColor: melonSampleIndex === idx ? '#ecfdf5' : '#ffffff',
                      color: melonSampleIndex === idx ? '#166534' : '#64748B',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    #{idx}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={melonLoading}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '0.4rem',
                  border: 'none',
                  backgroundColor: '#166534',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                {melonLoading ? (
                  <>
                    <ArrowsClockwise size={16} className="animate-spin" /> Memeriksa kematangan...
                  </>
                ) : (
                  <>
                    <Plant size={16} weight="bold" /> Cek Kematangan
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Kolom Kanan: Hasil Prediksi */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            border: '1px solid #DDE5DC',
            padding: '1.25rem'
          }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#1B2A22' }}>
              Hasil Pemeriksaan Buah
            </h3>

            {melonResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{
                  padding: '0.85rem',
                  borderRadius: '0.5rem',
                  backgroundColor: melonResult.tingkat_kematangan === 'matang' ? '#ecfdf5' : melonResult.tingkat_kematangan === 'mengkal' ? '#fffbeb' : '#F6F8F4',
                  border: `1px solid ${melonResult.tingkat_kematangan === 'matang' ? '#a7f3d0' : melonResult.tingkat_kematangan === 'mengkal' ? '#fde68a' : '#DDE5DC'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span className={`badge ${melonResult.tingkat_kematangan === 'matang' ? 'badge-success' : melonResult.tingkat_kematangan === 'mengkal' ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '0.82rem' }}>
                      {melonResult.tingkat_kematangan === 'matang' ? 'Matang' : melonResult.tingkat_kematangan === 'mengkal' ? 'Mengkal' : 'Mentah'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Akurasi deteksi: <strong>{melonResult.confidence}%</strong>
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#1B2A22', margin: '0.4rem 0' }}>
                    <strong>Kesiapan jual: </strong> {melonResult.tingkat_kematangan === 'matang' ? 'Siap dijual' : 'Belum siap dijual'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    {melonResult.action_advice}
                  </div>
                </div>

                {/* Sisa Hari Panen & Status Rekomendasi */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div style={{ padding: '0.6rem', backgroundColor: '#F6F8F4', borderRadius: '0.4rem', border: '1px solid #DDE5DC' }}>
                    <span style={{ color: '#64748B', display: 'block' }}>Estimasi panen:</span>
                    <strong style={{ color: '#1B2A22' }}>{melonResult.sisa_hari || '0 hari'}</strong>
                  </div>
                  <div style={{ padding: '0.6rem', backgroundColor: '#F6F8F4', borderRadius: '0.4rem', border: '1px solid #DDE5DC' }}>
                    <span style={{ color: '#64748B', display: 'block' }}>Saran tindakan:</span>
                    <strong style={{ color: melonResult.tingkat_kematangan === 'matang' ? '#047857' : '#B45309' }}>
                      {melonResult.tingkat_kematangan === 'matang' ? 'Siap panen dan kirim' : melonResult.tingkat_kematangan === 'mengkal' ? 'Pantau 2–3 hari lagi' : 'Biarkan di pohon'}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>
                Pilih sampel atau buka kamera, lalu tekan "Cek Kematangan".
              </div>
            )}
          </div>
        </div>
      )}

      {/* Konten Uji Penyakit Daun */}
      {activeTab === 'disease' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Kolom Kiri: Input & Citra Daun */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            border: '1px solid #DDE5DC',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1B2A22' }}>
                Foto Sampel Daun (3 Sudut)
              </h3>
              <span style={{ fontSize: '0.68rem', color: '#B91C1C', fontWeight: 600 }}>
                Klik foto untuk memperbesar
              </span>
            </div>

            {/* Preview 3 Sudut Daun Tidak Terpotong & Interaktif */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              {/* Angle 1: Permukaan atas daun */}
              <div
                onClick={() => setPreviewImageModal({
                  src: `/static/img/real_samples/leaves/${leafImgKey}_${diseaseSampleIndex}.jpg`,
                  title: 'Permukaan atas daun',
                  description: 'Tampak permukaan atas helai daun melon pada pohon di greenhouse.',
                  badge: `Kondisi: ${diseasePreset === 'normal' ? 'Sehat' : 'Perlu dicek'}`
                })}
                style={{
                  border: '1px solid #DDE5DC',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  textAlign: 'center',
                  backgroundColor: '#F6F8F4',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#B91C1C'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(185, 28, 28, 0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDE5DC'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: '100%', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8F4', padding: '4px' }}>
                  <img
                    src={`/static/img/real_samples/leaves/${leafImgKey}_${diseaseSampleIndex}.jpg`}
                    alt="Permukaan atas daun"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                    onError={e => { e.target.src = '/static/img/real_samples/leaves/aphid_1.jpg'; }}
                  />
                </div>
                <small style={{ fontSize: '0.7rem', padding: '0.35rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#1B2A22', fontWeight: 600 }}>
                  Permukaan atas daun <span style={{ fontSize: '0.62rem', color: '#B91C1C', fontWeight: 'normal' }}>(Lihat)</span>
                </small>
              </div>

              {/* Angle 2: Permukaan bawah daun */}
              <div
                onClick={() => setPreviewImageModal({
                  src: `/static/img/real_samples/leaves/${leafImgKey}_${(diseaseSampleIndex % 6) + 1}.jpg`,
                  title: 'Permukaan bawah daun',
                  description: 'Tampak permukaan bawah helai daun melon.',
                  badge: `Kondisi: ${diseasePreset === 'normal' ? 'Sehat' : 'Perlu dicek'}`
                })}
                style={{
                  border: '1px solid #DDE5DC',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  textAlign: 'center',
                  backgroundColor: '#F6F8F4',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#B91C1C'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(185, 28, 28, 0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDE5DC'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: '100%', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8F4', padding: '4px' }}>
                  <img
                    src={`/static/img/real_samples/leaves/${leafImgKey}_${(diseaseSampleIndex % 6) + 1}.jpg`}
                    alt="Permukaan bawah daun"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                    onError={e => { e.target.src = '/static/img/real_samples/leaves/aphid_2.jpg'; }}
                  />
                </div>
                <small style={{ fontSize: '0.7rem', padding: '0.35rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#1B2A22', fontWeight: 600 }}>
                  Permukaan bawah daun <span style={{ fontSize: '0.62rem', color: '#B91C1C', fontWeight: 'normal' }}>(Lihat)</span>
                </small>
              </div>

              {/* Angle 3: Tajuk pohon */}
              <div
                onClick={() => setPreviewImageModal({
                  src: `/static/img/real_samples/leaves/${leafImgKey}_${((diseaseSampleIndex + 1) % 6) + 1}.jpg`,
                  title: 'Tajuk pohon',
                  description: 'Tampak persebaran daun pada tajuk pohon.',
                  badge: `Kondisi: ${diseasePreset === 'normal' ? 'Sehat' : 'Perlu dicek'}`
                })}
                style={{
                  border: '1px solid #DDE5DC',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  textAlign: 'center',
                  backgroundColor: '#F6F8F4',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#B91C1C'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(185, 28, 28, 0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDE5DC'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: '100%', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8F4', padding: '4px' }}>
                  <img
                    src={`/static/img/real_samples/leaves/${leafImgKey}_${((diseaseSampleIndex + 1) % 6) + 1}.jpg`}
                    alt="Tajuk pohon"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                    onError={e => { e.target.src = '/static/img/real_samples/leaves/aphid_3.jpg'; }}
                  />
                </div>
                <small style={{ fontSize: '0.7rem', padding: '0.35rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#1B2A22', fontWeight: 600 }}>
                  Tajuk pohon <span style={{ fontSize: '0.62rem', color: '#B91C1C', fontWeight: 'normal' }}>(Lihat)</span>
                </small>
              </div>
            </div>

            {/* Form Input */}
            <form onSubmit={handleDiseaseInfer}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1B2A22', marginBottom: '0.25rem' }}>
                  ID Pohon:
                </label>
                <input
                  type="text"
                  value={diseaseTreeId}
                  onChange={e => setDiseaseTreeId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '0.4rem',
                    border: '1px solid #DDE5DC',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    color: '#1B2A22'
                  }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1B2A22', marginBottom: '0.25rem' }}>
                  Gejala Daun:
                </label>
                <select
                  value={diseasePreset}
                  onChange={e => setDiseasePreset(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '0.4rem',
                    border: '1px solid #DDE5DC',
                    fontSize: '0.8rem',
                    backgroundColor: '#fff',
                    color: '#1B2A22'
                  }}
                >
                  <option value="normal">Sehat (Daun normal)</option>
                  <option value="aphid">Kutu daun (Aphid)</option>
                  <option value="fungus">Jamur daun (Fungus)</option>
                  <option value="leaf miner">Pengorok daun (Leaf miner)</option>
                  <option value="unknown">Gejala lainnya</option>
                </select>
              </div>

              {/* Sample index buttons */}
              <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
                {[1, 2, 3, 4, 5, 6].map(idx => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setDiseaseSampleIndex(idx);
                      setDiseaseTreeId(`PHN-GH-1-R01-P0${idx}`);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.3rem',
                      borderRadius: '0.35rem',
                      border: diseaseSampleIndex === idx ? '2px solid #B91C1C' : '1px solid #DDE5DC',
                      backgroundColor: diseaseSampleIndex === idx ? '#fef2f2' : '#ffffff',
                      color: diseaseSampleIndex === idx ? '#B91C1C' : '#64748B',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    #{idx}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={diseaseLoading}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '0.4rem',
                  border: 'none',
                  backgroundColor: '#B91C1C',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                {diseaseLoading ? (
                  <>
                    <ArrowsClockwise size={16} className="animate-spin" /> Memeriksa kesehatan daun...
                  </>
                ) : (
                  <>
                    <Bug size={16} weight="bold" /> Cek Kesehatan Daun
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Kolom Kanan: Hasil Diagnosis */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            border: '1px solid #DDE5DC',
            padding: '1.25rem'
          }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#1B2A22' }}>
              Hasil Pemeriksaan Daun
            </h3>

            {diseaseResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{
                  padding: '0.85rem',
                  borderRadius: '0.5rem',
                  backgroundColor: diseaseResult.is_sakit ? '#fef2f2' : '#ecfdf5',
                  border: `1px solid ${diseaseResult.is_sakit ? '#fca5a5' : '#a7f3d0'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span className={`badge ${diseaseResult.is_sakit ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.82rem' }}>
                      {diseaseResult.is_sakit ? 'Perlu dicek' : 'Sehat'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Akurasi deteksi: <strong>{diseaseResult.confidence}%</strong>
                    </span>
                  </div>

                  {diseaseResult.is_sakit && (
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#B91C1C', margin: '0.3rem 0' }}>
                      Penyakit: {diseaseResult.nama_penyakit}
                    </div>
                  )}

                  <div style={{ fontSize: '0.74rem', color: '#1B2A22', margin: '0.3rem 0' }}>
                    <strong>Gejala: </strong> {diseaseResult.gejala}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    <strong>Saran tindakan: </strong> {diseaseResult.penanganan}
                  </div>
                </div>

                {/* Status Tanaman Operasional */}
                <div style={{ padding: '0.6rem 0.85rem', backgroundColor: '#F6F8F4', borderRadius: '0.4rem', border: '1px solid #DDE5DC', fontSize: '0.75rem' }}>
                  <span style={{ color: '#64748B' }}>Kondisi: </span>
                  <strong style={{ color: diseaseResult.is_sakit ? '#B91C1C' : '#047857' }}>
                    {diseaseResult.is_sakit ? 'Perlu dicek dan dirawat' : 'Sehat dan normal'}
                  </strong>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>
                Pilih sampel atau buka kamera, lalu tekan "Cek Kesehatan Daun".
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Zoom Foto Sampel Resolusi Penuh */}
      {previewImageModal && (
        <ImageDetailModal
          image={previewImageModal}
          onClose={() => setPreviewImageModal(null)}
        />
      )}
    </div>
  );
}
