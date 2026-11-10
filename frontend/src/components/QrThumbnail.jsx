import React from 'react';
import { createQrSvg } from '../utils/qrCode.js';

export default function QrThumbnail({ text, size = 32, onClick, style = {}, title }) {
  if (!text) return null;

  const svgMarkup = createQrSvg(text, {
    size,
    margin: 1,
    color: '#0F172A',
    bgColor: '#FFFFFF'
  });

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        ...style
      }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
      title={title || `Kode QR: ${text}`}
    />
  );
}
