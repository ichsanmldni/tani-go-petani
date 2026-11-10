import React, { useState } from 'react';

export default function CapsuleBarChart({ ghDistribution = {} }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // We have 3 greenhouses, let's map them and daily activity
  const items = [
    { label: 'Sen', fullLabel: 'Senin', count: 18, max: 32, type: 'striped', color: '#166534' },
    { label: 'Sel', fullLabel: 'Selasa', count: 24, max: 32, type: 'solid-mint', color: '#86efac' },
    { label: 'Rab', fullLabel: 'Rabu', count: 28, max: 32, type: 'solid-green', color: '#166534', highlight: '28 Buah' },
    { label: 'Kam', fullLabel: 'Kamis', count: 22, max: 32, type: 'solid-dark', color: '#14532d' },
    { label: 'Jum', fullLabel: 'Jumat', count: 16, max: 32, type: 'striped', color: '#166534' },
    { label: 'Sab', fullLabel: 'Sabtu', count: 20, max: 32, type: 'striped', color: '#166534' },
    { label: 'Min', fullLabel: 'Minggu', count: 14, max: 32, type: 'striped', color: '#166534' },
  ];

  const chartHeight = 120;

  return (
    <div style={{ width: '100%' }}>
      {/* SVG Pattern Definition for Striped Diagonal Capsules */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="2.5" />
          </pattern>
          <pattern id="greenDiagonalHatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#86efac" strokeWidth="2.5" />
          </pattern>
        </defs>
      </svg>

      {/* Capsule Bars Row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: chartHeight,
        padding: '0 0.5rem',
        gap: '0.65rem'
      }}>
        {items.map((bar, idx) => {
          const heightPct = Math.max(35, Math.min(100, (bar.count / bar.max) * 100));
          const isHovered = hoveredIdx === idx;
          const isHighlight = bar.highlight;

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
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              {/* Optional Floating Tag Chip like Donezo mock */}
              {isHighlight && (
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #DDE5DC',
                  borderRadius: '999px',
                  padding: '2px 7px',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#166534',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  whiteSpace: 'nowrap',
                  zIndex: 2
                }}>
                  {bar.highlight}
                </div>
              )}

              {/* Capsule Shape */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '36px',
                  height: `${heightPct}%`,
                  borderRadius: '9999px',
                  backgroundColor: bar.type === 'striped' 
                    ? 'transparent' 
                    : (bar.type === 'solid-mint' ? '#86efac' : (bar.type === 'solid-dark' ? '#14532d' : '#166534')),
                  backgroundImage: bar.type === 'striped' 
                    ? 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 3px, #f8fafc 3px, #f8fafc 8px)' 
                    : 'none',
                  border: bar.type === 'striped' ? '1px solid #e2e8f0' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                  transformOrigin: 'bottom',
                  boxShadow: (bar.type.startsWith('solid') && isHovered) ? '0 4px 12px rgba(22, 101, 52, 0.25)' : 'none'
                }}
              />

              {/* Day Label */}
              <span style={{
                fontSize: '11px',
                fontWeight: isHighlight ? 800 : 600,
                color: isHighlight ? '#166534' : '#94A3B8',
                marginTop: '6px'
              }}>
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

