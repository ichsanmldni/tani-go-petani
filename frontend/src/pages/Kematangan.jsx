import React, { useState, useEffect, useMemo } from 'react';
import {
  Plant,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  Eye,
  MapPin,
  ChartBar,
  ArrowUpRight,
  CalendarBlank,
  Users,
  VideoCamera,
  QrCode,
  Table as TableIcon,
  SquaresFour,
  Check,
  Robot,
  Play
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

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    loadData();
  };

  const handleOpenPositions = (catKey) => {
    if (!summaryReport || !summaryReport[catKey]) {
      // Fallback
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

      {/* 1. Header Bar: Title + Subtitle + Action Pills (Donezo Vibe) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.55rem',
            fontWeight: 800,
            color: '#0F172A',
            margin: '0 0 0.25rem 0',
            letterSpacing: '-0.025em',
            fontFamily: 'var(--font-heading)'
          }}>
            Dashboard Kematangan Buah
          </h1>
          <p style={{
            fontSize: '0.82rem',
            color: '#64748B',
            margin: 0,
            lineHeight: 1.4
          }}>
            Pantau tingkat kematangan buah melon, rawat tanaman, dan panen tepat waktu.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={() => onNavigateTab && onNavigateTab('simulator')}
            className="bento-pill-primary"
            title="Buka kamera vision AI"
          >
            <VideoCamera size={16} weight="bold" />
            <span>+ Uji Kamera AI</span>
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: HERO HIGHLIGHT CARD (Deep Green #14532D) */}
        <div
          onClick={() => handleOpenPositions('matang')}
          className="bento-card bento-hero-green bento-card-interactive"
          title="Klik untuk melihat sebaran posisi pohon buah matang"
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
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>
              Fase Mengkal
            </span>
            <div className="bento-circle-arrow">
              <ArrowUpRight size={15} weight="bold" />
            </div>
          </div>

          <div style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#0F172A',
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
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '999px',
            padding: '3px 9px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#B45309'
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
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>
              Fase Mentah
            </span>
            <div className="bento-circle-arrow">
              <ArrowUpRight size={15} weight="bold" />
            </div>
          </div>

          <div style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#0F172A',
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
            border: '1px solid #E2E8F0',
            borderRadius: '999px',
            padding: '3px 9px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#64748B'
          }}>
            <span>Pembesaran (5-8 Hari)</span>
          </div>
        </div>

        {/* Card 4: Kesehatan Tanaman */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('penyakit')}
          className="bento-card bento-card-interactive"
          title="Beralih ke halaman Kesehatan Daun"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>
              Kesehatan Tanaman
            </span>
            <div className="bento-circle-arrow">
              <ArrowUpRight size={15} weight="bold" />
            </div>
          </div>

          <div style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#0F172A',
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

      {/* 3. Row 2 Bento Cards: Analytics (Capsule Bar) + Reminders Card + ROKAE Robot Vision */}
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
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Analitik Pemantauan Kematangan
              </h3>
              <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700 }}>
                Minggu Ini
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '0 0 1.25rem 0' }}>
              Aktivitas pemindaian buah per hari di kebun hidroponik
            </p>
          </div>

          <CapsuleBarChart ghDistribution={stats?.gh_distribution} />

          {/* Greenhouse Sub-badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.85rem',
            marginTop: '0.85rem',
            borderTop: '1px solid #F1F5F9',
            fontSize: '0.72rem',
            color: '#64748B'
          }}>
            <span>Sakura: <strong>11 Matang</strong></span>
            <span>Maribaya: <strong>10 Matang</strong></span>
            <span>Cisondari: <strong>7 Matang</strong></span>
          </div>
        </div>

        {/* Card B: Reminders / Quick Action Card (Donezo Style) */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Jadwal & Tindakan Panen
              </h3>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#166534',
                backgroundColor: '#DCFCE7',
                padding: '2px 7px',
                borderRadius: '6px'
              }}>
                Prioritas
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '0 0 1.1rem 0' }}>
              Tugas terdekat yang memerlukan tindakan langsung
            </p>

            {/* Task Item Box */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              marginBottom: '1rem'
            }}>
              <strong style={{ fontSize: '0.92rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                Panen Buah Matang Ciwidey
              </strong>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem' }}>
                Greenhouse Sakura · Target 11 Buah Siap Petik
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#166534',
                backgroundColor: '#DCFCE7',
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                <CalendarBlank size={12} weight="bold" />
                <span>Hari Ini · 08.00 - 11.00 WIB</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenPositions('matang')}
            className="bento-pill-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }}
          >
            <Plant size={15} weight="bold" />
            <span>Mulai Cek Pohon Matang</span>
          </button>
        </div>

        {/* Card C: ROKAE Robot Vision (Time Tracker Style in Deep Forest Green) */}
        <div style={{
          borderRadius: '20px',
          background: 'radial-gradient(circle at 80% 20%, #15803d 0%, #14532d 60%, #064e3b 100%)',
          color: '#FFFFFF',
          padding: '1.35rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 8px 24px -2px rgba(20, 83, 45, 0.35)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Ring */}
          <div style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(134, 239, 172, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#86EFAC', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                ROKAE Telemetry
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                backgroundColor: '#22C55E',
                color: '#064E3B',
                padding: '2px 7px',
                borderRadius: '999px'
              }}>
                ACTIVE
              </span>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#A7F3D0', marginBottom: '0.2rem' }}>
              Modbus Vision (Flange Camera)
            </div>

            <div style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
              color: '#FFFFFF'
            }}>
              192.168.2.160
            </div>

            <p style={{ fontSize: '0.72rem', color: '#D1FAE5', margin: 0, lineHeight: 1.4 }}>
              Register Datacam 67 · ROKAE XMS5-R800 siap untuk inspeksi otomatis.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button
              onClick={() => onNavigateTab && onNavigateTab('simulator')}
              style={{
                flex: 1,
                padding: '0.6rem 0.85rem',
                borderRadius: '999px',
                backgroundColor: '#FFFFFF',
                color: '#14532D',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <VideoCamera size={14} weight="bold" />
              <span>Buka Kamera AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Row 3 Bento Cards: Project Progress Arc Gauge + Team Collaboration */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card D: Progress Arc Gauge */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem 0' }}>
              Kesiapan Panen Kebun
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '0 0 1rem 0' }}>
              Rasio buah matang & mengkal terhadap target panen
            </p>
          </div>

          <GaugeArc
            percentage={86}
            label="Kesiapan Panen"
            sublabel="Panen mingguan berjalan optimal"
            color="#166534"
            trackColor="#E2E8F0"
          />

          {/* Dots Legend */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #F1F5F9',
            fontSize: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#166534' }} />
              <span style={{ color: '#0F172A', fontWeight: 600 }}>Matang ({matangCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B45309' }} />
              <span style={{ color: '#0F172A', fontWeight: 600 }}>Mengkal ({mengkalCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64748B' }} />
              <span style={{ color: '#0F172A', fontWeight: 600 }}>Mentah ({mentahCount})</span>
            </div>
          </div>
        </div>

        {/* Card E: Tim Pengelola Greenhouse (Donezo Team Collaboration Vibe) */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Pengelola Greenhouse
              </h3>
              <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700 }}>
                3 Lokasi Aktif
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '0 0 1rem 0' }}>
              Agronomis penanggung jawab tiap unit greenhouse
            </p>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Member 1 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                    KA
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>
                      Kang Asep Supriatna
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                      GH Sakura (Ciwidey) · Kepala Kebun
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '999px', border: '1px solid #A7F3D0' }}>
                  Aktif
                </span>
              </div>

              {/* Member 2 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                    BH
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>
                      Pak Budi Hartono
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                      GH Maribaya (Lembang) · Agronomis
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '999px', border: '1px solid #A7F3D0' }}>
                  Aktif
                </span>
              </div>

              {/* Member 3 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#E0E7FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                    RM
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>
                      Ibu Rina Marlina
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                      GH Cisondari (Pasirjambu) · Manajer Kebun
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '999px', border: '1px solid #A7F3D0' }}>
                  Aktif
                </span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.7rem', color: '#94A3B8', textAlign: 'center', marginTop: '0.75rem' }}>
            Kontak darurat & WhatsApp terhubung otomatis ke sistem
          </div>
        </div>
      </div>

      {/* 5. Row 4 Bento Card: Data Table / Cards of Melon Fruits */}
      <div className="bento-card">
        {/* Table Header & Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.2rem 0' }}>
              Daftar Buah Melon di Pohon
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Menampilkan {displayedFruits.length} dari total {totalFruits} buah terdata
            </span>
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
                      color: isActive ? '#166534' : '#64748B',
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
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#1E293B',
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
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  color: '#1E293B',
                  fontSize: '0.76rem',
                  outline: 'none',
                  width: '180px'
                }}
              />
            </div>

            {/* View Mode Switcher */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: '#F1F5F9',
              padding: '3px',
              borderRadius: '8px',
              gap: '2px'
            }}>
              <button
                onClick={() => setViewMode('table')}
                className={`view-switch-btn ${viewMode === 'table' ? 'active' : 'inactive'}`}
                title="Tampilan Tabel"
              >
                <TableIcon size={14} weight="bold" />
                <span>Tabel</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`view-switch-btn ${viewMode === 'grid' ? 'active' : 'inactive'}`}
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
          /* Table View */
          <div className="table-container">
            <table className="table-craft">
              <thead>
                <tr>
                  <th style={{ width: '18%', minWidth: '140px' }}>ID Buah & QR</th>
                  <th style={{ width: '18%', minWidth: '140px' }}>Pohon & Posisi</th>
                  <th style={{ width: '22%', minWidth: '160px' }}>Greenhouse</th>
                  <th style={{ width: '14%', minWidth: '110px', textAlign: 'center' }}>Kematangan</th>
                  <th style={{ width: '14%', minWidth: '100px', textAlign: 'center' }}>Umur Buah</th>
                  <th style={{ width: '14%', minWidth: '110px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedFruits.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                      Tidak ada buah melon yang sesuai dengan filter pencarian.
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
                        {/* ID Buah */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <QrCode size={18} style={{ color: '#166534' }} />
                            </div>
                            <div>
                              <strong className="font-mono" style={{ fontSize: '13px', color: '#0F172A', display: 'block' }}>
                                {f.fruit_id}
                              </strong>
                              <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                                QR Aktif
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Pohon & Posisi */}
                        <td>
                          <div style={{ fontSize: '12px', color: '#0F172A' }}>
                            <strong>{f.tree_id || '-'}</strong>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                              {f.row || `Jalur ${f.row_index || 1}`} · Pohon {f.tree_index || 1}
                            </div>
                          </div>
                        </td>

                        {/* Greenhouse */}
                        <td>
                          <div style={{ fontSize: '12px', color: '#0F172A' }}>
                            <span>{f.greenhouse_name || 'Greenhouse Sakura'}</span>
                            <div style={{ fontSize: '10.5px', color: '#166534', fontWeight: 600, marginTop: '2px' }}>
                              Melon Hidroponik
                            </div>
                          </div>
                        </td>

                        {/* Kematangan */}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '11px', padding: '3px 9px' }}>
                            {isMatang && <CheckCircle size={12} weight="bold" />}
                            {isMengkal && <Clock size={12} weight="bold" />}
                            <span>{badgeLabel}</span>
                          </span>
                        </td>

                        {/* Umur Buah */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="font-mono" style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                            {f.age_days} hari
                          </span>
                          <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
                            {isMatang ? 'Siap Petik' : (isMengkal ? '2–4 Hari Lagi' : '5–8 Hari Lagi')}
                          </div>
                        </td>

                        {/* Aksi */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => onSelectFruit && onSelectFruit(f.fruit_id)}
                            className="bento-pill-secondary"
                            style={{ padding: '5px 12px', fontSize: '11px' }}
                            title="Buka rincian buah dan citra multi-sudut"
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
          /* Card Grid View (Mobile First & Modern) */
          <div className="card-grid">
            {displayedFruits.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                Tidak ada buah melon yang sesuai dengan filter pencarian.
              </div>
            ) : (
              displayedFruits.map((f) => {
                const isMatang = f.tingkat_kematangan === 'matang';
                const isMengkal = f.tingkat_kematangan === 'mengkal';
                const badgeClass = isMatang ? 'badge-success' : (isMengkal ? 'badge-warning' : 'badge-neutral');
                const badgeLabel = isMatang ? 'Matang' : (isMengkal ? 'Mengkal' : 'Mentah');

                return (
                  <div key={f.fruit_id} className="commodity-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                      <strong className="font-mono" style={{ fontSize: '13.5px', color: '#0F172A' }}>
                        {f.fruit_id}
                      </strong>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '10.5px' }}>
                        {badgeLabel}
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#64748B', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                      <div>Pohon: <strong style={{ color: '#0F172A' }}>{f.tree_id}</strong></div>
                      <div>Posisi: {f.row} · Pohon #{f.tree_index}</div>
                      <div>Greenhouse: {f.greenhouse_name}</div>
                      <div>Umur: <strong className="font-mono">{f.age_days} hari</strong> ({isMatang ? 'Siap Petik' : (isMengkal ? '2–4 Hari' : '5–8 Hari')})</div>
                    </div>

                    <button
                      onClick={() => onSelectFruit && onSelectFruit(f.fruit_id)}
                      className="bento-pill-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '7px 12px', fontSize: '11.5px' }}
                    >
                      <Eye size={14} weight="bold" />
                      <span>Lihat Detail Buah</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

    </div>
  );
}
