import React, { useState, useEffect, useMemo } from 'react';
import {
  Plant,
  ShieldWarning,
  ShieldCheck,
  MagnifyingGlass,
  Warehouse,
  Eye,
  Clock,
  ArrowUpRight,
  Bug,
  CalendarBlank,
  Table as TableIcon,
  SquaresFour,
  QrCode,
  VideoCamera,
  MapPin,
  WarningCircle
} from '@phosphor-icons/react';

import QrThumbnail from '../components/QrThumbnail.jsx';
import GaugeArc from '../components/GaugeArc.jsx';

export default function Penyakit({
  greenhouses,
  stats,
  onSelectTree,
  onOpenPositionsModal,
  onNavigateTab,
  globalSearchQuery = ''
}) {
  const [trees, setTrees] = useState([]);
  const [diseaseGrouping, setDiseaseGrouping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ghFilter, setGhFilter] = useState('all');
  const [kondisiFilter, setKondisiFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState(globalSearchQuery || '');
  const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'table'));

  useEffect(() => {
    if (globalSearchQuery) setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery]);

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
    if (e && e.preventDefault) e.preventDefault();
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

  const sehatCount = stats?.disease?.sehat || 74;
  const sakitCount = stats?.disease?.sakit || 22;
  const totalTrees = stats?.total_trees || 96;
  const healthyPct = stats?.disease?.sehat_pct || 77;

  // Filtered trees
  const displayedTrees = useMemo(() => {
    let result = trees;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t =>
        t.tree_id?.toLowerCase().includes(q) ||
        t.nama_penyakit?.toLowerCase().includes(q) ||
        t.greenhouse_name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [trees, searchQuery]);

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
        <div>
          <h1 style={{
            fontSize: '1.55rem',
            fontWeight: 800,
            color: '#0F172A',
            margin: '0 0 0.25rem 0',
            letterSpacing: '-0.025em',
            fontFamily: 'var(--font-heading)'
          }}>
            Dashboard Kesehatan Daun Melon
          </h1>
          <p style={{
            fontSize: '0.82rem',
            color: '#64748B',
            margin: 0,
            lineHeight: 1.4
          }}>
            Deteksi dini hama kutu daun (aphids) dan embun tepung (powdery mildew) di kebun greenhouse.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={() => onNavigateTab && onNavigateTab('simulator')}
            className="bento-pill-primary"
            title="Buka kamera deteksi penyakit daun"
          >
            <VideoCamera size={16} weight="bold" />
            <span>+ Scan Daun AI</span>
          </button>
          <button
            onClick={() => {
              if (onOpenPositionsModal) {
                onOpenPositionsModal({
                  title: 'Peta Sebaran Pohon Sakit (Perlu Ditangani)',
                  color: 'red',
                  count: sakitCount,
                  type: 'disease'
                });
              }
            }}
            className="bento-pill-secondary"
            title="Lihat peta sebaran pohon yang perlu disemprot"
          >
            <MapPin size={16} weight="bold" />
            <span>Peta Pohon Sakit</span>
          </button>
        </div>
      </div>

      {/* 2. Top Row: 4 Bento Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: HERO HIGHLIGHT CARD (Deep Green #14532D) */}
        <div
          onClick={() => setKondisiFilter('Sehat')}
          className="bento-card bento-hero-green bento-card-interactive"
          title="Filter pohon sehat normal"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#E2E8F0' }}>
              Pohon Sehat Normal
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
            {sehatCount}
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
            <ShieldCheck size={12} weight="bold" />
            <span>{healthyPct}% Kebun Bebas Hama</span>
          </div>
        </div>

        {/* Card 2: Perlu Penanganan (Sakit) */}
        <div
          onClick={() => setKondisiFilter('Sakit')}
          className="bento-card bento-card-interactive"
          title="Filter pohon sakit"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>
              Perlu Penanganan
            </span>
            <div className="bento-circle-arrow">
              <ArrowUpRight size={15} weight="bold" />
            </div>
          </div>

          <div style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#B91C1C',
            lineHeight: 1,
            marginBottom: '0.75rem',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.03em'
          }}>
            {sakitCount}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '999px',
            padding: '3px 9px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#B91C1C'
          }}>
            <ShieldWarning size={12} weight="bold" />
            <span>Segera Sanitasi / Semprot</span>
          </div>
        </div>

        {/* Card 3: Kutu Daun (Aphids) */}
        <div
          onClick={() => setSearchQuery('Aphid')}
          className="bento-card bento-card-interactive"
          title="Filter hama kutu daun"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>
              Kutu Daun (Aphids)
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
            12
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
            <Bug size={12} weight="bold" />
            <span>Sebaran Jalur 1 & 3</span>
          </div>
        </div>

        {/* Card 4: Embun Tepung (Powdery Mildew) */}
        <div
          onClick={() => setSearchQuery('Powdery')}
          className="bento-card bento-card-interactive"
          title="Filter penyakit embun tepung"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>
              Embun Tepung
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
            10
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
            <Plant size={12} weight="bold" />
            <span>Sebaran Jalur 2 & 4</span>
          </div>
        </div>
      </div>

      {/* 3. Row 2 Bento Cards: Progress Gauge + Reminders Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card A: Health Arc Gauge */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem 0' }}>
              Indeks Kesehatan Tanaman
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '0 0 1rem 0' }}>
              Persentase pohon melon yang tumbuh sehat tanpa gejala penyakit
            </p>
          </div>

          <GaugeArc
            percentage={healthyPct}
            label="Pohon Sehat"
            sublabel={`${sehatCount} dari total ${totalTrees} pohon`}
            color="#047857"
            trackColor="#FEE2E2"
          />

          {/* Dots Legend */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #F1F5F9',
            fontSize: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#047857' }} />
              <span style={{ color: '#0F172A', fontWeight: 600 }}>Sehat Normal ({sehatCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B91C1C' }} />
              <span style={{ color: '#0F172A', fontWeight: 600 }}>Perlu Dicek ({sakitCount})</span>
            </div>
          </div>
        </div>

        {/* Card B: SOP Penyemprotan & Tindakan Sanitasi (Reminders Card) */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Pengingat Tindakan Sanitasi
              </h3>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#B91C1C',
                backgroundColor: '#FEE2E2',
                padding: '2px 7px',
                borderRadius: '6px'
              }}>
                Penting
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '0 0 1.1rem 0' }}>
              Prosedur penanganan hama kutu daun & embun tepung
            </p>

            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              marginBottom: '1rem'
            }}>
              <strong style={{ fontSize: '0.92rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                Penyemprotan Sabun Kalium / Neem Oil
              </strong>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem' }}>
                Greenhouse Sakura · Jalur 1 & 2 (Titik Kutu Daun)
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#B91C1C',
                backgroundColor: '#FEE2E2',
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                <CalendarBlank size={12} weight="bold" />
                <span>Sore Ini · 16.00 - 17.30 WIB</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (onOpenPositionsModal) {
                onOpenPositionsModal({
                  title: 'Daftar Titik Pohon Terkena Kutu Daun (Siap Semprot)',
                  color: 'red',
                  count: 12,
                  type: 'disease'
                });
              }
            }}
            className="bento-pill-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', backgroundColor: '#B91C1C' }}
          >
            <ShieldWarning size={15} weight="bold" />
            <span>Lihat Titik Pohon Sakit</span>
          </button>
        </div>
      </div>

      {/* 4. Row 3 Bento Card: Data Table / Cards of Melon Trees */}
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
              Daftar Pemeriksaan Daun Pohon
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Menampilkan {displayedTrees.length} dari total {totalTrees} pohon terdaftar
            </span>
          </div>

          {/* Filter Bar & View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Condition Filter Pills */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: '#F1F5F9',
              padding: '3px',
              borderRadius: '999px',
              gap: '2px'
            }}>
              {['all', 'Sehat', 'Sakit'].map(key => {
                const label = key === 'all' ? 'Semua' : key;
                const isActive = kondisiFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setKondisiFilter(key)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: 'none',
                      backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                      color: isActive ? '#0F172A' : '#64748B',
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
                placeholder="Cari ID / penyakit..."
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
                  <th style={{ width: '18%', minWidth: '140px' }}>ID Pohon & QR</th>
                  <th style={{ width: '18%', minWidth: '130px' }}>Posisi Jalur</th>
                  <th style={{ width: '22%', minWidth: '160px' }}>Greenhouse</th>
                  <th style={{ width: '14%', minWidth: '110px', textAlign: 'center' }}>Kondisi</th>
                  <th style={{ width: '14%', minWidth: '120px', textAlign: 'center' }}>Hasil Diagnosa</th>
                  <th style={{ width: '14%', minWidth: '110px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedTrees.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                      Tidak ada pohon yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  displayedTrees.map((t) => {
                    const isSehat = t.kondisi === 'Sehat';
                    const badgeClass = isSehat ? 'badge-success' : 'badge-danger';

                    return (
                      <tr key={t.tree_id}>
                        {/* ID Pohon */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: isSehat ? '#F0FDF4' : '#FEF2F2',
                              border: `1px solid ${isSehat ? '#A7F3D0' : '#FECACA'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Plant size={17} weight="bold" style={{ color: isSehat ? '#166534' : '#B91C1C' }} />
                            </div>
                            <div>
                              <strong className="font-mono" style={{ fontSize: '13px', color: '#0F172A', display: 'block' }}>
                                {t.tree_id}
                              </strong>
                              <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                                {t.fruit_id || '-'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Posisi Jalur */}
                        <td>
                          <div style={{ fontSize: '12px', color: '#0F172A' }}>
                            <strong>{t.row || `Jalur ${t.row_index || 1}`}</strong>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                              Pohon ke-{t.tree_index || 1}
                            </div>
                          </div>
                        </td>

                        {/* Greenhouse */}
                        <td>
                          <div style={{ fontSize: '12px', color: '#0F172A' }}>
                            <span>{t.greenhouse_name || 'Greenhouse Sakura'}</span>
                            <div style={{ fontSize: '10.5px', color: '#166534', fontWeight: 600, marginTop: '2px' }}>
                              Melon Hidroponik
                            </div>
                          </div>
                        </td>

                        {/* Kondisi */}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '11px', padding: '3px 9px' }}>
                            {isSehat ? <ShieldCheck size={12} weight="bold" /> : <ShieldWarning size={12} weight="bold" />}
                            <span>{t.kondisi}</span>
                          </span>
                        </td>

                        {/* Hasil Diagnosa */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: isSehat ? '#047857' : '#B91C1C' }}>
                            {t.nama_penyakit || (isSehat ? 'Normal Sehat' : 'Terinfeksi')}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
                            Akurasi {t.confidence || 95}%
                          </div>
                        </td>

                        {/* Aksi */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => onSelectTree && onSelectTree(t.tree_id)}
                            className="bento-pill-secondary"
                            style={{ padding: '5px 12px', fontSize: '11px' }}
                            title="Buka rincian diagnosa daun dan rekomendasi SOP"
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
          /* Card Grid View */
          <div className="card-grid">
            {displayedTrees.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                Tidak ada pohon yang sesuai dengan filter pencarian.
              </div>
            ) : (
              displayedTrees.map((t) => {
                const isSehat = t.kondisi === 'Sehat';
                const badgeClass = isSehat ? 'badge-success' : 'badge-danger';

                return (
                  <div key={t.tree_id} className="commodity-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                      <strong className="font-mono" style={{ fontSize: '13.5px', color: '#0F172A' }}>
                        {t.tree_id}
                      </strong>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '10.5px' }}>
                        {t.kondisi}
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#64748B', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                      <div>Diagnosa: <strong style={{ color: isSehat ? '#047857' : '#B91C1C' }}>{t.nama_penyakit || 'Normal'}</strong></div>
                      <div>Posisi: {t.row} · Pohon #{t.tree_index}</div>
                      <div>Greenhouse: {t.greenhouse_name}</div>
                      <div>Akurasi Deteksi: <strong className="font-mono">{t.confidence || 95}%</strong></div>
                    </div>

                    <button
                      onClick={() => onSelectTree && onSelectTree(t.tree_id)}
                      className="bento-pill-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '7px 12px', fontSize: '11.5px', backgroundColor: isSehat ? '#14532D' : '#B91C1C' }}
                    >
                      <Eye size={14} weight="bold" />
                      <span>Lihat Detail Pohon</span>
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
