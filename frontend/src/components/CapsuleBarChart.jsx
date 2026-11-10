import React, { useState } from 'react';

export default function CapsuleBarChart({ ghDistribution = {} }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const items = [
    { label: 'Sen', fullLabel: 'Senin', count: 18, type: 'striped' },
    { label: 'Sel', fullLabel: 'Selasa', count: 22, type: 'mint' },
    { label: 'Rab', fullLabel: 'Rabu', count: 28, type: 'peak', highlight: '28 Buah' },
    { label: 'Kam', fullLabel: 'Kamis', count: 24, type: 'solid' },
    { label: 'Jum', fullLabel: 'Jumat', count: 16, type: 'striped' },
    { label: 'Sab', fullLabel: 'Sabtu', count: 19, type: 'striped' },
    { label: 'Min', fullLabel: 'Minggu', count: 14, type: 'striped' },
  ];

  const maxCount = 28;
  const maxBarHeight = 72; // pixels, leaving ample headroom so badges never clip
  const minBarHeight = 28;

  const currentHovered = hoveredIdx !== null ? items[hoveredIdx] : null;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Dynamic Sub-header Chip (Interactive Hover State) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.74rem',
        marginBottom: '0.75rem',
        minHeight: '20px'
      }}>
        <span style={{ color: 'var(--text-dim, #64748B)' }}>
          {currentHovered
            ? `${currentHovered.fullLabel}: `
            : 'Puncak Panen: '}
          <strong style={{ color: 'var(--text-main, #0F172A)' }}>
            {currentHovered ? `${currentHovered.count} Buah Terdata` : 'Rabu (28 Buah Matang)'}
          </strong>
        </span>

        <span style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: 'var(--primary, #166534)',
          backgroundColor: 'var(--primary-subtle, #F0FDF4)',
          padding: '2px 8px',
          borderRadius: '999px',
          border: '1px solid var(--primary-border, #BBF7D0)'
        }}>
          7 Hari Terakhir
        </span>
      </div>

      {/* Capsule Bars Row with guaranteed headroom */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: '130px',
        padding: '0 0.25rem',
        gap: '0.5rem',
        boxSizing: 'border-box'
      }}>
        {items.map((bar, idx) => {
          const barHeight = minBarHeight + ((bar.count / maxCount) * (maxBarHeight - minBarHeight));
          const isHovered = hoveredIdx === idx;
          const isPeak = bar.type === 'peak';
          const showBadge = isPeak || isHovered;

          return (
            <div
              key={bar.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                cursor: 'pointer',
                position: 'relative',
                minWidth: 0
              }}
            >
              {/* Floating Badge (Flow layout directly above bar, never clips) */}
              <div style={{
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '5px',
                visibility: showBadge ? 'visible' : 'hidden',
                transition: 'opacity 0.15s ease'
              }}>
                <span style={{
                  backgroundColor: isPeak ? 'var(--primary, #166534)' : '#FFFFFF',
                  color: isPeak ? '#FFFFFF' : 'var(--text-main, #0F172A)',
                  border: isPeak ? 'none' : '1px solid var(--border-subtle, #E2E8F0)',
                  borderRadius: '999px',
                  padding: '2px 6px',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  whiteSpace: 'nowrap'
                }}>
                  {bar.count}
                </span>
              </div>

              {/* Rounded Capsule Shape */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '30px',
                  height: `${barHeight}px`,
                  borderRadius: '9999px',
                  backgroundColor: bar.type === 'striped'
                    ? 'transparent'
                    : (bar.type === 'mint' ? '#86EFAC' : (bar.type === 'solid' ? '#166534' : '#14532D')),
                  backgroundImage: bar.type === 'striped'
                    ? 'repeating-linear-gradient(45deg, #E2E8F0, #E2E8F0 3px, #F8FAFC 3px, #F8FAFC 7px)'
                    : 'none',
                  border: bar.type === 'striped' ? '1px solid #CBD5E1' : 'none',
                  transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease',
                  transform: isHovered ? 'scaleY(1.06)' : 'scaleY(1)',
                  transformOrigin: 'bottom',
                  boxShadow: (bar.type !== 'striped' && isHovered) ? '0 4px 12px rgba(22, 101, 52, 0.28)' : 'none',
                  boxSizing: 'border-box'
                }}
              />

              {/* Day Label */}
              <div style={{
                marginTop: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: isPeak ? 800 : (isHovered ? 700 : 500),
                  color: isPeak ? 'var(--primary, #166534)' : (isHovered ? 'var(--text-main, #0F172A)' : 'var(--text-dim, #64748B)')
                }}>
                  {bar.label}
                </span>
                {isPeak && (
                  <span style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary, #166534)'
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
