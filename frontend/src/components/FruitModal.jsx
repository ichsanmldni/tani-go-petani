import React, { useEffect, useState } from 'react';
import {
  X,
  QrCode,
  Camera,
  Printer,
  Copy,
  Check,
  Plant,
  Storefront,
  Clock,
  Sparkle
} from '@phosphor-icons/react';
import { createQrSvg } from '../utils/qrCode.js';
import { printFruitLabel } from '../utils/printLabel.js';

export default function FruitModal({ fruit, onClose }) {
  if (!fruit) return null;

  const [copied, setCopied] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isMatang = fruit.tingkat_kematangan === 'matang';
  const isMengkal = fruit.tingkat_kematangan === 'mengkal';
  const labelKematangan = isMatang ? 'Matang' : isMengkal ? 'Mengkal' : 'Mentah';

  const qrString = fruit.qr_code || `QR-FRUIT-${fruit.fruit_id}`;
  const qrSvgMarkup = createQrSvg(qrString, { size: 90, margin: 1, color: '#1B2A22', bgColor: '#ffffff' });

  const handleCopyQr = () => {
    navigator.clipboard.writeText(qrString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(27, 42, 34, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          maxWidth: '760px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #DDE5DC',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header Modal Bersih & Elegan */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #DDE5DC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: isMatang ? '#ecfdf5' : isMengkal ? '#fffbeb' : '#F6F8F4',
              color: isMatang ? '#047857' : isMengkal ? '#B45309' : '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${isMatang ? '#a7f3d0' : isMengkal ? '#fde68a' : '#DDE5DC'}`
            }}>
              <Camera size={22} weight="bold" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1B2A22' }}>
                  Detail Kesiapan Buah
                </h3>
                <span className={`badge ${isMatang ? 'badge-success' : isMengkal ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '0.72rem' }}>
                  {labelKematangan}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                Pemeriksaan buah di pohon (hari ke-{fruit.age_days})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup modal"
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
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Isi Modal */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Metadata Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.65rem'
          }}>
            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#F6F8F4', borderRadius: '0.5rem', border: '1px solid #DDE5DC' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>ID Buah</span>
              <strong className="font-mono" style={{ fontSize: '0.82rem', color: '#1B2A22' }}>{fruit.fruit_id}</strong>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#F6F8F4', borderRadius: '0.5rem', border: '1px solid #DDE5DC' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>ID Pohon Induk</span>
              <strong className="font-mono" style={{ fontSize: '0.82rem', color: '#166534' }}>{fruit.tree_id || '-'}</strong>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#F6F8F4', borderRadius: '0.5rem', border: '1px solid #DDE5DC' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Lokasi Greenhouse</span>
              <strong style={{ fontSize: '0.82rem', color: '#1B2A22' }}>{fruit.greenhouse_name}</strong>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#F6F8F4', borderRadius: '0.5rem', border: '1px solid #DDE5DC' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Jalur & Nomor</span>
              <strong style={{ fontSize: '0.82rem', color: '#1B2A22' }}>{fruit.row} (#{fruit.tree_index})</strong>
            </div>
          </div>

          {/* Citra 3 Angle */}
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1B2A22', display: 'block', marginBottom: '0.6rem' }}>
              Foto Buah (3 Bagian):
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{ border: '1px solid #DDE5DC', borderRadius: '0.6rem', overflow: 'hidden', backgroundColor: '#F6F8F4' }}>
                <div style={{ height: '120px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={fruit.angles?.angle1} alt="Pangkal tangkai" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '0.45rem', textAlign: 'center', borderTop: '1px solid #DDE5DC' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1B2A22', display: 'block' }}>Pangkal tangkai</span>
                  <small style={{ fontSize: '0.65rem', color: '#64748B' }}>Tangkai dan cincin absisi</small>
                </div>
              </div>

              <div style={{ border: '1px solid #DDE5DC', borderRadius: '0.6rem', overflow: 'hidden', backgroundColor: '#F6F8F4' }}>
                <div style={{ height: '120px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={fruit.angles?.angle2} alt="Jaring kulit" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '0.45rem', textAlign: 'center', borderTop: '1px solid #DDE5DC' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1B2A22', display: 'block' }}>Jaring kulit</span>
                  <small style={{ fontSize: '0.65rem', color: '#64748B' }}>Kerapatan jaring kulit</small>
                </div>
              </div>

              <div style={{ border: '1px solid #DDE5DC', borderRadius: '0.6rem', overflow: 'hidden', backgroundColor: '#F6F8F4' }}>
                <div style={{ height: '120px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={fruit.angles?.angle3} alt="Ujung buah" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '0.45rem', textAlign: 'center', borderTop: '1px solid #DDE5DC' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1B2A22', display: 'block' }}>Ujung buah</span>
                  <small style={{ fontSize: '0.65rem', color: '#64748B' }}>Dasar ujung buah</small>
                </div>
              </div>
            </div>
          </div>

          {/* Kesimpulan Kelayakan Marketplace & Rekomendasi */}
          <div style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            backgroundColor: isMatang ? '#ecfdf5' : isMengkal ? '#fffbeb' : '#F6F8F4',
            border: `1px solid ${isMatang ? '#a7f3d0' : isMengkal ? '#fde68a' : '#DDE5DC'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 800, color: isMatang ? '#047857' : isMengkal ? '#B45309' : '#1B2A22', fontSize: '0.9rem' }}>
                Status Penjualan: {isMatang ? 'Siap dijual' : 'Belum siap dijual'}
              </div>
              <span className="font-mono" style={{ fontSize: '0.74rem', color: '#64748B' }}>
                Akurasi deteksi: {fruit.confidence}%
              </span>
            </div>
            <div style={{ color: '#1B2A22', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
              <strong>Saran tindakan: </strong> {fruit.action_advice}
            </div>
            <div style={{ color: '#64748B', fontSize: '0.78rem' }}>
              <strong>Estimasi sisa hari panen: </strong> {fruit.sisa_hari || (isMatang ? '0 hari' : isMengkal ? '2–4 hari' : '5–8 hari')}
            </div>
          </div>

          {/* Section Label Stiker QR Code Panen */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            backgroundColor: '#F6F8F4',
            borderRadius: '0.75rem',
            border: '1px solid #DDE5DC',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  padding: '6px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #DDE5DC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                dangerouslySetInnerHTML={{ __html: qrSvgMarkup }}
              />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', fontWeight: 600 }}>
                  Kode QR Buah
                </span>
                <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1B2A22', display: 'block', margin: '2px 0' }}>
                  {qrString}
                </span>
                <button
                  onClick={handleCopyQr}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: copied ? '#047857' : '#166534',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {copied ? <Check size={12} weight="bold" /> : <Copy size={12} />}
                  <span>{copied ? 'Tersalin' : 'Salin kode QR'}</span>
                </button>
              </div>
            </div>

            {/* Tombol Cetak Stiker Khusus */}
            <button
              onClick={() => printFruitLabel(fruit)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1rem',
                backgroundColor: '#166534',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(22, 101, 52, 0.2)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#14532d'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#166534'; }}
            >
              <Printer size={16} weight="bold" /> Cetak label panen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
