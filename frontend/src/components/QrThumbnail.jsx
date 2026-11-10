import React from 'react';
import { createQrSvg } from '../utils/qrCode.js';

export default function QrThumbnail({ text, size = 32 }) {
  if (!text) return null;

  const svgMarkup = createQrSvg(text, {
    size,
    margin: 1,
    color: '#0f172a',
    bgColor: '#ffffff'
  });

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px',
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '4px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        flexShrink: 0
      }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
      title={`QR Code: ${text}`}
    />
  );
}

