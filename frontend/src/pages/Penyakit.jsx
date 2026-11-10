import React, { useState, useEffect } from 'react';
import {
  Plant,
  ShieldWarning,
  ShieldCheck,
  MagnifyingGlass,
  Warehouse,
  Eye,
  Clock
} from '@phosphor-icons/react';
import QrThumbnail from '../components/QrThumbnail.jsx';

export default function Penyakit({ greenhouses, stats, onSelectTree, onOpenPositionsModal }) {
  const [trees, setTrees] = useState([]);
  const [diseaseGrouping, setDiseaseGrouping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ghFilter, setGhFilter] = useState('all');
  const [kondisiFilter, setKondisiFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (ghFilter !== 'all') params.append('gh', ghFilter);
    if (kondisiFilter !== 'all') params.append('kondisi', kondisiFilter);
    if (searchQuery.trim()) params.append('q', searchQuery.trim());

    fetch(`/api/trees?${params.toString()}`)
      .then(res => res.json())
      .then(d => {
        if (d.success) setTrees(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/disease/summary')
      .then(res => res.json())
      .then(d => {
        if (d.success) setDiseaseGrouping(d.data);
      });
  };

  useEffect(() => {
    loadData();
  }, [ghFilter, kondisiFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenRowPositions = (ghName, rowName, items = [], type) => {
    const safeItems = Array.isArray(items) ? items : [];
    onOpenPositionsModal({
      title: `Posisi Pohon ${type === 'sakit' ? 'Perlu Dicek' : 'Sehat'}: ${ghName} — ${rowName}`,
      color: type === 'sakit' ? 'red' : 'green',
      count: safeItems.length,
      items: safeItems.map(it => ({
        ...it,
        greenhouse_name: ghName,
        row: rowName
      })),
      type: 'disease'
    });
  };

  const sehatCount = stats?.disease?.sehat || 0;
  const sakitCount = stats?.disease?.sakit || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Ringkasan Sederhana (2 Kartu KPI) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.15rem 1.25rem',
          border: '1px solid #DDE5DC',
          borderLeft: '4px solid #047857'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Pohon Sehat</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#047857', margin: '0.2rem 0' }}>
                {sehatCount} <small style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>pohon</small>
              </div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: '#ecfdf5', borderRadius: '8px', color: '#047857' }}>
              <ShieldCheck size={24} weight="bold" />
            </div>
          </div>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.75rem' }}>
            Daun normal
          </p>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.15rem 1.25rem',
          border: '1px solid #DDE5DC',
          borderLeft: '4px solid #B91C1C'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Perlu Dicek</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#B91C1C', margin: '0.2rem 0' }}>
                {sakitCount} <small style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>pohon</small>
              </div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#B91C1C' }}>
              <ShieldWarning size={24} weight="bold" />
            </div>
          </div>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.75rem' }}>
            Segera tangani atau sanitasi
          </p>
        </div>
      </div>

      {/* Tabel Monitoring Penyakit Daun */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        border: '1px solid #DDE5DC',
        padding: '1.25rem'
      }}>
        {/* Kontrol Filter & Pencarian */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.6rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1B2A22' }}>
              Daftar Pemeriksaan Daun ({(trees || []).length} pohon)
            </h2>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', width: '100%', maxWidth: '650px' }}>
            <select
              value={ghFilter}
              onChange={e => setGhFilter(e.target.value)}
              style={{
                flex: '1 1 140px',
                height: '36px',
                padding: '0.4rem 0.65rem',
                fontSize: '0.78rem',
                borderRadius: '0.4rem',
                border: '1px solid #DDE5DC',
                backgroundColor: '#ffffff',
                color: '#1B2A22'
              }}
            >
              <option value="all">Semua greenhouse</option>
              {(greenhouses || []).map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <select
              value={kondisiFilter}
              onChange={e => setKondisiFilter(e.target.value)}
              style={{
                flex: '1 1 120px',
                height: '36px',
                padding: '0.4rem 0.65rem',
                fontSize: '0.78rem',
                borderRadius: '0.4rem',
                border: '1px solid #DDE5DC',
                backgroundColor: '#ffffff',
                color: '#1B2A22'
              }}
            >
              <option value="all">Semua kondisi</option>
              <option value="Sehat">Sehat</option>
              <option value="Sakit">Perlu dicek</option>
            </select>

            <div style={{ position: 'relative', flex: '1 1 180px' }}>
              <MagnifyingGlass size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Cari ID pohon / jalur..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  boxSizing: 'border-box',
                  padding: '0.4rem 0.65rem 0.4rem 2rem',
                  fontSize: '0.78rem',
                  borderRadius: '0.4rem',
                  border: '1px solid #DDE5DC',
                  outline: 'none',
                  color: '#1B2A22'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                height: '36px',
                padding: '0 1rem',
                backgroundColor: '#166534',
                color: '#fff',
                border: 'none',
                borderRadius: '0.4rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Cari
            </button>
          </form>
        </div>

        {/* Desktop Table View */}
        <div className="desktop-only" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F6F8F4', borderBottom: '1px solid #DDE5DC', color: '#1B2A22', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>ID Pohon & QR</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Greenhouse</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Jalur & Nomor</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Waktu Cek</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Kondisi</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 700 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    Memuat data monitoring pohon...
                  </td>
                </tr>
              ) : (Array.isArray(trees) ? trees : []).length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    Tidak ada pohon yang cocok.
                  </td>
                </tr>
              ) : (
                (Array.isArray(trees) ? trees : []).map((t, idx) => {
                  const isSick = t.kondisi === 'Sakit';

                  return (
                    <tr
                      key={t.tree_id}
                      style={{
                        borderBottom: '1px solid #DDE5DC',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F6F8F4'
                      }}
                    >
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <QrThumbnail text={t.qr_code || `QR-TREE-${t.tree_id}`} size={32} />
                          <div>
                            <strong className="font-mono" style={{ color: '#1B2A22', display: 'block', fontSize: '0.78rem' }}>
                              {t.tree_id}
                            </strong>
                            <small className="font-mono" style={{ color: '#166534', fontSize: '0.7rem', fontWeight: 600 }}>
                              {t.qr_code}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.65rem 0.85rem', color: '#1B2A22' }}>
                        {t.greenhouse_name}
                      </td>

                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.7rem', marginRight: '6px' }}>
                          {t.row}
                        </span>
                        <span style={{ color: '#1B2A22', fontWeight: 600 }}>#{t.tree_index}</span>
                      </td>

                      <td style={{ padding: '0.65rem 0.85rem', color: '#64748B' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} color="#64748B" />
                          <span>{t.last_scan_time}</span>
                        </div>
                      </td>

                      {/* Kondisi: Hanya menampilkan Sehat atau Perlu dicek */}
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <span className={`badge ${isSick ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                          {isSick ? 'Perlu dicek' : 'Sehat'}
                        </span>
                      </td>

                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                        <button
                          onClick={() => onSelectTree(t.tree_id)}
                          style={{
                            padding: '0.35rem 0.7rem',
                            backgroundColor: isSick ? '#B91C1C' : '#047857',
                            color: '#ffffff',
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
                          <Eye size={14} weight="bold" /> Lihat penyakit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile-First Card View (Screens <= 768px) */}
        <div className="mobile-only" style={{ display: 'none' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
              Memuat data monitoring pohon...
            </div>
          ) : (Array.isArray(trees) ? trees : []).length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
              Tidak ada pohon yang cocok.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(Array.isArray(trees) ? trees : []).map((t) => {
                const isSick = t.kondisi === 'Sakit';

                return (
                  <div key={t.tree_id} className="mobile-data-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <QrThumbnail text={t.qr_code || `QR-TREE-${t.tree_id}`} size={38} />
                        <div>
                          <strong className="font-mono" style={{ color: '#1B2A22', fontSize: '0.84rem', display: 'block', lineHeight: 1.2 }}>
                            {t.tree_id}
                          </strong>
                          <small className="font-mono" style={{ color: '#64748B', fontSize: '0.72rem' }}>
                            {t.qr_code}
                          </small>
                        </div>
                      </div>
                      <span className={`badge ${isSick ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.74rem', fontWeight: 700, flexShrink: 0 }}>
                        {isSick ? 'Perlu dicek' : 'Sehat'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: '#F6F8F4', borderRadius: '0.45rem', fontSize: '0.74rem' }}>
                      <span style={{ color: '#1B2A22', fontWeight: 600 }}>{t.greenhouse_name}</span>
                      <span style={{ color: '#64748B' }}>{t.row} • #{t.tree_index}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#64748B' }}>
                        <Clock size={12} />
                        <span>{t.last_scan_time}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectTree(t.tree_id)}
                      style={{
                        width: '100%',
                        height: '36px',
                        backgroundColor: isSick ? '#B91C1C' : '#047857',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.45rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Eye size={16} weight="bold" /> Lihat Detail Penyakit
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary Sakit dan Sehat Grouping by Greenhouse dan Jalur */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        border: '1px solid #DDE5DC',
        padding: '1.25rem'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1B2A22', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Warehouse size={18} weight="bold" color="#166534" />
            Ringkasan per Greenhouse dan Jalur
          </h2>
        </div>

        {diseaseGrouping && Object.keys(diseaseGrouping).map(gid => {
          const ghGroup = diseaseGrouping[gid];
          return (
            <div key={gid} style={{ marginBottom: '1.25rem', border: '1px solid #DDE5DC', borderRadius: '0.6rem', overflow: 'hidden' }}>
              {/* Header Greenhouse */}
              <div style={{
                backgroundColor: '#F6F8F4',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #DDE5DC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Warehouse size={16} weight="bold" color="#166534" />
                  <strong style={{ fontSize: '0.88rem', color: '#1B2A22' }}>{ghGroup.greenhouse_name}</strong>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                    {ghGroup.total_sehat} Sehat
                  </span>
                  <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                    {ghGroup.total_sakit} Perlu dicek
                  </span>
                </div>
              </div>

              {/* Jalur-jalur dalam Greenhouse */}
              <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {ghGroup.rows && Object.keys(ghGroup.rows).map(rKey => {
                  const rData = ghGroup.rows[rKey] || {};
                  const rowName = rData.row_name || rKey;
                  const sickList = Array.isArray(rData.sakit_trees) ? rData.sakit_trees : (Array.isArray(rData.sakit) ? rData.sakit : []);
                  const healthyList = Array.isArray(rData.sehat_trees) ? rData.sehat_trees : (Array.isArray(rData.sehat) ? rData.sehat : []);
                  const sickCount = typeof rData.sakit_count === 'number' ? rData.sakit_count : sickList.length;
                  const healthyCount = typeof rData.sehat_count === 'number' ? rData.sehat_count : healthyList.length;
                  const totalRowTrees = (healthyCount + sickCount) || 8;

                  return (
                    <div
                      key={rKey}
                      style={{
                        padding: '0.75rem 0.9rem',
                        backgroundColor: sickCount > 0 ? '#fffdfd' : '#fcfdfc',
                        border: `1px solid ${sickCount > 0 ? '#fecaca' : '#DDE5DC'}`,
                        borderRadius: '0.5rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.6rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{rowName}</span>
                          <strong style={{ fontSize: '0.82rem', color: '#1B2A22' }}>
                            {healthyCount} Sehat · {sickCount} Perlu dicek
                          </strong>
                        </div>
                        <small style={{ color: '#64748B', fontSize: '0.72rem', display: 'block', marginTop: '2px' }}>
                          {totalRowTrees} pohon · {healthyCount} sehat · {sickCount} perlu dicek
                        </small>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {sickCount > 0 && (
                          <button
                            onClick={() => handleOpenRowPositions(ghGroup.greenhouse_name, rowName, sickList, 'sakit')}
                            style={{
                              padding: '0.35rem 0.65rem',
                              backgroundColor: '#fee2e2',
                              color: '#B91C1C',
                              border: '1px solid #fca5a5',
                              borderRadius: '0.35rem',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <ShieldWarning size={14} weight="bold" /> Perlu dicek ({sickCount})
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenRowPositions(ghGroup.greenhouse_name, rowName, healthyList, 'sehat')}
                          style={{
                            padding: '0.35rem 0.65rem',
                            backgroundColor: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            borderRadius: '0.35rem',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <ShieldCheck size={14} weight="bold" /> Sehat ({healthyCount})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
