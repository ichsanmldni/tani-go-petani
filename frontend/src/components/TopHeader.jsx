import React from 'react';
import { MagnifyingGlass, List } from '@phosphor-icons/react';

export default function TopHeader({
  searchQuery = '',
  setSearchQuery,
  sidebarOpen,
  setSidebarOpen,
  activeTab
}) {
  return (
    <header
      className="dashboard-top-header"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        gap: '1rem',
        minHeight: '58px',
        boxSizing: 'border-box'
      }}
    >
      {/* Search Pill Bar & Mobile Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '560px', minWidth: 0 }}>
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setSidebarOpen && setSidebarOpen(!sidebarOpen)}
          className="mobile-hamburger-btn"
          style={{
            display: 'none',
            background: 'var(--bg-subtle, #F0F4EF)',
            border: '1px solid var(--border-subtle, #E2E8F0)',
            borderRadius: '10px',
            padding: '7px',
            color: 'var(--text-main, #0F172A)',
            cursor: 'pointer',
            flexShrink: 0
          }}
          aria-label="Toggle Menu"
        >
          <List size={20} weight="bold" />
        </button>

        {/* Search Pill Input */}
        <div style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          minWidth: 0
        }}>
          <MagnifyingGlass
            size={16}
            weight="bold"
            style={{
              position: 'absolute',
              left: '14px',
              color: 'var(--text-dim, #64748B)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            placeholder="Cari ID buah, pohon, atau kebun..."
            style={{
              width: '100%',
              padding: '0.55rem 3rem 0.55rem 2.4rem',
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-subtle, #E2E8F0)',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              color: 'var(--text-main, #0F172A)',
              outline: 'none',
              transition: 'all 0.15s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = '#FFFFFF';
              e.target.style.borderColor = 'var(--primary, #166534)';
              e.target.style.boxShadow = '0 0 0 3px rgba(22, 101, 52, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = '#F8FAFC';
              e.target.style.borderColor = 'var(--border-subtle, #E2E8F0)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <div style={{
            position: 'absolute',
            right: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#EDF2EC',
            border: '1px solid #DDE5DC',
            borderRadius: '6px',
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--text-dim, #64748B)',
            pointerEvents: 'none'
          }}>
            <span>/</span>
          </div>
        </div>
      </div>
    </header>
  );
}
