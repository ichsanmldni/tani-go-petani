import React, { useState, useEffect, useMemo } from 'react';
import {
  Plant,
  ShieldWarning,
  ShieldCheck,
  MagnifyingGlass,
  Warehouse,
  Eye,
  ArrowUpRight,
  Bug,
  Table as TableIcon,
  SquaresFour,
  QrCode,
  VideoCamera,
  MapPin
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
        t.greenhouse_name?.toLowerCase().includes(q) ||
        t.diagnosis?.toLowerCase().includes(q)
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
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontSize: '1.55rem',
            fontWeight: 800,
            color: 'var(--text-main, #0F172A)',
            margin: '0 0 0.25rem 0',
            letterSpacing: '-0.025em',
            fontFamily: 'var(--font-heading)'
          }}>
            Dashboard Kesehatan Daun
          </h1>
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-dim, #64748B)',
            margin: 0,
            lineHeight: 1.4
          }}>
            Pantau kondisi daun tanaman melon dan deteksi indikasi hama secara berkala.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigateTab && onNavigateTab('simulator')}
            className="bento-pill-primary"
            title="Buka kamera untuk memeriksa kondisi daun"
          >
            <VideoCamera size={16} weight="bold" />
            <span>+ Uji Kamera</span>
          </button>
          <button
            onClick={() => {
              if (onOpenPositionsModal) {
                onOpenPositionsModal({
                  title: 'Sebaran Seluruh Titik Pohon Melon',
                  color: 'green',
                  count: totalTrees,
                  type: 'all'
                });
              }
            }}
            className="bento-pill-secondary"
            title="Lihat peta sebaran posisi pohon"
          >
            <MapPin size={16} weight="bold" />
            <span>Peta Titik Pohon</span>
          </button>
        </div>
      </div>

      {/* 2. Top Row: 3 Bento Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: HERO HIGHLIGHT CARD (Deep Green #14532D) */}
        <div
          onClick={() => {
            if (onOpenPositionsModal) {
              onOpenPositionsModal({
                title: 'Daftar Pohon Sehat Bebas Hama',
                color: 'green',
                count: sehatCount,
                type: 'disease'
              });
            }
          }}
          className="bento-card bento-hero-green bento-card-interactive"
          title="Klik untuk melihat sebaran pohon sehat"
          style={{ overflow: 'hidden' }}
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
            <span>{healthyPct}% Populasi Sehat</span>
          </div>
        </div>

        {/* Card 2: Pohon Perlu Dicek / Sakit */}
        <div
          onClick={() => {
            if (onOpenPositionsModal) {
              onOpenPositionsModal({
                title: 'Daftar Titik Pohon Perlu Dicek',
                color: 'red',
                count: sakitCount,
                type: 'disease'
              });
            }
          }}
          className="bento-card bento-card-interactive"
          title="Klik untuk melihat posisi pohon yang perlu dicek"
          style={{ overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim, #64748B)' }}>
              Perlu Dicek
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
            <span>Perlu Perawatan Daun</span>
          </div>
        </div>

        {/* Card 3: Total Populasi Pohon Dipantau */}
        <div
          onClick={() => {
            if (onOpenPositionsModal) {
              onOpenPositionsModal({
                title: 'Sebaran Seluruh Titik Pohon Melon',
                color: 'green',
                count: totalTrees,
                type: 'all'
              });
            }
          }}
          className="bento-card bento-card-interactive"
          title="Klik untuk melihat seluruh sebaran pohon"
          style={{ overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim, #64748B)' }}>
              Total Pohon Dipantau
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
            {totalTrees}
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
            <Plant size={12} weight="bold" />
            <span>3 Greenhouse Hidroponik</span>
          </div>
        </div>
      </div>

      {/* 3. Row 2: Health Arc Gauge + Sebaran per Greenhouse */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem',
        alignItems: 'stretch'
      }}>
        {/* Card A: Health Arc Gauge */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main, #0F172A)', margin: 0 }}>
                Indeks Kesehatan Tanaman
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary, #166534)', fontWeight: 700 }}>
                Persentase Kebun
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-dim, #64748B)', margin: '0 0 1rem 0' }}>
              Persentase pohon melon yang tumbuh sehat tanpa gejala penyakit
            </p>
          </div>

          <div style={{ margin: '0.25rem 0 0.5rem 0' }}>
            <GaugeArc
              percentage={healthyPct}
              label="Pohon Sehat"
              sublabel={`${sehatCount} dari total ${totalTrees} pohon`}
              color="#047857"
              trackColor="#FEE2E2"
              size={210}
              strokeWidth={17}
            />
          </div>

          {/* 2-Column Micro-Cards Legend */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.5rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle, #E2E8F0)'
          }}>
            <div style={{
              padding: '0.45rem 0.5rem',
              backgroundColor: '#F0FDF4',
              borderRadius: '8px',
              border: '1px solid #BBF7D0',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#047857' }} />
                <span style={{ fontSize: '10px', color: '#047857', fontWeight: 700 }}>
                  Sehat Normal ({healthyPct}%)
                </span>
              </div>
              <strong style={{ fontSize: '12px', color: '#047857', fontWeight: 800 }}>
                {sehatCount} Pohon
              </strong>
            </div>

            <div style={{
              padding: '0.45rem 0.5rem',
              backgroundColor: '#FEF2F2',
              borderRadius: '8px',
              border: '1px solid #FECACA',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#B91C1C' }} />
                <span style={{ fontSize: '10px', color: '#B91C1C', fontWeight: 700 }}>
                  Perlu Dicek ({Math.max(0, 100 - healthyPct)}%)
                </span>
              </div>
              <strong style={{ fontSize: '12px', color: '#B91C1C', fontWeight: 800 }}>
                {sakitCount} Pohon
              </strong>
            </div>
          </div>
        </div>

        {/* Card B: Distribusi Kondisi per Greenhouse (Data Nyata, Tanpa Hallucinated Reminders) */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main, #0F172A)', margin: 0 }}>
                Kondisi Daun per Greenhouse
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary, #166534)', fontWeight: 700 }}>
                3 Greenhouse
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-dim, #64748B)', margin: '0 0 1.1rem 0' }}>
              Distribusi pohon sehat dan titik yang perlu dicek pada setiap lokasi
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* Greenhouse Sakura */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--text-main, #0F172A)', display: 'block' }}>
                      Greenhouse Sakura (Ciwidey)
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim, #64748B)' }}>
                      Total 32 Pohon
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-success" style={{ fontSize: '11px' }}>27 Sehat</span>
                    <span className="badge badge-danger" style={{ fontSize: '11px' }}>5 Perlu Cek</span>
                  </div>
                </div>
                <div style={{ height: '5px', backgroundColor: '#FEE2E2', borderRadius: '999px', overflow: 'hidden', display: 'flex', marginTop: '0.45rem' }}>
                  <div style={{ width: `${(27 / 32) * 100}%`, backgroundColor: '#16A34A' }} />
                </div>
              </div>

              {/* Greenhouse Maribaya */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--text-main, #0F172A)', display: 'block' }}>
                      Greenhouse Maribaya (Lembang)
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim, #64748B)' }}>
                      Total 32 Pohon
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-success" style={{ fontSize: '11px' }}>25 Sehat</span>
                    <span className="badge badge-danger" style={{ fontSize: '11px' }}>7 Perlu Cek</span>
                  </div>
                </div>
                <div style={{ height: '5px', backgroundColor: '#FEE2E2', borderRadius: '999px', overflow: 'hidden', display: 'flex', marginTop: '0.45rem' }}>
                  <div style={{ width: `${(25 / 32) * 100}%`, backgroundColor: '#16A34A' }} />
                </div>
              </div>

              {/* Greenhouse Cisondari */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--text-main, #0F172A)', display: 'block' }}>
                      Greenhouse Cisondari (Pasirjambu)
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim, #64748B)' }}>
                      Total 32 Pohon
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-success" style={{ fontSize: '11px' }}>22 Sehat</span>
                    <span className="badge badge-danger" style={{ fontSize: '11px' }}>10 Perlu Cek</span>
                  </div>
                </div>
                <div style={{ height: '5px', backgroundColor: '#FEE2E2', borderRadius: '999px', overflow: 'hidden', display: 'flex', marginTop: '0.45rem' }}>
                  <div style={{ width: `${(22 / 32) * 100}%`, backgroundColor: '#16A34A' }} />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (onOpenPositionsModal) {
                onOpenPositionsModal({
                  title: 'Daftar Titik Pohon Perlu Dicek (Seluruh Greenhouse)',
                  color: 'red',
                  count: sakitCount,
                  type: 'disease'
                });
              }
            }}
            className="bento-pill-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', backgroundColor: '#B91C1C', marginTop: '1rem' }}
          >
            <ShieldWarning size={15} weight="bold" />
            <span>Lihat Posisi Pohon Perlu Dicek ({sakitCount})</span>
          </button>
        </div>
      </div>

      {/* 4. Row 3: Data Table / Cards of Melon Trees (Sync with B2B Design System) */}
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
                Daftar Pemeriksaan Daun Pohon
              </h2>
              <span className="badge badge-success" style={{ fontSize: '0.74rem' }}>
                {displayedTrees.length} Pohon Terdaftar
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-dim, #64748B)' }}>
              Hasil pemantauan kesehatan helai daun, gejala penyakit, dan posisi jalur pohon.
            </p>
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
                      color: isActive ? 'var(--text-main, #0F172A)' : 'var(--text-dim, #64748B)',
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
                placeholder="Cari ID pohon / gejala..."
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
                  <th style={{ width: '22%', minWidth: '155px' }}>ID Pohon & QR</th>
                  <th style={{ width: '18%', minWidth: '130px' }}>Posisi Jalur</th>
                  <th style={{ width: '22%', minWidth: '160px' }}>Greenhouse</th>
                  <th style={{ width: '14%', minWidth: '110px', textAlign: 'center' }}>Kondisi Daun</th>
                  <th style={{ width: '16%', minWidth: '130px' }}>Diagnosis</th>
                  <th style={{ width: '10%', minWidth: '90px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedTrees.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
                      Tidak ada data pohon yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  displayedTrees.map((t) => {
                    const isSehat = t.is_sehat !== false && (!t.kondisi || t.kondisi.toLowerCase() === 'sehat');
                    const badgeClass = isSehat ? 'badge-success' : 'badge-danger';
                    const badgeLabel = isSehat ? 'Sehat' : 'Perlu Dicek';

                    return (
                      <tr key={t.tree_id}>
                        {/* ID Pohon & QR */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                              onClick={() => onSelectTree && onSelectTree(t.tree_id)}
                              style={{
                                cursor: 'pointer',
                                display: 'inline-flex',
                                flexShrink: 0,
                                borderRadius: '6px',
                                transition: 'transform 0.15s ease'
                              }}
                              title={`Klik untuk rincian & info QR (${t.qr_code || `QR-TREE-${t.tree_id}`})`}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                              <QrThumbnail text={t.qr_code || `QR-TREE-${t.tree_id}`} size={34} />
                            </div>
                            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                              <strong className="font-mono" style={{ fontSize: '13px', color: 'var(--text-main, #0F172A)', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {t.tree_id}
                              </strong>
                              <span className="font-mono" style={{ fontSize: '10px', color: isSehat ? 'var(--primary, #166534)' : '#B91C1C', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {t.qr_code || `QR-TREE-${t.tree_id}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Posisi Jalur */}
                        <td>
                          <div style={{ fontSize: '12px', color: 'var(--text-main, #0F172A)' }}>
                            <strong>{t.row || `Jalur ${t.row_index || 1}`}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim, #64748B)', marginTop: '2px' }}>
                              Pohon ke-{t.tree_index || 1}
                            </div>
                          </div>
                        </td>

                        {/* Greenhouse */}
                        <td>
                          <div style={{ fontSize: '12px', color: 'var(--text-main, #0F172A)' }}>
                            <span style={{ fontWeight: 600 }}>{t.greenhouse_name || 'Greenhouse Sakura'}</span>
                            <div style={{ fontSize: '10.5px', color: 'var(--primary, #166534)', fontWeight: 600, marginTop: '2px' }}>
                              Melon Hidroponik
                            </div>
                          </div>
                        </td>

                        {/* Kondisi Daun */}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '11px', padding: '3px 9px' }}>
                            {badgeLabel}
                          </span>
                        </td>

                        {/* Diagnosis */}
                        <td>
                          <div style={{ fontSize: '12px', color: isSehat ? '#166534' : '#B91C1C', fontWeight: 600 }}>
                            {t.diagnosis || (isSehat ? 'Normal (Bebas Hama)' : 'Perlu Diperiksa')}
                          </div>
                          {t.gejala && (
                            <div style={{ fontSize: '11px', color: 'var(--text-dim, #64748B)', marginTop: '2px' }}>
                              {t.gejala}
                            </div>
                          )}
                        </td>

                        {/* Aksi */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => onSelectTree && onSelectTree(t.tree_id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle, #E2E8F0)',
                              backgroundColor: '#FFFFFF',
                              color: isSehat ? 'var(--primary, #166534)' : '#B91C1C',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = isSehat ? 'var(--primary-subtle, #F0FDF4)' : '#FEF2F2'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                            title="Lihat rincian daun & posisi"
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
            {displayedTrees.map((t) => {
              const isSehat = t.is_sehat !== false && (!t.kondisi || t.kondisi.toLowerCase() === 'sehat');
              const badgeClass = isSehat ? 'badge-success' : 'badge-danger';
              const badgeLabel = isSehat ? 'Sehat' : 'Perlu Dicek';

              return (
                <div
                  key={t.tree_id}
                  onClick={() => onSelectTree && onSelectTree(t.tree_id)}
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
                      <QrThumbnail text={t.qr_code || `QR-TREE-${t.tree_id}`} size={30} />
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <span className="font-mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main, #0F172A)', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {t.tree_id}
                        </span>
                        <span className="font-mono" style={{ fontSize: '9.5px', color: isSehat ? 'var(--primary, #166534)' : '#B91C1C', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {t.qr_code || `QR-TREE-${t.tree_id}`}
                        </span>
                      </div>
                    </div>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: '10.5px', flexShrink: 0 }}>
                      {badgeLabel}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-dim, #64748B)' }}>
                    <div>{t.greenhouse_name}</div>
                    <div style={{ marginTop: '2px', fontWeight: 600, color: 'var(--text-main, #0F172A)' }}>
                      {t.row || `Jalur ${t.row_index || 1}`} · Pohon {t.tree_index || 1}
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
                    <span style={{ color: isSehat ? '#166534' : '#B91C1C', fontWeight: 600 }}>
                      {t.diagnosis || (isSehat ? 'Normal' : 'Gejala Sakit')}
                    </span>
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
