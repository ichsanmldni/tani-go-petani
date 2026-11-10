import React, { useEffect, useState } from 'react';
import {
  X,
  QrCode,
  ShieldWarning,
  ShieldCheck,
  Plant,
  Bug,
  FirstAid,
  Copy,
  Check
} from '@phosphor-icons/react';
import { createQrSvg } from '../utils/qrCode.js';

export default function DiseaseModal({ tree, onClose, onViewFruit, onOpenFruit }) {
  if (!tree) return null;

  const [copied, setCopied] = useState(false);
  const handleFruitClick = onViewFruit || onOpenFruit;

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isSick = tree.kondisi === 'Sakit' || tree.kondisi === 'sakit';
  const confidenceVal = tree.confidence || 85;
  const qrString = tree.qr_code || `QR-TREE-${tree.tree_id}`;
  const qrSvgMarkup = createQrSvg(qrString, { size: 90, margin: 1, color: '#1B2A22', bgColor: '#ffffff' });

  const handleCopyQr = () => {
    navigator.clipboard.writeText(qrString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="modal-sheet-container"
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
        className="modal-sheet-box"
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
              backgroundColor: isSick ? '#fef2f2' : '#ecfdf5',
              color: isSick ? '#B91C1C' : '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${isSick ? '#fca5a5' : '#a7f3d0'}`
            }}>
              {isSick ? <ShieldWarning size={22} weight="bold" /> : <ShieldCheck size={22} weight="bold" />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1B2A22' }}>
                  Detail Pemeriksaan Daun
                </h3>
                <span className={`badge ${isSick ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.72rem' }}>
                  {isSick ? 'Perlu dicek' : 'Sehat'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                Pemeriksaan daun per pohon
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
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>ID Pohon</span>
              <strong className="font-mono" style={{ fontSize: '0.82rem', color: '#1B2A22' }}>{tree.tree_id}</strong>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#F6F8F4', borderRadius: '0.5rem', border: '1px solid #DDE5DC' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Lokasi Greenhouse</span>
              <strong style={{ fontSize: '0.82rem', color: '#1B2A22' }}>{tree.greenhouse_name}</strong>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#F6F8F4', borderRadius: '0.5rem', border: '1px solid #DDE5DC' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Jalur & Nomor</span>
              <strong style={{ fontSize: '0.82rem', color: '#1B2A22' }}>{tree.row} (#{tree.tree_index})</strong>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#F6F8F4', borderRadius: '0.5rem', border: '1px solid #DDE5DC' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Waktu Cek</span>
              <strong style={{ fontSize: '0.78rem', color: '#1B2A22' }}>{tree.last_scan_time || 'Hari ini'}</strong>
            </div>
          </div>

          {/* Citra Daun 3 Angle */}
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1B2A22', display: 'block', marginBottom: '0.6rem' }}>
              Foto Daun (3 Bagian):
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{ border: '1px solid #DDE5DC', borderRadius: '0.6rem', overflow: 'hidden', backgroundColor: '#F6F8F4' }}>
                <div style={{ height: '120px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={tree.angles?.angle1} alt="Permukaan atas daun" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '0.45rem', textAlign: 'center', borderTop: '1px solid #DDE5DC' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1B2A22', display: 'block' }}>Permukaan atas daun</span>
                  <small style={{ fontSize: '0.65rem', color: '#64748B' }}>Helai atas daun</small>
                </div>
              </div>

              <div style={{ border: '1px solid #DDE5DC', borderRadius: '0.6rem', overflow: 'hidden', backgroundColor: '#F6F8F4' }}>
                <div style={{ height: '120px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={tree.angles?.angle2} alt="Permukaan bawah daun" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '0.45rem', textAlign: 'center', borderTop: '1px solid #DDE5DC' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1B2A22', display: 'block' }}>Permukaan bawah daun</span>
                  <small style={{ fontSize: '0.65rem', color: '#64748B' }}>Helai bawah daun</small>
                </div>
              </div>

              <div style={{ border: '1px solid #DDE5DC', borderRadius: '0.6rem', overflow: 'hidden', backgroundColor: '#F6F8F4' }}>
                <div style={{ height: '120px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={tree.angles?.angle3} alt="Tajuk pohon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '0.45rem', textAlign: 'center', borderTop: '1px solid #DDE5DC' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1B2A22', display: 'block' }}>Tajuk pohon</span>
                  <small style={{ fontSize: '0.65rem', color: '#64748B' }}>Kanopi tanaman</small>
                </div>
              </div>
            </div>
          </div>

          {/* Nama Penyakit & Tindakan */}
          <div style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            backgroundColor: isSick ? '#fef2f2' : '#ecfdf5',
            border: `1px solid ${isSick ? '#fca5a5' : '#a7f3d0'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 800, color: isSick ? '#B91C1C' : '#047857', fontSize: '0.9rem' }}>
                Kondisi: {tree.nama_penyakit || (isSick ? 'Perlu dicek' : 'Sehat')}
              </div>
              <span className="font-mono" style={{ fontSize: '0.74rem', color: '#64748B' }}>
                Akurasi deteksi: {confidenceVal}%
              </span>
            </div>
            <div style={{ color: '#1B2A22', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
              <strong>Gejala: </strong> {tree.gejala}
            </div>
            <div style={{ color: '#64748B', fontSize: '0.78rem' }}>
              <strong>Saran tindakan: </strong> {tree.rekomendasi_penanganan}
            </div>
          </div>

          {/* Section QR Code Tiang Pohon & Buah Pendamping */}
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
                  Kode QR Pohon
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

            {tree.companion_fruit_id && handleFruitClick && (
              <button
                onClick={() => { onClose(); handleFruitClick(tree.companion_fruit_id); }}
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
              >
                <Plant size={16} weight="bold" /> Lihat buah di pohon ini
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
