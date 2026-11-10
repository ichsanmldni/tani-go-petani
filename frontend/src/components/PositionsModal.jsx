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

  const { title, count, items = [], type = 'ripeness' } = data;
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

  const filteredItems = items.filter(it => {
    const matchesSearch = !searchTerm.trim() ||
      (it.fruit_id && it.fruit_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (it.tree_id && it.tree_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (it.row && it.row.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (it.greenhouse_name && it.greenhouse_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGh = selectedGh === 'all' || it.greenhouse_id === selectedGh;
    return matchesSearch && matchesGh;
  });

  return (
    <div
      onClick={onClose}
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
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          maxWidth: '860px',
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
              border: '1px solid #bbf7d0'
            }}>
              <MapPin size={22} weight="bold" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1B2A22' }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                Lokasi pohon di kebun ({filteredItems.length} dari {count || items.length} pohon)
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
          <div style={{ position: 'relative', width: '240px' }}>
            <MagnifyingGlass size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Cari ID atau jalur..."
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
                color: '#1B2A22'
              }}
            >
              <option value="all">Semua greenhouse</option>
              <option value="GH-1">Greenhouse Sakura (Ciwidey)</option>
              <option value="GH-2">Greenhouse Maribaya (Lembang)</option>
              <option value="GH-3">Greenhouse Cisondari (Pasirjambu)</option>
            </select>
          </div>
        </div>

        {/* Tabel Posisi Pohon */}
        <div style={{ padding: '1.25rem 1.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F6F8F4', borderBottom: '1px solid #DDE5DC', color: '#1B2A22', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>No</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Greenhouse</th>
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
                const labelKondisi = isSick ? 'Perlu dicek' : 'Sehat';

                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #DDE5DC',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F6F8F4'
                    }}
                  >
                    <td style={{ padding: '0.65rem 0.85rem', color: '#64748B' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem', color: '#1B2A22' }}>
                      {item.greenhouse_name || item.greenhouse_id}
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.68rem', marginRight: '4px' }}>
                        {item.row || `Jalur ${item.row_index}`}
                      </span>
                      <strong style={{ color: '#1B2A22' }}>#{item.tree_index}</strong>
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <QrThumbnail text={item.tree_qr || item.qr_code || item.tree_id} size={32} />
                        <div>
                          <div className="font-mono" style={{ fontSize: '0.76rem', color: '#1B2A22', fontWeight: 700 }}>
                            {item.tree_id}
                          </div>
                          <div className="font-mono" style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 600 }}>
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
                      ) : (
                        <span className={`badge ${isSick ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                          {labelKondisi}
                        </span>
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
                          <Eye size={13} weight="bold" /> Lihat penyakit
                        </button>
                      ) : (
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
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                    Tidak ada pohon yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
