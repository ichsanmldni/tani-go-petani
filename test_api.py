from app import app
import json

client = app.test_client()

print("Testing Flask Test Client with all API endpoints...")

# 1. Test /api/stats
res = client.get('/api/stats')
print("1. /api/stats -> Status:", res.status_code)
assert res.status_code == 200
data = res.get_json()
print("   Total fruits:", data['data']['total_fruits'], "| Matang:", data['data']['ripeness']['matang'])
print("   Total trees:", data['data']['total_trees'], "| Sehat:", data['data']['disease']['sehat'])

# 2. Test /api/fruits
res = client.get('/api/fruits?ripeness=matang')
print("2. /api/fruits?ripeness=matang -> Status:", res.status_code)
assert res.status_code == 200
fruits = res.get_json()['data']
print("   Fetched", len(fruits), "ripe fruits. Sample fruit ID:", fruits[0]['fruit_id'])

# 3. Test /api/trees
res = client.get('/api/trees?kondisi=Sakit')
print("3. /api/trees?kondisi=Sakit -> Status:", res.status_code)
assert res.status_code == 200
trees = res.get_json()['data']
print("   Fetched", len(trees), "sick trees. Sample tree ID:", trees[0]['tree_id'])

# 4. Test /api/ripeness/summary
res = client.get('/api/ripeness/summary')
print("4. /api/ripeness/summary -> Status:", res.status_code)
assert res.status_code == 200
summary = res.get_json()['data']
print("   Matang total:", summary['matang']['total'], "| Mengkal total:", summary['mengkal']['total'], "| Mentah total:", summary['mentah']['total'])

# 5. Test /api/disease/summary (grouping by greenhouse and jalur)
res = client.get('/api/disease/summary')
print("5. /api/disease/summary -> Status:", res.status_code)
assert res.status_code == 200
gh_grouping = res.get_json()['data']
print("   Greenhouses in grouping:", list(gh_grouping.keys()))

# 6. Test /api/predict/melon
res = client.post('/api/predict/melon', data={
    'fruit_id': 'MLN-GH-1-R01-P01-F1',
    'age_days': '98',
    'force_stage': 'matang'
})
print("6. /api/predict/melon -> Status:", res.status_code)
assert res.status_code == 200
pred_melon = res.get_json()['prediction']
print("   Predicted:", pred_melon['tingkat_kematangan'], "| Marketplace:", pred_melon['marketplace_status'])

# 7. Test /api/predict/disease
res = client.post('/api/predict/disease', data={
    'tree_id': 'PHN-GH-1-R01-P01',
    'force_disease': 'aphid'
})
print("7. /api/predict/disease -> Status:", res.status_code)
assert res.status_code == 200
pred_dis = res.get_json()['prediction']
print("   Predicted:", pred_dis['kondisi'], "| Diagnosa:", pred_dis['nama_penyakit'])

# 8. Test React dist index serving
res = client.get('/')
print("8. Root React App (GET /) -> Status:", res.status_code)
assert res.status_code == 200
print("   Contains AgroMelon AI root:", ("AgroMelon AI" in res.text or "id=\"root\"" in res.text))

# 9. Test ROKAE XMS5-R800 Robot Telemetry
res = client.get('/api/rokae/status')
print("9. /api/rokae/status -> Status:", res.status_code)
assert res.status_code == 200
rokae_data = res.get_json()['data']
print("   Robot Model:", rokae_data['model'], "| End-Effector:", rokae_data['end_effector'])
print("   Modbus Register:", rokae_data['modbus_register'], "(Addr", rokae_data['modbus_address'], ")")

# 10. Test ROKAE Modbus Send
res = client.post('/api/rokae/send', json={'value': 2, 'label': 'Matang (Fully Ripe)'})
print("10. /api/rokae/send -> Status:", res.status_code)
assert res.status_code == 200
print("   Modbus Result:", res.get_json()['result']['message'])

print("\nALL 10 TESTS PASSED WITH 100% SUCCESS!")

