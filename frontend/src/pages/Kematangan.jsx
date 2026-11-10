import React, { useState, useEffect, useMemo } from 'react';
import {
  Plant,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  Eye,
  ArrowUpRight,
  QrCode,
  Table as TableIcon,
  SquaresFour,
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import QrThumbnail from '../components/QrThumbnail.jsx';
import GaugeArc from '../components/GaugeArc.jsx';
import CapsuleBarChart from '../components/CapsuleBarChart.jsx';

export default function Kematangan({
  greenhouses,
  stats,
  onSelectFruit,
  onOpenPositionsModal,
  onNavigateTab,
  globalSearchQuery = ''
}) {
  const [fruits, setFruits] = useState([]);
  const [summaryReport, setSummaryReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ghFilter, setGhFilter] = useState('all');
  const [ripenessFilter, setRipenessFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState(globalSearchQuery || '');
  const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'table'));
  const [activeGhGauge, setActiveGhGauge] = useState('all');

  useEffect(() => {
    if (globalSearchQuery) setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery]);

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

  const handleOpenPositions = (catKey) => {
    if (!summaryReport || !summaryReport[catKey]) {
      onOpenPositionsModal({
        title: `Posisi Pohon: Buah ${catKey === 'matang' ? 'Matang' : catKey === 'mengkal' ? 'Mengkal' : 'Mentah'}`,
        color: catKey === 'matang' ? 'green' : catKey === 'mengkal' ? 'yellow' : 'gray',
        count: stats?.ripeness?.[catKey] || 0,
        type: 'ripeness'
      });
      return;
    }
    const catData = summaryReport[catKey];
    onOpenPositionsModal({
      title: `Posisi Pohon: Buah ${catKey === 'matang' ? 'Matang' : catKey === 'mengkal' ? 'Mengkal' : 'Mentah'} (${catData.total} Pohon)`,
      color: catKey === 'matang' ? 'green' : catKey === 'mengkal' ? 'yellow' : 'gray',
      count: catData.total,
      items: catData.positions,
      type: 'ripeness'
    });
  };

  const matangCount = stats?.ripeness?.matang || 28;
  const mengkalCount = stats?.ripeness?.mengkal || 36;
  const mentahCount = stats?.ripeness?.mentah || 32;
  const totalFruits = stats?.total_fruits || 96;
  const healthyPct = Math.round(stats?.disease?.sehat_pct || 77);
  const harvestReadyCount = matangCount + mengkalCount;
  const harvestReadyPct = totalFruits > 0 ? Math.round((harvestReadyCount / totalFruits) * 100) : 0;

  // Filtered fruits for display
  const displayedFruits = useMemo(() => {
    let result = fruits;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(f =>
        f.fruit_id?.toLowerCase().includes(q) ||
        f.tree_id?.toLowerCase().includes(q) ||
        f.greenhouse_name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [fruits, searchQuery]);

  // Sebaran tingkat kematangan per greenhouse
  const ghDist = stats?.gh_distribution || {
    'GH-1': { name: 'Greenhouse Sakura (Ciwidey)', matang: 11, mengkal: 14, mentah: 7, total_fruits: 32 },
    'GH-2': { name: 'Greenhouse Maribaya (Lembang)', matang: 10, mengkal: 12, mentah: 10, total_fruits: 32 },
    'GH-3': { name: 'Greenhouse Cisondari (Pasirjambu)', matang: 7, mengkal: 10, mentah: 15, total_fruits: 32 }
  };

  const ghKeys = Object.keys(ghDist);
  const ghShortLabels = ghKeys.map(k => {
    const fullName = ghDist[k].name || k;
    if (fullName.includes('Sakura')) return 'Greenhouse Sakura';
    if (fullName.includes('Maribaya')) return 'Greenhouse Maribaya';
    if (fullName.includes('Cisondari')) return 'Greenhouse Cisondari';
    return fullName;
  });

  // Dynamic readiness metrics for Card B (Kesiapan Panen per Greenhouse)
  const gaugeData = useMemo(() => {
    if (activeGhGauge !== 'all' && ghDist[activeGhGauge]) {
      const g = ghDist[activeGhGauge];
      const total = g.total_fruits || 32;
      const matang = g.matang || 0;
      const mengkal = g.mengkal || 0;
      const mentah = g.mentah || 0;
      const readyPct = total > 0 ? Math.round(((matang + mengkal) / total) * 100) : 0;
      const friendlyName = g.name.includes('Sakura') ? 'Greenhouse Sakura' : g.name.includes('Maribaya') ? 'Greenhouse Maribaya' : 'Greenhouse Cisondari';

      return {
        pct: readyPct,
        label: `Kesiapan ${friendlyName}`,
        sublabel: `${matang} Matang · ${mengkal} Menuju Panen (${total} Buah)`,
        matang,
        mengkal,
        mentah,
        total,
        name: friendlyName,
        isSpecific: true
      };
    }

    return {
      pct: harvestReadyPct,
      label: 'Kesiapan Seluruh Kebun',
      sublabel: `${matangCount} Matang · ${mengkalCount} Menuju Panen (${totalFruits} Buah)`,
      matang: matangCount,
      mengkal: mengkalCount,
      mentah: mentahCount,
      total: totalFruits,
      name: 'Semua Greenhouse',
      isSpecific: false
    };
  }, [activeGhGauge, ghDist, harvestReadyPct, matangCount, mengkalCount, mentahCount, totalFruits]);

  const sebaranChartData = useMemo(() => ({
    labels: ghShortLabels,
    datasets: [
      {
        label: 'Matang (Siap Petik)',
        data: ghKeys.map(k => ghDist[k].matang || 0),
        backgroundColor: '#166534',
        borderRadius: 6,
        barPercentage: 0.65,
        categoryPercentage: 0.7
      },
      {
        label: 'Mengkal (Booking)',
        data: ghKeys.map(k => ghDist[k].mengkal || 0),
        backgroundColor: '#F59E0B',
        borderRadius: 6,
        barPercentage: 0.65,
        categoryPercentage: 0.7
      },
      {
        label: 'Mentah (Pertumbuhan)',
        data: ghKeys.map(k => ghDist[k].mentah || 0),
        backgroundColor: '#94A3B8',
        borderRadius: 6,
        barPercentage: 0.65,
        categoryPercentage: 0.7
      }
    ]
  }), [ghDist]);

  const sebaranChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11, family: 'Inter, sans-serif', weight: 600 },
          color: '#475569',
          padding: 14
        }
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { size: 12, family: 'Plus Jakarta Sans', weight: 'bold' },
        bodyFont: { size: 11, family: 'Inter' },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label.split(' ')[0]}: ${ctx.raw} Buah`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter', weight: 600 }, color: '#475569' }
      },
      y: {
        beginAtZero: true,
        max: 18,
        grid: { color: '#F1F5F9' },
        ticks: { stepSize: 5, font: { size: 10.5, family: 'Inter' }, color: '#94A3B8' },
        border: { dash: [4, 4] }
      }
    }
  }), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* 1. Header Bar: Title + Subtitle */}
      <div>
        <h1 style={{
          fontSize: '1.55rem',
          fontWeight: 800,
          color: 'var(--text-main, #0F172A)',
          margin: '0 0 0.25rem 0',
          letterSpacing: '-0.025em',
          fontFamily: 'var(--font-heading)'
        }}>
          Dashboard Kematangan Buah
        </h1>
        <p style={{
          fontSize: '0.82rem',
          color: 'var(--text-dim, #64748B)',
          margin: 0,
          lineHeight: 1.4
        }}>
          Pantau kematangan buah melon di pohon pada seluruh greenhouse hidroponik.
        </p>
      </div>

      {/* 2. Top Row: 4 Bento Stat Cards (Hero Highlight Card in Dark Forest Green) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: HERO HIGHLIGHT CARD (Deep Green #14532D) */}
        <div
          onClick={() => handleOpenPositions('matang')}
          className="bento-card bento-hero-green bento-card-interactive"
          title="Klik untuk melihat sebaran posisi pohon buah matang"
          style={{ overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#E2E8F0' }}>
              Total Buah Matang
            </span>
            <div className="bento-circle-arrow">
              <ArrowUpRight size={15} weight="bold" />
            </div>
          </div>

          <div style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            lineHeight: 1,
            marginBottom: '0.75rem',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.03em'
          }}>
            {matangCount}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: 'rgba(255, 255, 255, 0.16)',
            borderRadius: '999px',
            padding: '3px 9px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#FFFFFF'
          }}>
            <CheckCircle size={12} weight="bold" />
            <span>Siap Panen Hari Ini · 30% Total</span>
          </div>
        </div>

        {/* Card 2: Fase Mengkal */}
        <div
          onClick={() => handleOpenPositions('mengkal')}
          className="bento-card bento-card-interactive"
          title="Klik untuk melihat posisi pohon buah mengkal"
          style={{ overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim, #64748B)' }}>
              Fase Mengkal
            </span>
            <div className="bento-circle-arrow">
              <ArrowUpRight size={15} weight="bold" />
            </div>
          </div>

          <div style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'var(--text-main, #0F172A)',
            lineHeight: 1,
            marginBottom: '0.75rem',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.03em'
          }}>
            {mengkalCount}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: 'var(--amber-subtle, #FFFBEB)',
            border: '1px solid var(--amber-border, #FDE68A)',
            borderRadius: '999px',
            padding: '3px 9px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--amber-text, #B45309)'
          }}>
            <Clock size={12} weight="bold" />
            <span>Panen 2 - 4 Hari Lagi</span>
          </div>
        </div>

        {/* Card 3: Fase Mentah */}
        <div
          onClick={() => handleOpenPositions('mentah')}
          className="bento-card bento-card-interactive"
          title="Klik untuk melihat posisi pohon buah mentah"
          style={{ overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim, #64748B)' }}>
              Fase Mentah
            </span>
            <div className="bento-circle-arrow">
              <ArrowUpRight size={15} weight="bold" />
            </div>
          </div>

          <div style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'var(--text-main, #0F172A)',
            lineHeight: 1,
            marginBottom: '0.75rem',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.03em'
          }}>
            {mentahCount}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border-subtle, #E2E8F0)',
            borderRadius: '999px',
            padding: '3px 9px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--text-dim, #64748B)'
          }}>
            <span>Pembesaran (5-8 Hari)</span>
          </div>
        </div>

        {/* Card 4: Kesehatan Tanaman */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('penyakit')}
          className="bento-card bento-card-interactive"
          title="Beralih ke halaman Kesehatan Daun"
          style={{ overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim, #64748B)' }}>
              Kesehatan Tanaman
            </span>
            <div className="bento-circle-arrow">
              <ArrowUpRight size={15} weight="bold" />
            </div>
          </div>

          <div style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'var(--text-main, #0F172A)',
            lineHeight: 1,
            marginBottom: '0.75rem',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.03em'
          }}>
            {healthyPct}%
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '999px',
            padding: '3px 9px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#047857'
          }}>
            <Plant size={12} weight="bold" />
            <span>{stats?.disease?.sehat || 74} Pohon Bebas Hama</span>
          </div>
        </div>
      </div>

      {/* 3. Row 2: Balanced Analytics & Readiness Cards (Tanpa jadwal & robot teknis) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem',
        alignItems: 'stretch'
      }}>
        {/* Card A: Analytics - Capsule Bar Chart */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main, #0F172A)', margin: 0 }}>
                Analitik Pemantauan Kematangan
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary, #166534)', fontWeight: 700 }}>
                Aktivitas Mingguan
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-dim, #64748B)', margin: '0 0 1.25rem 0' }}>
              Jumlah pemantauan kondisi buah per hari di seluruh greenhouse
            </p>
          </div>

          <CapsuleBarChart ghDistribution={stats?.gh_distribution} />

          {/* Greenhouse Sub-badges: Proper 3-Column Micro-Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.45rem',
            paddingTop: '0.85rem',
            marginTop: '0.85rem',
            borderTop: '1px solid var(--border-subtle, #E2E8F0)'
          }}>
            <div style={{
              padding: '0.45rem 0.5rem',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #E2E8F0)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '10px', color: 'var(--text-dim, #64748B)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Greenhouse Sakura
              </span>
              <strong style={{ fontSize: '12px', color: 'var(--primary, #166534)', fontWeight: 800 }}>
                11 Matang
              </strong>
            </div>

            <div style={{
              padding: '0.45rem 0.5rem',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #E2E8F0)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '10px', color: 'var(--text-dim, #64748B)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Greenhouse Maribaya
              </span>
              <strong style={{ fontSize: '12px', color: 'var(--primary, #166534)', fontWeight: 800 }}>
                10 Matang
              </strong>
            </div>

            <div style={{
              padding: '0.45rem 0.5rem',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #E2E8F0)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '10px', color: 'var(--text-dim, #64748B)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Greenhouse Cisondari
              </span>
              <strong style={{ fontSize: '12px', color: 'var(--primary, #166534)', fontWeight: 800 }}>
                7 Matang
              </strong>
            </div>
          </div>
        </div>

        {/* Card B: Kesiapan Panen per Greenhouse (Interactive Semi-Circular Arc Gauge with Per-Greenhouse Cards) */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main, #0F172A)', margin: 0 }}>
                Kesiapan Panen per Greenhouse
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {activeGhGauge !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setActiveGhGauge('all')}
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-dim, #64748B)',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid var(--border-subtle, #E2E8F0)',
                      padding: '2px 7px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                    title="Tampilkan semua greenhouse"
                  >
                    Semua
                  </button>
                )}
                <span style={{
                  fontSize: '0.7rem',
                  color: 'var(--primary, #166534)',
                  fontWeight: 700,
                  backgroundColor: '#F0FDF4',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  border: '1px solid #BBF7D0'
                }}>
                  {gaugeData.name} ({gaugeData.pct}%)
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-dim, #64748B)', margin: '0 0 0.75rem 0' }}>
              Rasio buah matang & booking terhadap kapasitas panen per kebun
            </p>
          </div>

          <div style={{ margin: '0.25rem 0 0.5rem 0' }}>
            <GaugeArc
              percentage={gaugeData.pct}
              label={gaugeData.label}
              sublabel={gaugeData.sublabel}
              color="var(--primary, #166534)"
              trackColor="#E2E8F0"
              size={210}
              strokeWidth={17}
              segments={[
                { value: gaugeData.matang, color: '#166534', label: 'Matang' },
                { value: gaugeData.mengkal, color: '#22C55E', label: 'Mengkal' }
              ]}
              total={gaugeData.total}
            />
          </div>

          {/* 3-Column Micro-Cards: Kesiapan Panen per Greenhouse */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle, #E2E8F0)'
          }}>
            {/* Greenhouse Sakura */}
            {(() => {
              const gh1 = ghDist['GH-1'] || {};
              const total1 = gh1.total_fruits || 32;
              const readyPct1 = Math.round((((gh1.matang || 0) + (gh1.mengkal || 0)) / (total1 || 1)) * 100);
              const isActive = activeGhGauge === 'GH-1';

              return (
                <div
                  onClick={() => setActiveGhGauge(isActive ? 'all' : 'GH-1')}
                  style={{
                    padding: '0.45rem 0.5rem',
                    backgroundColor: isActive ? '#F0FDF4' : '#F8FAFC',
                    borderRadius: '8px',
                    border: `1px solid ${isActive ? 'var(--primary, #166534)' : 'var(--border-subtle, #E2E8F0)'}`,
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 0 0 2px rgba(22, 101, 52, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title="Klik untuk melihat kesiapan Greenhouse Sakura"
                >
                  <span style={{
                    fontSize: '10px',
                    color: isActive ? 'var(--primary, #166534)' : 'var(--text-dim, #64748B)',
                    fontWeight: isActive ? 800 : 600,
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    Greenhouse Sakura
                  </span>
                  <strong style={{ fontSize: '12px', color: 'var(--primary, #166534)', fontWeight: 800 }}>
                    {readyPct1}% Siap
                  </strong>
                </div>
              );
            })()}

            {/* Greenhouse Maribaya */}
            {(() => {
              const gh2 = ghDist['GH-2'] || {};
              const total2 = gh2.total_fruits || 32;
              const readyPct2 = Math.round((((gh2.matang || 0) + (gh2.mengkal || 0)) / (total2 || 1)) * 100);
              const isActive = activeGhGauge === 'GH-2';

              return (
                <div
                  onClick={() => setActiveGhGauge(isActive ? 'all' : 'GH-2')}
                  style={{
                    padding: '0.45rem 0.5rem',
                    backgroundColor: isActive ? '#F0FDF4' : '#F8FAFC',
                    borderRadius: '8px',
                    border: `1px solid ${isActive ? 'var(--primary, #166534)' : 'var(--border-subtle, #E2E8F0)'}`,
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 0 0 2px rgba(22, 101, 52, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title="Klik untuk melihat kesiapan Greenhouse Maribaya"
                >
                  <span style={{
                    fontSize: '10px',
                    color: isActive ? 'var(--primary, #166534)' : 'var(--text-dim, #64748B)',
                    fontWeight: isActive ? 800 : 600,
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    Greenhouse Maribaya
                  </span>
                  <strong style={{ fontSize: '12px', color: 'var(--primary, #166534)', fontWeight: 800 }}>
                    {readyPct2}% Siap
                  </strong>
                </div>
              );
            })()}

            {/* Greenhouse Cisondari */}
            {(() => {
              const gh3 = ghDist['GH-3'] || {};
              const total3 = gh3.total_fruits || 32;
              const readyPct3 = Math.round((((gh3.matang || 0) + (gh3.mengkal || 0)) / (total3 || 1)) * 100);
              const isActive = activeGhGauge === 'GH-3';

              return (
                <div
                  onClick={() => setActiveGhGauge(isActive ? 'all' : 'GH-3')}
                  style={{
                    padding: '0.45rem 0.5rem',
                    backgroundColor: isActive ? '#F0FDF4' : '#F8FAFC',
                    borderRadius: '8px',
                    border: `1px solid ${isActive ? 'var(--primary, #166534)' : 'var(--border-subtle, #E2E8F0)'}`,
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 0 0 2px rgba(22, 101, 52, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title="Klik untuk melihat kesiapan Greenhouse Cisondari"
                >
                  <span style={{
                    fontSize: '10px',
                    color: isActive ? 'var(--primary, #166534)' : 'var(--text-dim, #64748B)',
                    fontWeight: isActive ? 800 : 600,
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    Greenhouse Cisondari
                  </span>
                  <strong style={{ fontSize: '12px', color: '#B45309', fontWeight: 800 }}>
                    {readyPct3}% Siap
                  </strong>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 3. Row Sebaran Kematangan Tiap Greenhouse (Chart per Kebun / GH) */}
      <div className="panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.15rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ChartBar size={18} weight="bold" style={{ color: 'var(--primary, #166534)' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main, #0F172A)', margin: 0, letterSpacing: '-0.015em' }}>
                Sebaran Kematangan Tiap Greenhouse
              </h2>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-dim, #64748B)' }}>
              Perbandingan jumlah buah matang, mengkal, dan mentah di setiap kebun hidroponik.
            </p>
          </div>
          <span style={{
            fontSize: '0.72rem',
            color: 'var(--primary, #166534)',
            fontWeight: 700,
            backgroundColor: '#F0FDF4',
            padding: '3px 10px',
            borderRadius: '999px',
            border: '1px solid #BBF7D0'
          }}>
            3 Greenhouse Aktif
          </span>
        </div>

        {/* 3 Greenhouse Multi-Phase Progress Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.25rem'
        }}>
          {ghKeys.map(gid => {
            const gh = ghDist[gid] || {};
            const total = gh.total_fruits || 32;
            const matang = gh.matang || 0;
            const mengkal = gh.mengkal || 0;
            const mentah = gh.mentah || 0;
            const matangPct = Math.round((matang / (total || 1)) * 100);

            return (
              <div
                key={gid}
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, #E2E8F0)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <strong style={{ fontSize: '0.86rem', color: 'var(--text-main, #0F172A)', fontWeight: 700 }}>
                    {gh.name || gid}
                  </strong>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary, #166534)' }}>
                    {matang} Matang ({matangPct}%)
                  </span>
                </div>

                {/* Multi-phase Stacked Progress Bar */}
                <div style={{
                  height: '7px',
                  backgroundColor: '#E2E8F0',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  display: 'flex',
                  margin: '0.5rem 0'
                }}>
                  <div style={{ width: `${(matang / total) * 100}%`, backgroundColor: 'var(--primary, #166534)' }} title={`Matang: ${matang}`} />
                  <div style={{ width: `${(mengkal / total) * 100}%`, backgroundColor: 'var(--accent-melon, #F59E0B)' }} title={`Mengkal: ${mengkal}`} />
                  <div style={{ width: `${(mentah / total) * 100}%`, backgroundColor: '#94A3B8' }} title={`Mentah: ${mentah}`} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim, #64748B)', marginTop: '0.35rem' }}>
                  <span>● Mengkal: <strong style={{ color: '#B45309' }}>{mengkal}</strong></span>
                  <span>● Mentah: <strong style={{ color: '#475569' }}>{mentah}</strong></span>
                  <span>Total: <strong>{total} buah</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grouped Bar Chart */}
        <div style={{ height: '210px', width: '100%', position: 'relative' }}>
          <Bar data={sebaranChartData} options={sebaranChartOptions} />
        </div>
      </div>

      {/* 4. Row 3: Data Table / Cards of Melon Fruits (Synchronized with B2B Design System) */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        {/* Table Header & Controls */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-main, #0F172A)', margin: 0, letterSpacing: '-0.01em' }}>
                Daftar Buah Melon di Pohon
              </h2>
              <span className="badge badge-success" style={{ fontSize: '0.74rem' }}>
                {displayedFruits.length} Buah Terdata
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-dim, #64748B)' }}>
              Hasil pemantauan posisi buah, tingkat kematangan, dan umur tanam.
            </p>
          </div>

          {/* Filter Bar & View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Ripeness Filter Pills */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: '#F1F5F9',
              padding: '3px',
              borderRadius: '999px',
              gap: '2px'
            }}>
              {['all', 'matang', 'mengkal', 'mentah'].map(key => {
                const label = key === 'all' ? 'Semua' : key.charAt(0).toUpperCase() + key.slice(1);
                const isActive = ripenessFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setRipenessFilter(key)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: 'none',
                      backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                      color: isActive ? 'var(--primary, #166534)' : 'var(--text-dim, #64748B)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Greenhouse Dropdown */}
            <select
              value={ghFilter}
              onChange={e => setGhFilter(e.target.value)}
              style={{
                height: '34px',
                padding: '0 0.75rem',
                borderRadius: '999px',
                border: '1px solid var(--border-subtle, #E2E8F0)',
                backgroundColor: '#F8FAFC',
                color: 'var(--text-main, #0F172A)',
                fontSize: '0.76rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">Semua Greenhouse</option>
              {greenhouses.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <MagnifyingGlass size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Cari ID buah / pohon..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  height: '34px',
                  padding: '0 0.75rem 0 1.9rem',
                  borderRadius: '999px',
                  border: '1px solid var(--border-subtle, #E2E8F0)',
                  backgroundColor: '#F8FAFC',
                  color: 'var(--text-main, #0F172A)',
                  fontSize: '0.76rem',
                  outline: 'none',
                  width: '160px'
                }}
              />
            </div>

            {/* View Mode Switcher */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#F1F5F9',
              padding: '3px',
              borderRadius: '8px',
              gap: '2px',
              border: '1px solid var(--border-subtle, #E2E8F0)'
            }}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`view-switch-btn ${viewMode === 'table' ? 'active' : 'inactive'}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'table' ? 'var(--text-main, #0F172A)' : 'var(--text-dim, #64748B)',
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  fontSize: '11.5px',
                  fontWeight: viewMode === 'table' ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Tampilan Tabel"
              >
                <TableIcon size={14} weight="bold" />
                <span>Tabel</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`view-switch-btn ${viewMode === 'grid' ? 'active' : 'inactive'}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--text-main, #0F172A)' : 'var(--text-dim, #64748B)',
                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  fontSize: '11.5px',
                  fontWeight: viewMode === 'grid' ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Tampilan Kartu"
              >
                <SquaresFour size={14} weight="bold" />
                <span>Kartu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content View */}
        {viewMode === 'table' ? (
          /* Table View dengan horizontal scroll container aman */
          <div className="table-container" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
            <table className="table-craft" style={{ width: '100%', minWidth: '760px' }}>
              <thead>
                <tr>
                  <th style={{ width: '22%', minWidth: '150px' }}>ID Buah & QR</th>
                  <th style={{ width: '20%', minWidth: '140px' }}>Pohon & Posisi</th>
                  <th style={{ width: '24%', minWidth: '170px' }}>Greenhouse</th>
                  <th style={{ width: '14%', minWidth: '110px', textAlign: 'center' }}>Kematangan</th>
                  <th style={{ width: '10%', minWidth: '90px', textAlign: 'center' }}>Umur</th>
                  <th style={{ width: '10%', minWidth: '90px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedFruits.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
                      Tidak ada buah melon yang sesuai dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  displayedFruits.map((f) => {
                    const isMatang = f.tingkat_kematangan === 'matang';
                    const isMengkal = f.tingkat_kematangan === 'mengkal';
                    const badgeClass = isMatang ? 'badge-success' : (isMengkal ? 'badge-warning' : 'badge-neutral');
                    const badgeLabel = isMatang ? 'Matang' : (isMengkal ? 'Mengkal' : 'Mentah');

                    return (
                      <tr key={f.fruit_id}>
                        {/* ID Buah & QR */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                              onClick={() => onSelectFruit && onSelectFruit(f.fruit_id)}
                              style={{
                                cursor: 'pointer',
                                display: 'inline-flex',
                                flexShrink: 0,
                                borderRadius: '6px',
                                transition: 'transform 0.15s ease'
                              }}
                              title={`Klik untuk rincian & cetak label QR (${f.qr_code || `QR-FRUIT-${f.fruit_id}`})`}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                              <QrThumbnail text={f.qr_code || `QR-FRUIT-${f.fruit_id}`} size={34} />
                            </div>
                            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                              <strong className="font-mono" style={{ fontSize: '13px', color: 'var(--text-main, #0F172A)', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {f.fruit_id}
                              </strong>
                              <span className="font-mono" style={{ fontSize: '10px', color: 'var(--primary, #166534)', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {f.qr_code || `QR-FRUIT-${f.fruit_id}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Pohon & Posisi */}
                        <td>
                          <div style={{ fontSize: '12px', color: 'var(--text-main, #0F172A)' }}>
                            <strong className="font-mono">{f.tree_id || '-'}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim, #64748B)', marginTop: '2px' }}>
                              {f.row || `Jalur ${f.row_index || 1}`} · Pohon {f.tree_index || 1}
                            </div>
                          </div>
                        </td>

                        {/* Greenhouse */}
                        <td>
                          <div style={{ fontSize: '12px', color: 'var(--text-main, #0F172A)' }}>
                            <span style={{ fontWeight: 600 }}>{f.greenhouse_name || 'Greenhouse Sakura'}</span>
                            <div style={{ fontSize: '10.5px', color: 'var(--primary, #166534)', fontWeight: 600, marginTop: '2px' }}>
                              Melon Hidroponik
                            </div>
                          </div>
                        </td>

                        {/* Kematangan */}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '11px', padding: '3px 9px' }}>
                            {badgeLabel}
                          </span>
                        </td>

                        {/* Umur Buah */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main, #0F172A)' }}>
                            {f.age_days || 96} hari
                          </span>
                        </td>

                        {/* Aksi */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => onSelectFruit && onSelectFruit(f.fruit_id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle, #E2E8F0)',
                              backgroundColor: '#FFFFFF',
                              color: 'var(--primary, #166534)',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary-subtle, #F0FDF4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                            title="Lihat rincian foto & posisi"
                          >
                            <Eye size={13} weight="bold" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1rem',
            padding: '1.25rem 1.5rem'
          }}>
            {displayedFruits.map((f) => {
              const isMatang = f.tingkat_kematangan === 'matang';
              const isMengkal = f.tingkat_kematangan === 'mengkal';
              const badgeClass = isMatang ? 'badge-success' : (isMengkal ? 'badge-warning' : 'badge-neutral');
              const badgeLabel = isMatang ? 'Matang' : (isMengkal ? 'Mengkal' : 'Mentah');

              return (
                <div
                  key={f.fruit_id}
                  onClick={() => onSelectFruit && onSelectFruit(f.fruit_id)}
                  className="panel panel-interactive"
                  style={{
                    padding: '1rem',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                      <QrThumbnail text={f.qr_code || `QR-FRUIT-${f.fruit_id}`} size={30} />
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <span className="font-mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main, #0F172A)', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {f.fruit_id}
                        </span>
                        <span className="font-mono" style={{ fontSize: '9.5px', color: 'var(--primary, #166534)', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {f.qr_code || `QR-FRUIT-${f.fruit_id}`}
                        </span>
                      </div>
                    </div>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: '10.5px', flexShrink: 0 }}>
                      {badgeLabel}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-dim, #64748B)' }}>
                    <div>{f.greenhouse_name}</div>
                    <div style={{ marginTop: '2px', fontWeight: 600, color: 'var(--text-main, #0F172A)' }}>
                      {f.tree_id} · {f.row || `Jalur ${f.row_index || 1}`}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--border-subtle, #E2E8F0)',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: 'var(--text-dim, #64748B)' }}>Umur: <strong>{f.age_days || 96} hari</strong></span>
                    <span style={{ color: 'var(--primary, #166534)', fontWeight: 700 }}>Detail ↗</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
