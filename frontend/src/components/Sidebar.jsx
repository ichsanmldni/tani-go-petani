import React from 'react';
import {
  SquaresFour,
  Plant,
  VideoCamera,
  MapPin,
  Robot,
  Question,
  Gear,
  ArrowRight,
  X,
  Buildings,
  Circle
} from '@phosphor-icons/react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  stats,
  sidebarOpen,
  setSidebarOpen,
  onOpenPositionsModal
}) {
  const sickCount = stats?.disease?.sakit || 22;
  const readyCount = stats?.ripeness?.matang || 28;

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024 && setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const handlePositionsClick = () => {
    if (onOpenPositionsModal) {
      onOpenPositionsModal({
        title: 'Peta Sebaran Posisi Pohon & Buah (Seluruh Greenhouse)',
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
          borderRight: '1px solid #EAEFEA',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.25rem 1rem',
          height: '100vh',
          position: 'sticky',
          top: 0,
          flexShrink: 0,
          zIndex: 95,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
          {/* Logo & Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <img
                src="/logo.png"
                alt="Logo Tanigo"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  objectFit: 'contain',
                  display: 'block',
                  boxShadow: '0 2px 8px rgba(22, 101, 52, 0.15)'
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/static/img/logo.png';
                }}
              />
              <div>
                <strong style={{
                  fontSize: '1.2rem',
                  color: '#0F172A',
                  display: 'block',
                  lineHeight: 1.1,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.02em'
                }}>
                  Tanigo
                </strong>
                <span style={{ fontSize: '0.68rem', color: '#166534', fontWeight: 700, letterSpacing: '0.02em' }}>
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
                color: '#64748B',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Section: MENU */}
          <div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#94A3B8',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '0.5rem',
              paddingLeft: '0.5rem'
            }}>
              MENU UTAMA
            </span>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {/* 1. Dashboard / Kematangan */}
              <button
                onClick={() => handleNavClick('kematangan')}
                className={`sidebar-nav-item ${activeTab === 'kematangan' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === 'kematangan' ? '#F0FDF4' : 'transparent',
                  color: activeTab === 'kematangan' ? '#166534' : '#64748B',
                  fontWeight: activeTab === 'kematangan' ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <SquaresFour size={19} weight={activeTab === 'kematangan' ? 'fill' : 'regular'} style={{ color: activeTab === 'kematangan' ? '#166534' : '#64748B' }} />
                  <span>Kematangan Buah</span>
                </div>
                {readyCount > 0 && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    backgroundColor: activeTab === 'kematangan' ? '#166534' : '#E2E8F0',
                    color: activeTab === 'kematangan' ? '#FFFFFF' : '#475569',
                    padding: '2px 7px',
                    borderRadius: '999px'
                  }}>
                    {readyCount}
                  </span>
                )}
                {/* Active Indicator Bar */}
                {activeTab === 'kematangan' && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '3.5px',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: '#166534'
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
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === 'penyakit' ? '#FEF2F2' : 'transparent',
                  color: activeTab === 'penyakit' ? '#B91C1C' : '#64748B',
                  fontWeight: activeTab === 'penyakit' ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Plant size={19} weight={activeTab === 'penyakit' ? 'fill' : 'regular'} style={{ color: activeTab === 'penyakit' ? '#B91C1C' : '#64748B' }} />
                  <span>Kesehatan Daun</span>
                </div>
                {sickCount > 0 && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    backgroundColor: activeTab === 'penyakit' ? '#B91C1C' : '#FEE2E2',
                    color: activeTab === 'penyakit' ? '#FFFFFF' : '#B91C1C',
                    padding: '2px 7px',
                    borderRadius: '999px'
                  }}>
                    {sickCount} Sakit
                  </span>
                )}
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

              {/* 3. Uji Kamera AI */}
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
                  backgroundColor: activeTab === 'simulator' ? '#F0FDF4' : 'transparent',
                  color: activeTab === 'simulator' ? '#166534' : '#64748B',
                  fontWeight: activeTab === 'simulator' ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <VideoCamera size={19} weight={activeTab === 'simulator' ? 'fill' : 'regular'} style={{ color: activeTab === 'simulator' ? '#166534' : '#64748B' }} />
                  <span>Uji Kamera AI</span>
                </div>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  backgroundColor: '#DCFCE7',
                  color: '#166534',
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}>
                  YOLO11
                </span>
                {activeTab === 'simulator' && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '3.5px',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: '#166534'
                  }} />
                )}
              </button>

              {/* 4. Posisi Pohon Modal */}
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
                  color: '#64748B',
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

          {/* Section: KEBUN MITRA */}
          <div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#94A3B8',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '0.5rem',
              paddingLeft: '0.5rem'
            }}>
              GREENHOUSE AKTIF
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.45rem 0.65rem', fontSize: '0.78rem', color: '#334155', borderRadius: '8px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
                <span>GH-1 Sakura (Ciwidey)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.45rem 0.65rem', fontSize: '0.78rem', color: '#334155', borderRadius: '8px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
                <span>GH-2 Maribaya (Lembang)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.45rem 0.65rem', fontSize: '0.78rem', color: '#334155', borderRadius: '8px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#EAB308', display: 'inline-block' }} />
                <span>GH-3 Cisondari (Pasirjambu)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Card (Similar to Donezo Download App Card) */}
        <div style={{
          marginTop: '1.25rem',
          padding: '1rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #14532D 0%, #064E3B 100%)',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 20px -4px rgba(20, 83, 45, 0.35)'
        }}>
          {/* Subtle Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(134, 239, 172, 0.3) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#86EFAC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ROKAE Eye-in-Hand
            </span>
          </div>

          <strong style={{ fontSize: '0.88rem', display: 'block', lineHeight: 1.25, marginBottom: '0.35rem', color: '#F0FDF4' }}>
            Kamera AI Siap
          </strong>
          <p style={{ fontSize: '0.7rem', color: '#A7F3D0', margin: '0 0 0.75rem 0', lineHeight: 1.35 }}>
            Deteksi kematangan & penyakit melon via kamera langsung.
          </p>

          <button
            onClick={() => handleNavClick('simulator')}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: '#FFFFFF',
              color: '#14532D',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Buka Uji Kamera</span>
            <ArrowRight size={13} weight="bold" />
          </button>
        </div>
      </aside>
    </>
  );
}
