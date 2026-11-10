import React, { useEffect } from 'react';
import { X, Eye } from '@phosphor-icons/react';

export default function ImageDetailModal({ image, onClose }) {
  if (!image) return null;

  const { src, title, description, badge } = image;

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(27, 42, 34, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          maxWidth: '680px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #DDE5DC',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header Modal */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #DDE5DC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Eye size={18} weight="bold" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1B2A22' }}>
                {title || 'Foto Pemindaian'}
              </h3>
              {description && (
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup foto"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#F6F8F4',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DDE5DC'; e.currentTarget.style.color = '#1B2A22'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F6F8F4'; e.currentTarget.style.color = '#64748B'; }}
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Area Foto Penuh Tanpa Terpotong */}
        <div style={{
          backgroundColor: '#0f172a',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '340px',
          maxHeight: '65vh'
        }}>
          <img
            src={src}
            alt={title || 'Foto Sampel'}
            style={{
              maxWidth: '100%',
              maxHeight: '60vh',
              objectFit: 'contain',
              borderRadius: '0.5rem'
            }}
          />
        </div>

        {/* Footer Keterangan */}
        <div style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: '#F6F8F4',
          borderTop: '1px solid #DDE5DC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            {badge || 'Foto Lapangan'}
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '0.35rem 0.85rem',
              backgroundColor: '#166534',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

