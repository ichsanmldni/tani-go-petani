import React, { useId } from 'react';

/**
 * GaugeArc - Modern semi-circular gauge chart component
 * Supports:
 * - Single progress percentage mode (e.g. for health index)
 * - Multi-segment stacked arc mode (e.g. Matang + Mengkal vs Mentah harvest readiness)
 * - Donezo-inspired aesthetic with clean typography and subtle patterns
 */
export default function GaugeArc({
  percentage,
  label = 'Kesiapan Panen',
  sublabel,
  color = '#166534',
  trackColor = '#E2E8F0',
  size = 210,
  strokeWidth = 17,
  segments = null, // Optional array: [{ value: number, color: string, label: string }]
  total = 100
}) {
  const generatedId = useId ? useId().replace(/[^a-zA-Z0-9]/g, '') : 'gauge';
  const patternId = `gauge-hatch-${generatedId}`;

  const radius = (size - strokeWidth) / 2;
  const centerY = radius + strokeWidth / 2 + 8;
  const svgHeight = centerY + strokeWidth / 2 + 4;
  const arcLength = Math.PI * radius;

  const hasSegments = Array.isArray(segments) && segments.length > 0;

  // Compute dynamic percentage
  const displayPct = percentage !== undefined
    ? Math.round(percentage)
    : hasSegments && total > 0
      ? Math.round((segments.reduce((acc, s) => acc + (s.value || 0), 0) / total) * 100)
      : 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%'
    }}>
      <div style={{
        position: 'relative',
        width: size,
        height: svgHeight
      }}>
        <svg
          width={size}
          height={svgHeight}
          viewBox={`0 0 ${size} ${svgHeight}`}
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Diagonal subtle hatch pattern inspired by Donezo */}
            <pattern
              id={patternId}
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#CBD5E1" strokeWidth="2.5" />
            </pattern>
          </defs>

          {/* 1. Base Track (Mentah / Unfilled track) */}
          <path
            d={`M ${strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${centerY}`}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {hasSegments ? (
            <>
              {/* Layer 2: Cumulative (Segment 1 + Segment 2) Arc e.g. Mengkal + Matang */}
              {segments.length > 1 && (
                <path
                  d={`M ${strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${centerY}`}
                  fill="none"
                  stroke={segments[1].color || '#22C55E'}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={arcLength}
                  strokeDashoffset={arcLength * (1 - Math.min(1, ((segments[0].value || 0) + (segments[1].value || 0)) / (total || 1)))}
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              )}

              {/* Layer 3: Segment 1 Arc e.g. Matang (Forest Green) */}
              <path
                d={`M ${strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${centerY}`}
                fill="none"
                stroke={segments[0].color || color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={arcLength * (1 - Math.min(1, (segments[0].value || 0) / (total || 1)))}
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </>
          ) : (
            /* Single percentage mode */
            <path
              d={`M ${strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${centerY}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={arcLength * (1 - Math.min(100, Math.max(0, displayPct)) / 100)}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          )}
        </svg>

        {/* Center Percentage Display (Centered inside the hollow dome) */}
        <div style={{
          position: 'absolute',
          top: centerY - radius * 0.58,
          left: 0,
          right: 0,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{
            fontSize: '2.1rem',
            fontWeight: 800,
            color: 'var(--text-main, #0F172A)',
            lineHeight: 1,
            letterSpacing: '-0.035em',
            fontFamily: 'var(--font-heading)'
          }}>
            {displayPct}%
          </span>
          <span style={{
            fontSize: '0.74rem',
            color: 'var(--text-dim, #64748B)',
            fontWeight: 700,
            marginTop: '4px',
            letterSpacing: '-0.01em'
          }}>
            {label}
          </span>
        </div>
      </div>

      {sublabel && (
        <span style={{
          fontSize: '0.73rem',
          color: 'var(--text-dim, #64748B)',
          fontWeight: 600,
          marginTop: '4px',
          textAlign: 'center',
          lineHeight: 1.3
        }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}
