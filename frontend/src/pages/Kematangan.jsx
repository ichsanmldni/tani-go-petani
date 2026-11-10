import React, { useState, useEffect, useMemo } from 'react';
import {
  Plant,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  Eye,
  MapPin,
  ArrowUpRight,
  VideoCamera,
  QrCode,
  Table as TableIcon,
  SquaresFour
} from '@phosphor-icons/react';

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
  const healthyPct = stats?.disease?.sehat_pct || 77;
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* 1. Header Bar: Title + Subtitle + Action Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ minWidth: 0 }}>
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigateTab && onNavigateTab('simulator')}
            className="bento-pill-primary"
            title="Buka kamera untuk memeriksa kondisi buah"
          >
            <VideoCamera size={16} weight="bold" />
            <span>+ Uji Kamera</span>
          </button>
          <button
            onClick={() => handleOpenPositions('matang')}
            className="bento-pill-secondary"
            title="Lihat peta sebaran posisi pohon"
          >
            <MapPin size={16} weight="bold" />
            <span>Peta Posisi Pohon</span>
          </button>
        </div>
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
                GH-1 Sakura
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
                GH-2 Maribaya
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
                GH-3 Cisondari
              </span>
              <strong style={{ fontSize: '12px', color: 'var(--primary, #166534)', fontWeight: 800 }}>
                7 Matang
              </strong>
            </div>
          </div>
        </div>

        {/* Card B: Kesiapan Panen Kebun (Semi-Circular Arc Gauge with Micro-Legend) */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main, #0F172A)', margin: 0 }}>
                Kesiapan Panen Kebun
              </h3>
              <span style={{
                fontSize: '0.7rem',
                color: 'var(--primary, #166534)',
                fontWeight: 700,
                backgroundColor: '#F0FDF4',
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid #BBF7D0'
              }}>
                Rasio Panen
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-dim, #64748B)', margin: '0 0 0.75rem 0' }}>
              Perbandingan buah matang dan mengkal terhadap kapasitas panen saat ini
            </p>
          </div>

          <div style={{ margin: '0.25rem 0 0.5rem 0' }}>
            <GaugeArc
              percentage={harvestReadyPct}
              label="Kesiapan Panen"
              sublabel={`${matangCount} Matang Siap Petik · ${mengkalCount} Menuju Matang`}
              color="var(--primary, #166534)"
              trackColor="#E2E8F0"
              size={210}
              strokeWidth={17}
              segments={[
                { value: matangCount, color: '#166534', label: 'Matang' },
                { value: mengkalCount, color: '#22C55E', label: 'Mengkal' }
              ]}
              total={totalFruits}
            />
          </div>

          {/* 3-Column Micro-Cards Legend (Synchronized with CapsuleBarChart Micro-Grid) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle, #E2E8F0)'
          }}>
            {/* Matang */}
            <div
              style={{
                padding: '0.45rem 0.5rem',
                backgroundColor: '#F0FDF4',
                borderRadius: '8px',
                border: '1px solid #BBF7D0',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#166534' }} />
                <span style={{ fontSize: '10px', color: '#166534', fontWeight: 700 }}>
                  Matang ({Math.round((matangCount / (totalFruits || 1)) * 100)}%)
                </span>
              </div>
              <strong style={{ fontSize: '12px', color: '#166534', fontWeight: 800 }}>
                {matangCount} Buah
              </strong>
            </div>

            {/* Mengkal */}
            <div
              style={{
                padding: '0.45rem 0.5rem',
                backgroundColor: '#FFFBEB',
                borderRadius: '8px',
                border: '1px solid #FDE68A',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706' }} />
                <span style={{ fontSize: '10px', color: '#92400E', fontWeight: 700 }}>
                  Mengkal ({Math.round((mengkalCount / (totalFruits || 1)) * 100)}%)
                </span>
              </div>
              <strong style={{ fontSize: '12px', color: '#B45309', fontWeight: 800 }}>
                {mengkalCount} Buah
              </strong>
            </div>

            {/* Mentah */}
            <div
              style={{
                padding: '0.45rem 0.5rem',
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle, #E2E8F0)',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#64748B' }} />
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>
                  Mentah ({Math.round((mentahCount / (totalFruits || 1)) * 100)}%)
                </span>
              </div>
              <strong style={{ fontSize: '12px', color: '#334155', fontWeight: 800 }}>
                {mentahCount} Buah
              </strong>
            </div>
          </div>
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
