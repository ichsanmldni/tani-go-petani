import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  MagnifyingGlass,
  Eye,
  Warehouse
} from '@phosphor-icons/react';
import QrThumbnail from './QrThumbnail.jsx';

export default function PositionsModal({ data, onClose, onSelectFruit, onSelectTree }) {
  if (!data) return null;

  const { title = 'Peta Sebaran Posisi Pohon & Buah', count, type = 'all' } = data;
  const [items, setItems] = useState(Array.isArray(data.items) && data.items.length > 0 ? data.items : []);
  const [loading, setLoading] = useState(!Array.isArray(data.items) || data.items.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGh, setSelectedGh] = useState('all');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch / combine items if not passed or empty
  useEffect(() => {
    if (Array.isArray(data.items) && data.items.length > 0) {
      setItems(data.items);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      fetch('/api/fruits').then(r => r.json()).catch(() => ({ success: false })),
      fetch('/api/trees').then(r => r.json()).catch(() => ({ success: false }))
    ]).then(([fruitsRes, treesRes]) => {
      const fruitsList = (fruitsRes && fruitsRes.success && Array.isArray(fruitsRes.data)) ? fruitsRes.data : [];
      const treesList = (treesRes && treesRes.success && Array.isArray(treesRes.data)) ? treesRes.data : [];

      const treeMap = new Map();
      treesList.forEach(t => {
        if (t.tree_id) treeMap.set(t.tree_id, t);
      });

      let combined = [];

      if (fruitsList.length > 0) {
        combined = fruitsList.map(f => {
          const t = treeMap.get(f.tree_id) || {};
          return {
            ...f,
            tree_id: f.tree_id || t.tree_id,
            tree_qr: t.qr_code || f.qr_tree || `QR-TREE-${f.tree_id}`,
            fruit_id: f.fruit_id || t.fruit_id,
            qr_code: f.qr_code || `QR-FRUIT-${f.fruit_id}`,
            greenhouse_id: f.greenhouse_id || t.greenhouse_id,
            greenhouse_name: f.greenhouse_name || t.greenhouse_name,
            row: f.row || t.row,
            row_index: f.row_index || t.row_index,
            tree_index: f.tree_index || t.tree_index,
            tingkat_kematangan: f.tingkat_kematangan,
            kondisi: t.kondisi || 'Sehat',
            nama_penyakit: t.nama_penyakit || (t.kondisi === 'Sakit' ? 'Gejala Infeksi' : 'Normal (Tanaman Sehat)')
          };
        });
      } else if (treesList.length > 0) {
        combined = treesList.map(t => ({
          ...t,
          tree_qr: t.qr_code || `QR-TREE-${t.tree_id}`,
          tingkat_kematangan: 'matang'
        }));
      }

      // Filter based on data request
      if (data.filter === 'sakit' || (data.type === 'disease' && data.color === 'red')) {
        combined = combined.filter(it => it.kondisi === 'Sakit' || it.kondisi === 'sakit');
      } else if (data.filter === 'sehat' || (data.type === 'disease' && data.color === 'green')) {
        combined = combined.filter(it => it.kondisi === 'Sehat' || it.kondisi === 'sehat');
      } else if (data.filter === 'matang') {
        combined = combined.filter(it => it.tingkat_kematangan === 'matang');
      } else if (data.filter === 'mengkal') {
        combined = combined.filter(it => it.tingkat_kematangan === 'mengkal');
      } else if (data.filter === 'mentah') {
        combined = combined.filter(it => it.tingkat_kematangan === 'mentah');
      }

      setItems(combined);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching positions in PositionsModal:', err);
      setLoading(false);
    });
  }, [data]);

  const filteredItems = items.filter(it => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q ||
      (it.fruit_id && it.fruit_id.toLowerCase().includes(q)) ||
      (it.tree_id && it.tree_id.toLowerCase().includes(q)) ||
      (it.qr_code && it.qr_code.toLowerCase().includes(q)) ||
      (it.tree_qr && it.tree_qr.toLowerCase().includes(q)) ||
      (it.row && it.row.toLowerCase().includes(q)) ||
      (it.nama_penyakit && it.nama_penyakit.toLowerCase().includes(q)) ||
      (it.kondisi && it.kondisi.toLowerCase().includes(q)) ||
      (it.tingkat_kematangan && it.tingkat_kematangan.toLowerCase().includes(q)) ||
      (it.greenhouse_name && it.greenhouse_name.toLowerCase().includes(q));

    let matchesGh = selectedGh === 'all';
    if (!matchesGh) {
      if (it.greenhouse_id === selectedGh) {
        matchesGh = true;
      } else if (selectedGh === 'GH-1' && it.greenhouse_name?.toLowerCase().includes('sakura')) {
        matchesGh = true;
      } else if (selectedGh === 'GH-2' && it.greenhouse_name?.toLowerCase().includes('maribaya')) {
        matchesGh = true;
      } else if (selectedGh === 'GH-3' && it.greenhouse_name?.toLowerCase().includes('cisondari')) {
        matchesGh = true;
      }
    }

    return matchesSearch && matchesGh;
  });

  return (
    <div
      onClick={onClose}
      className="modal-sheet-container"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(27, 42, 34, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-sheet-box"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          maxWidth: '920px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #DDE5DC',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header Modal Bersih & Elegan */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #DDE5DC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #bbf7d0',
              flexShrink: 0
            }}>
              <MapPin size={22} weight="bold" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1B2A22' }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                {loading
                  ? 'Sedang memuat data sebaran...'
                  : `Lokasi pohon di kebun (${filteredItems.length} dari ${items.length || count || 0} pohon terdaftar)`
                }
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup modal"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#F6F8F4',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DDE5DC'; e.currentTarget.style.color = '#1B2A22'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F6F8F4'; e.currentTarget.style.color = '#64748B'; }}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{
          padding: '0.85rem 1.5rem',
          backgroundColor: '#F6F8F4',
          borderBottom: '1px solid #DDE5DC',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <MagnifyingGlass size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Cari ID pohon, buah, QR, jalur..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.4rem 0.75rem 0.4rem 2rem',
                fontSize: '0.78rem',
                borderRadius: '0.4rem',
                border: '1px solid #DDE5DC',
                outline: 'none',
                color: '#1B2A22',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Warehouse size={15} color="#166534" />
            <select
              value={selectedGh}
              onChange={e => setSelectedGh(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.78rem',
                borderRadius: '0.4rem',
                border: '1px solid #DDE5DC',
                backgroundColor: '#ffffff',
                color: '#1B2A22',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="all">Semua Kebun</option>
              <option value="GH-1">Kebun Sakura (Ciwidey)</option>
              <option value="GH-2">Kebun Maribaya (Lembang)</option>
              <option value="GH-3">Kebun Cisondari (Pasirjambu)</option>
            </select>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #DDE5DC',
              borderTopColor: '#166534',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600, color: '#1B2A22' }}>
              Memuat data sebaran titik pohon & buah kebun...
            </p>
          </div>
        ) : (
          <div style={{ padding: '1.25rem 1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F6F8F4', borderBottom: '1px solid #DDE5DC', color: '#1B2A22', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, width: '45px' }}>No</th>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Kebun</th>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Jalur & Nomor</th>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>ID Pohon & Buah</th>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 700 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const isMatang = item.tingkat_kematangan === 'matang';
                  const isMengkal = item.tingkat_kematangan === 'mengkal';
                  const labelKematangan = isMatang ? 'Matang' : isMengkal ? 'Mengkal' : 'Mentah';
                  const isSick = item.kondisi === 'Sakit' || item.kondisi === 'sakit';
                  const labelKondisi = isSick ? (item.nama_penyakit ? `Sakit · ${item.nama_penyakit}` : 'Sakit') : 'Sehat';

                  return (
                    <tr
                      key={item.tree_id ? `${item.tree_id}-${idx}` : idx}
                      style={{
                        borderBottom: '1px solid #DDE5DC',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F6F8F4'
                      }}
                    >
                      <td style={{ padding: '0.65rem 0.85rem', color: '#64748B' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', color: '#1B2A22' }}>
                        <span style={{ fontWeight: 600 }}>{item.greenhouse_name || item.greenhouse_id}</span>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.68rem', marginRight: '4px' }}>
                          {item.row || `Jalur ${item.row_index || 1}`}
                        </span>
                        <strong style={{ color: '#1B2A22' }}>#{item.tree_index || 1}</strong>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <QrThumbnail text={item.tree_qr || item.qr_code || item.tree_id} size={32} />
                          <div>
                            <div className="font-mono" style={{ fontSize: '0.76rem', color: '#1B2A22', fontWeight: 700 }}>
                              {item.tree_id}
                            </div>
                            <div className="font-mono" style={{ fontSize: '0.7rem', color: isSick ? '#B91C1C' : '#166534', fontWeight: 600 }}>
                              {item.tree_qr || item.qr_code || item.tree_id}
                            </div>
                            {item.fruit_id && (
                              <small className="font-mono" style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>
                                Buah: {item.fruit_id}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        {type === 'ripeness' ? (
                          <span className={`badge ${isMatang ? 'badge-success' : isMengkal ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                            {labelKematangan}
                          </span>
                        ) : type === 'disease' ? (
                          <span className={`badge ${isSick ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                            {labelKondisi}
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                            <span className={`badge ${isMatang ? 'badge-success' : isMengkal ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                              Buah: {labelKematangan}
                            </span>
                            <span className={`badge ${isSick ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                              Daun: {labelKondisi}
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                        {type === 'disease' ? (
                          <button
                            onClick={() => {
                              onClose();
                              if (onSelectTree && item.tree_id) {
                                onSelectTree(item.tree_id);
                              }
                            }}
                            style={{
                              padding: '0.35rem 0.75rem',
                              backgroundColor: isSick ? '#B91C1C' : '#047857',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '0.35rem',
                              fontSize: '0.73rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <Eye size={13} weight="bold" /> Lihat detail
                          </button>
                        ) : type === 'ripeness' ? (
                          <button
                            onClick={() => {
                              onClose();
                              if (onSelectFruit && item.fruit_id) {
                                onSelectFruit(item.fruit_id);
                              }
                            }}
                            style={{
                              padding: '0.35rem 0.75rem',
                              backgroundColor: '#166534',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '0.35rem',
                              fontSize: '0.73rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <Eye size={13} weight="bold" /> Lihat buah
                          </button>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: '4px', justifyContent: 'center' }}>
                            {item.fruit_id && (
                              <button
                                onClick={() => {
                                  onClose();
                                  if (onSelectFruit) onSelectFruit(item.fruit_id);
                                }}
                                style={{
                                  padding: '0.3rem 0.55rem',
                                  backgroundColor: '#166534',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '0.35rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                                title="Lihat rincian kematangan buah"
                              >
                                <Eye size={12} weight="bold" /> Buah
                              </button>
                            )}
                            {item.tree_id && (
                              <button
                                onClick={() => {
                                  onClose();
                                  if (onSelectTree) onSelectTree(item.tree_id);
                                }}
                                style={{
                                  padding: '0.3rem 0.55rem',
                                  backgroundColor: isSick ? '#B91C1C' : '#047857',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '0.35rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                                title="Lihat rincian kesehatan daun pohon"
                              >
                                <Eye size={12} weight="bold" /> Daun
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                      Tidak ada pohon yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
