import React from 'react';
import {
  SquaresFour,
  Plant,
  VideoCamera,
  MapPin,
  X
} from '@phosphor-icons/react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  stats,
  sidebarOpen,
  setSidebarOpen,
  onOpenPositionsModal
}) {
  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024 && setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const handlePositionsClick = () => {
    if (onOpenPositionsModal) {
      onOpenPositionsModal({
        title: 'Peta Sebaran Posisi Pohon & Buah (Seluruh Kebun)',
        color: 'green',
        count: stats?.total_fruits || 96,
        type: 'all'
      });
    }
    if (window.innerWidth < 1024 && setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 90,
            display: 'block'
          }}
          className="sidebar-backdrop-mobile"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: '240px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--border-subtle, #E2E8F0)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.25rem 1rem',
          height: '100vh',
          position: 'sticky',
          top: 0,
          flexShrink: 0,
          zIndex: 95,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
          {/* Logo & Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <img
                src="/logo.png"
                alt="Logo TaniGo"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  objectFit: 'contain',
                  display: 'block'
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/static/img/logo.png';
                }}
              />
              <div>
                <strong style={{
                  fontSize: '1.18rem',
                  color: 'var(--text-main, #0F172A)',
                  display: 'block',
                  lineHeight: 1.1,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.02em'
                }}>
                  TaniGo
                </strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--primary, #166534)', fontWeight: 700, letterSpacing: '0.02em' }}>
                  Smart Agro Platform
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="mobile-close-btn"
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim, #64748B)',
                cursor: 'pointer',
                padding: '4px'
              }}
              aria-label="Tutup Menu"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Section: MENU UTAMA */}
          <div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--text-dim, #94A3B8)',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '0.5rem',
              paddingLeft: '0.5rem'
            }}>
              MENU UTAMA
            </span>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {/* 1. Kematangan Buah */}
              <button
                onClick={() => handleNavClick('kematangan')}
                className={`sidebar-nav-item ${activeTab === 'kematangan' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === 'kematangan' ? 'var(--primary-subtle, #F0FDF4)' : 'transparent',
                  color: activeTab === 'kematangan' ? 'var(--primary, #166534)' : 'var(--text-dim, #64748B)',
                  fontWeight: activeTab === 'kematangan' ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <SquaresFour size={19} weight={activeTab === 'kematangan' ? 'fill' : 'regular'} style={{ color: activeTab === 'kematangan' ? 'var(--primary, #166534)' : 'var(--text-dim, #64748B)' }} />
                <span>Kematangan Buah</span>
                {activeTab === 'kematangan' && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '3.5px',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: 'var(--primary, #166534)'
                  }} />
                )}
              </button>

              {/* 2. Kesehatan Daun */}
              <button
                onClick={() => handleNavClick('penyakit')}
                className={`sidebar-nav-item ${activeTab === 'penyakit' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === 'penyakit' ? '#FEF2F2' : 'transparent',
                  color: activeTab === 'penyakit' ? '#B91C1C' : 'var(--text-dim, #64748B)',
                  fontWeight: activeTab === 'penyakit' ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <Plant size={19} weight={activeTab === 'penyakit' ? 'fill' : 'regular'} style={{ color: activeTab === 'penyakit' ? '#B91C1C' : 'var(--text-dim, #64748B)' }} />
                <span>Kesehatan Daun</span>
                {activeTab === 'penyakit' && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '3.5px',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: '#B91C1C'
                  }} />
                )}
              </button>

              {/* 3. Akuisisi Citra (Bebas dari sebutan robot / AI berlebihan) */}
              <button
                onClick={() => handleNavClick('simulator')}
                className={`sidebar-nav-item ${activeTab === 'simulator' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === 'simulator' ? 'var(--primary-subtle, #F0FDF4)' : 'transparent',
                  color: activeTab === 'simulator' ? 'var(--primary, #166534)' : 'var(--text-dim, #64748B)',
                  fontWeight: activeTab === 'simulator' ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <VideoCamera size={19} weight={activeTab === 'simulator' ? 'fill' : 'regular'} style={{ color: activeTab === 'simulator' ? 'var(--primary, #166534)' : 'var(--text-dim, #64748B)' }} />
                  <span>Akuisisi Citra</span>
                </div>
                {activeTab === 'simulator' && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '3.5px',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: 'var(--primary, #166534)'
                  }} />
                )}
              </button>

              {/* 4. Peta Posisi Pohon */}
              <button
                onClick={handlePositionsClick}
                className="sidebar-nav-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-dim, #64748B)',
                  fontWeight: 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <MapPin size={19} />
                <span>Peta Posisi Pohon</span>
              </button>
            </nav>
          </div>

          {/* Section: GREENHOUSE AKTIF */}
          <div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--text-dim, #94A3B8)',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '0.5rem',
              paddingLeft: '0.5rem'
            }}>
              KEBUN AKTIF
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.45rem 0.65rem', fontSize: '0.78rem', color: 'var(--text-main, #0F172A)', borderRadius: '8px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
                <span>Kebun Sakura (Ciwidey)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.45rem 0.65rem', fontSize: '0.78rem', color: 'var(--text-main, #0F172A)', borderRadius: '8px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
                <span>Kebun Maribaya (Lembang)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.45rem 0.65rem', fontSize: '0.78rem', color: 'var(--text-main, #0F172A)', borderRadius: '8px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
                <span>Kebun Cisondari (Pasirjambu)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info Sederhana & Ramah Pengguna (Tanpa Card Slop ROKAE / Promosi Berlebihan) */}
        <div style={{
          padding: '0.75rem 0.5rem',
          borderTop: '1px solid var(--border-subtle, #E2E8F0)',
          fontSize: '0.72rem',
          color: 'var(--text-dim, #64748B)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>TaniGo Agro v1.0</span>
          <span style={{ color: 'var(--primary, #166534)', fontWeight: 600 }}>Sistem Aktif</span>
        </div>
      </aside>
    </>
  );
}
