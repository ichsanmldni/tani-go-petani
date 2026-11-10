import React from 'react';

export default function GaugeArc({
  percentage = 77,
  label = 'Pohon Sehat',
  sublabel = 'Dari 96 Total Pohon',
  color = '#166534',
  trackColor = '#E2E8F0',
  size = 190,
  strokeWidth = 16
}) {
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2 + 10;
  
  // Half-circle arc from 180 to 360 degrees (Math.PI to 2*Math.PI)
  const arcLength = Math.PI * radius;
  const dashOffset = arcLength * (1 - Math.min(100, Math.max(0, percentage)) / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size / 2 + 35 }}>
        <svg width={size} height={size / 2 + 25} viewBox={`0 0 ${size} ${size / 2 + 25}`} style={{ overflow: 'visible' }}>
          {/* Background Track */}
          <path
            d={`M ${strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${centerY}`}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active Progress Arc */}
          <path
            d={`M ${strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${centerY}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>

        {/* Center Percentage Display */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 0,
          right: 0,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>
            {percentage}%
          </span>
          <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginTop: '3px' }}>
            {label}
          </span>
        </div>
      </div>
      {sublabel && (
        <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}

