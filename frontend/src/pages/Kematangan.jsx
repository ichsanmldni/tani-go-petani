import React, { useState, useEffect } from 'react';
import {
  Plant,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  Eye,
  MapPin,
  ChartBar
} from '@phosphor-icons/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import QrThumbnail from '../components/QrThumbnail.jsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Kematangan({ greenhouses, stats, onSelectFruit, onOpenPositionsModal }) {
  const [fruits, setFruits] = useState([]);
  const [summaryReport, setSummaryReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ghFilter, setGhFilter] = useState('all');
  const [ripenessFilter, setRipenessFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (ghFilter !== 'all') params.append('gh', ghFilter);
    if (ripenessFilter !== 'all') params.append('ripeness', ripenessFilter);
    if (searchQuery.trim()) params.append('q', searchQuery.trim());

    fetch(`/api/fruits?${params.toString()}`)
      .then(res => res.json())
      .then(d => {
        if (d.success) setFruits(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/ripeness/summary')
      .then(res => res.json())
      .then(d => {
        if (d.success) setSummaryReport(d.data);
      });
  };

  useEffect(() => {
    loadData();
  }, [ghFilter, ripenessFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenPositions = (catKey) => {
    if (!summaryReport || !summaryReport[catKey]) return;
    const catData = summaryReport[catKey];
    onOpenPositionsModal({
      title: `Posisi Pohon: Buah ${catKey === 'matang' ? 'Matang' : catKey === 'mengkal' ? 'Mengkal' : 'Mentah'} (${catData.total} Pohon)`,
      color: catKey === 'matang' ? 'green' : catKey === 'mengkal' ? 'yellow' : 'gray',
      count: catData.total,
      items: catData.positions,
      type: 'ripeness'
    });
  };

  // Sebaran tingkat kematangan chart
  const ghDist = stats?.gh_distribution || {};
  const ghLabels = Object.keys(ghDist).map(k => ghDist[k].name);
  const matangCounts = Object.keys(ghDist).map(k => ghDist[k].matang || 0);
  const mengkalCounts = Object.keys(ghDist).map(k => ghDist[k].mengkal || 0);
  const mentahCounts = Object.keys(ghDist).map(k => ghDist[k].mentah || 0);

  const sebaranChartData = {
    labels: ghLabels,
    datasets: [
      {
        label: 'Matang',
        data: matangCounts,
        backgroundColor: '#047857',
        borderRadius: 4
      },
      {
        label: 'Mengkal',
        data: mengkalCounts,
        backgroundColor: '#B45309',
        borderRadius: 4
      },
      {
        label: 'Mentah',
        data: mentahCounts,
        backgroundColor: '#64748B',
        borderRadius: 4
      }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Sebaran Panen Tiap Greenhouse */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        border: '1px solid #DDE5DC',
        padding: '1.25rem'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1B2A22', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-heading)' }}>
            <ChartBar size={18} weight="bold" color="#166534" />
            Sebaran Kematangan Tiap Greenhouse
          </h2>
        </div>

        {/* 3 Greenhouse Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
          {Object.keys(ghDist).map(gid => {
            const gh = ghDist[gid];
            const total = gh.total_fruits || 32;
            const matangPct = Math.round(((gh.matang || 0) / total) * 100);

            return (
              <div key={gid} style={{
                padding: '0.85rem 1rem',
                backgroundColor: '#F6F8F4',
                borderRadius: '0.5rem',
                border: '1px solid #DDE5DC'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.88rem', color: '#1B2A22' }}>{gh.name}</strong>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857' }}>
                    {gh.matang || 0} Matang ({matangPct}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '6px', backgroundColor: '#DDE5DC', borderRadius: '999px', overflow: 'hidden', display: 'flex', margin: '0.4rem 0' }}>
                  <div style={{ width: `${(gh.matang / total) * 100}%`, backgroundColor: '#047857' }} />
                  <div style={{ width: `${(gh.mengkal / total) * 100}%`, backgroundColor: '#B45309' }} />
                  <div style={{ width: `${(gh.mentah / total) * 100}%`, backgroundColor: '#64748B' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#52665A' }}>
                  <span>Mengkal: {gh.mengkal || 0}</span>
                  <span>Mentah: {gh.mentah || 0}</span>
                  <span>Total: {total} buah</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Simple Bar Chart */}
        <div style={{ height: '170px' }}>
          <Bar
            data={sebaranChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10.5 } } }
              },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10.5 } } },
                y: { beginAtZero: true, grid: { color: '#EDF2EC' }, ticks: { stepSize: 5, font: { size: 10 } } }
              }
            }}
          />
        </div>
      </div>

      {/* 2. Ringkasan Kesiapan Panen */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        border: '1px solid #DDE5DC',
        padding: '1.25rem'
      }}>
        <div style={{ marginBottom: '0.85rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1B2A22', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-heading)' }}>
            <MapPin size={18} weight="bold" color="#166534" />
            Ringkasan Tingkat Kematangan
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
          {/* Card Matang */}
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.5rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', color: '#166534', fontWeight: 800 }}>
                  Matang
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  Siap dijual
                </span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#166534', margin: '0.2rem 0' }}>
                {stats?.ripeness?.matang || 0} <small style={{ fontSize: '0.8rem', fontWeight: 500 }}>buah</small>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#047857' }}>
                Siap dipanen hari ini
              </p>
            </div>
            <button
              onClick={() => handleOpenPositions('matang')}
              style={{
                marginTop: '0.85rem',
                padding: '0.45rem 0.75rem',
                backgroundColor: '#166534',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <Eye size={14} weight="bold" /> Lihat pohon
            </button>
          </div>

          {/* Card Mengkal */}
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '0.5rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', color: '#B45309', fontWeight: 800 }}>
                  Mengkal
                </span>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                  Belum siap dijual
                </span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#B45309', margin: '0.2rem 0' }}>
                {stats?.ripeness?.mengkal || 0} <small style={{ fontSize: '0.8rem', fontWeight: 500 }}>buah</small>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#B45309' }}>
                Perkiraan panen 2–4 hari lagi
              </p>
            </div>
            <button
              onClick={() => handleOpenPositions('mengkal')}
              style={{
                marginTop: '0.85rem',
                padding: '0.45rem 0.75rem',
                backgroundColor: '#B45309',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <Eye size={14} weight="bold" /> Lihat pohon
            </button>
          </div>

          {/* Card Mentah */}
          <div style={{
            backgroundColor: '#F6F8F4',
            border: '1px solid #DDE5DC',
            borderRadius: '0.5rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', color: '#1B2A22', fontWeight: 800 }}>
                  Mentah
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                  Belum siap dijual
                </span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1B2A22', margin: '0.2rem 0' }}>
                {stats?.ripeness?.mentah || 0} <small style={{ fontSize: '0.8rem', fontWeight: 500 }}>buah</small>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748B' }}>
                Perkiraan panen 5–8 hari lagi
              </p>
            </div>
            <button
              onClick={() => handleOpenPositions('mentah')}
              style={{
                marginTop: '0.85rem',
                padding: '0.45rem 0.75rem',
                backgroundColor: '#475569',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <Eye size={14} weight="bold" /> Lihat pohon
            </button>
          </div>
        </div>
      </div>

      {/* 3. Tabel Hasil Scanning Buah di Pohon */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        border: '1px solid #DDE5DC',
        padding: '1.25rem'
      }}>
        {/* Filter controls */}
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
              Daftar Buah ({fruits.length} buah)
            </h2>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={ghFilter}
              onChange={e => setGhFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.65rem',
                fontSize: '0.78rem',
                borderRadius: '0.4rem',
                border: '1px solid #DDE5DC',
                backgroundColor: '#ffffff',
                color: '#1B2A22'
              }}
            >
              <option value="all">Semua greenhouse</option>
              {greenhouses.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <select
              value={ripenessFilter}
              onChange={e => setRipenessFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.65rem',
                fontSize: '0.78rem',
                borderRadius: '0.4rem',
                border: '1px solid #DDE5DC',
                backgroundColor: '#ffffff',
                color: '#1B2A22'
              }}
            >
              <option value="all">Semua status</option>
              <option value="matang">Matang</option>
              <option value="mengkal">Mengkal</option>
              <option value="mentah">Mentah</option>
            </select>

            <div style={{ position: 'relative' }}>
              <MagnifyingGlass size={15} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Cari ID pohon atau buah..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.4rem 0.65rem 0.4rem 1.7rem',
                  fontSize: '0.78rem',
                  borderRadius: '0.4rem',
                  border: '1px solid #DDE5DC',
                  color: '#1B2A22',
                  width: '170px'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '0.4rem 0.75rem',
                backgroundColor: '#166534',
                color: '#fff',
                border: 'none',
                borderRadius: '0.4rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cari
            </button>
          </form>
        </div>

        {/* Tabel */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F6F8F4', borderBottom: '1px solid #DDE5DC', color: '#1B2A22', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>ID Pohon & Buah</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>Lokasi</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>Foto Buah</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>Tingkat Kematangan</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>Status Penjualan</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    Memuat data buah...
                  </td>
                </tr>
              ) : fruits.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    Tidak ada buah yang cocok.
                  </td>
                </tr>
              ) : (
                fruits.map((f, idx) => {
                  const isMatang = f.tingkat_kematangan === 'matang';
                  const isMengkal = f.tingkat_kematangan === 'mengkal';
                  const labelKematangan = isMatang ? 'Matang' : isMengkal ? 'Mengkal' : 'Mentah';

                  return (
                    <tr
                      key={f.fruit_id}
                      style={{
                        borderBottom: '1px solid #DDE5DC',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F6F8F4'
                      }}
                    >
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <QrThumbnail text={f.qr_code || `QR-FRUIT-${f.fruit_id}`} size={32} />
                          <div>
                            <strong className="font-mono" style={{ color: '#1B2A22', display: 'block', fontSize: '0.78rem' }}>
                              {f.tree_id}
                            </strong>
                            <small className="font-mono" style={{ color: '#166534', fontSize: '0.7rem', fontWeight: 600 }}>
                              {f.fruit_id}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{ fontWeight: 600, color: '#1B2A22' }}>{f.greenhouse_name}</span>
                        <div style={{ color: '#64748B', fontSize: '0.72rem' }}>
                          {f.row} — Pohon #{f.tree_index}
                        </div>
                      </td>

                      {/* 3-Angle thumbnail strip */}
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <img src={f.angles?.angle1} title="Pangkal tangkai" alt="Pangkal tangkai" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #DDE5DC' }} />
                          <img src={f.angles?.angle2} title="Jaring kulit" alt="Jaring kulit" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #DDE5DC' }} />
                          <img src={f.angles?.angle3} title="Ujung buah" alt="Ujung buah" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #DDE5DC' }} />
                        </div>
                      </td>

                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span className={`badge ${isMatang ? 'badge-success' : isMengkal ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '0.74rem' }}>
                          {labelKematangan}
                        </span>
                      </td>

                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: isMatang ? '#047857' : '#64748B'
                        }}>
                          {isMatang ? 'Siap dijual' : 'Belum siap dijual'}
                        </span>
                      </td>

                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                        <button
                          onClick={() => onSelectFruit(f.fruit_id)}
                          style={{
                            padding: '0.35rem 0.65rem',
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
                        >
                          <Eye size={14} weight="bold" /> Lihat
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
