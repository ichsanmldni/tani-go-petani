import React from 'react';
import {
  MagnifyingGlass,
  Bell,
  ChatCircleText,
  List,
  Command,
  ArrowsClockwise
} from '@phosphor-icons/react';

export default function TopHeader({
  searchQuery = '',
  setSearchQuery,
  onRefresh,
  sidebarOpen,
  setSidebarOpen,
  activeTab
}) {
  return (
    <header
      className="dashboard-top-header"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #EAEFEA',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        gap: '1rem'
      }}
    >
      {/* Left: Mobile Toggle & Search Pill Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '480px' }}>
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setSidebarOpen && setSidebarOpen(!sidebarOpen)}
          className="mobile-hamburger-btn"
          style={{
            display: 'none',
            background: '#F6F8F4',
            border: '1px solid #DDE5DC',
            borderRadius: '10px',
            padding: '7px',
            color: '#1B2A22',
            cursor: 'pointer'
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
          alignItems: 'center'
        }}>
          <MagnifyingGlass
            size={16}
            weight="bold"
            style={{
              position: 'absolute',
              left: '14px',
              color: '#94A3B8'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            placeholder="Cari ID buah (MLN-...), pohon, atau greenhouse..."
            style={{
              width: '100%',
              padding: '0.55rem 3.5rem 0.55rem 2.4rem',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              color: '#1E293B',
              outline: 'none',
              transition: 'all 0.15s ease'
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = '#FFFFFF';
              e.target.style.borderColor = '#166534';
              e.target.style.boxShadow = '0 0 0 3px rgba(22, 101, 52, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = '#F8FAFC';
              e.target.style.borderColor = '#E2E8F0';
              e.target.style.boxShadow = 'none';
            }}
          />
          <div style={{
            position: 'absolute',
            right: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            backgroundColor: '#EDF2EC',
            border: '1px solid #DDE5DC',
            borderRadius: '6px',
            padding: '2px 5px',
            fontSize: '9px',
            fontWeight: 700,
            color: '#64748B',
            pointerEvents: 'none'
          }}>
            <span>/</span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Notifications, & User Profile Chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Segarkan Data Real-Time"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#166534'; e.currentTarget.style.backgroundColor = '#F0FDF4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
          >
            <ArrowsClockwise size={16} weight="bold" />
          </button>
        )}

        {/* Notifications Button */}
        <div style={{ position: 'relative' }}>
          <button
            title="Pemberitahuan Kebun"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Bell size={16} />
          </button>
          {/* Active Red Dot */}
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#EF4444',
            border: '1.5px solid #FFFFFF'
          }} />
        </div>

        {/* User Profile Chip (Donezo Style) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '3px 10px 3px 4px',
          borderRadius: '9999px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0'
        }}>
          {/* Avatar circle */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#166534',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 800,
            boxShadow: '0 2px 6px rgba(22, 101, 52, 0.2)'
          }}>
            AS
          </div>
          <div className="user-profile-text" style={{ lineHeight: 1.2 }}>
            <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>
              Kang Asep
            </strong>
            <span style={{ fontSize: '10.5px', color: '#64748B' }}>
              Kepala Kebun Ciwidey
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
