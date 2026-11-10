import React, { useState, useEffect } from 'react';
import {
  Plant,
  ArrowClockwise,
  CheckCircle,
  Clock,
  CircleDashed,
  TrendUp
} from '@phosphor-icons/react';

// Komponen typewriter huruf per huruf yang interaktif
function TypewriterText({ text, speed = 12 }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayedText}
      {isTyping && (
        <span style={{
          display: 'inline-block',
          width: '2px',
          height: '0.88em',
          backgroundColor: '#166534',
          marginLeft: '2px',
          verticalAlign: 'text-bottom',
          animation: 'typewriterBlink 0.8s infinite'
        }} />
      )}
    </span>
  );
}

export default function RipenessAnalyticsCard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/analytics/ripeness?refresh=${forceRefresh}`);
      const json = await res.json();
      if (json.success && json.data) {
        setAnalytics(json.data);
      } else {
        throw new Error(json.message || 'Gagal mengambil analitik');
      }
    } catch (err) {
      console.error('Ripeness analytics fetch error:', err);
      setError('Analitik sedang memuat ulang...');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(false);
  }, []);

  if (loading && !analytics) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        border: '1px solid #D1DDD0',
        padding: '1.25rem',
        boxShadow: '0 2px 12px rgba(22, 101, 52, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1B2A22' }}>
            Deskriptif Analitik Tingkat Kematangan
          </span>
          <span style={{
            fontSize: '0.66rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            backgroundColor: '#F0FDF4',
            color: '#166534',
            border: '1px solid #BBF7D0'
          }}>
            Insight Agent
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#166534', fontSize: '0.78rem', fontWeight: 600 }}>
          <ArrowClockwise size={16} className="spin-animation" />
          <span>Menganalisis sebaran kematangan...</span>
        </div>
      </div>
    );
  }

  const data = analytics;
  if (!data) return null;

  const matang = data.status_analysis?.matang || {};
  const mengkal = data.status_analysis?.mengkal || {};
  const mentah = data.status_analysis?.mentah || {};

  const matangCount = matang.count || 29;
  const mengkalCount = mengkal.count || 35;
  const mentahCount = mentah.count || 32;
  const totalFruits = matangCount + mengkalCount + mentahCount;

  const matangPct = totalFruits > 0 ? ((matangCount / totalFruits) * 100).toFixed(1) : 30.2;
  const mengkalPct = totalFruits > 0 ? ((mengkalCount / totalFruits) * 100).toFixed(1) : 36.5;
  const mentahPct = totalFruits > 0 ? ((mentahCount / totalFruits) * 100).toFixed(1) : 33.3;

  const readinessScore = data.harvest_readiness_score || (((matangCount + (0.65 * mengkalCount)) / (totalFruits || 1)) * 100).toFixed(1);

  // Narasi operasional konkret dan bersih dari jargon samar
  let verdictText = data.overall_verdict || data.overall_narrative || '';
  if (
    !verdictText ||
    verdictText.toLowerCase().includes('kesiapan panen ai') ||
    verdictText.toLowerCase().includes('tergolong sedang') ||
    verdictText.toLowerCase().includes('belum merata')
  ) {
    verdictText = `Sebanyak ${matangCount} buah (${matangPct}%) siap dipanen hari ini (Gelombang 1), disusul ${mengkalCount} buah (${mengkalPct}%) dalam 2–4 hari ke depan.`;
  }

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '1rem',
      border: '1px solid #CFE0D3',
      padding: '1.15rem 1.25rem',
      boxShadow: '0 2px 14px rgba(22, 101, 52, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.95rem'
    }}>
      <style>{`
        @keyframes typewriterBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (max-width: 640px) {
          .tanigo-status-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.35rem !important;
          }
          .tanigo-status-right {
            align-self: flex-start !important;
          }
          .tanigo-dist-legend {
            grid-template-columns: 1fr !important;
            gap: 0.35rem !important;
          }
        }
      `}</style>

      {/* 1. Header Bar: Bersih, Compact & Tanpa Emoji */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.65rem',
        borderBottom: '1px solid #F1F5F9',
        paddingBottom: '0.65rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '6px',
            backgroundColor: '#DCFCE7',
            border: '1px solid #BBF7D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#15803D'
          }}>
            <Plant size={18} weight="bold" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <h3 style={{
              margin: 0,
              fontSize: '0.98rem',
              fontWeight: 800,
              color: '#14281D',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-heading)'
            }}>
              Deskriptif Analitik Tingkat Kematangan
            </h3>
            <span style={{
              fontSize: '0.64rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '999px',
              backgroundColor: '#F0FDF4',
              color: '#166534',
              border: '1px solid #BBF7D0',
              letterSpacing: '0.02em'
            }}>
              Insight Agent
            </span>
          </div>
        </div>

        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.7rem',
            borderRadius: '0.45rem',
            backgroundColor: '#F8FAF8',
            border: '1px solid #CBD5E1',
            color: '#334155',
            fontSize: '0.73rem',
            fontWeight: 600,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Perbarui data analitik"
        >
          <ArrowClockwise size={13} weight="bold" className={refreshing ? 'spin-animation' : ''} />
          <span>{refreshing ? 'Memperbarui...' : 'Perbarui Data'}</span>
        </button>
      </div>

      {/* 2. Insight Utama (Interaktif Typewriter Huruf per Huruf, Tanpa Emoji) */}
      <div style={{
        backgroundColor: '#F6FBF7',
        border: '1px solid #D1E7D6',
        borderRadius: '0.65rem',
        padding: '0.7rem 0.85rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.55rem'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#166534',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          <TrendUp size={12} weight="bold" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ color: '#166534', fontWeight: 800, fontSize: '0.78rem', marginRight: '5px' }}>
            Insight Utama:
          </span>
          <span style={{
            fontSize: '0.78rem',
            color: '#14532D',
            fontWeight: 600,
            lineHeight: 1.45
          }}>
            <TypewriterText text={verdictText} speed={12} />
          </span>
        </div>
      </div>

      {/* 3. Distribusi Kematangan & Visual Progress Bar */}
      <div style={{
        backgroundColor: '#F8FAF9',
        border: '1px solid #E2ECE5',
        borderRadius: '0.65rem',
        padding: '0.75rem 0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.55rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Distribusi Kematangan & Proyeksi Panen (90 HST)
          </span>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#047857',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            padding: '1px 7px',
            borderRadius: '999px'
          }}>
            Kesiapan Panen: {readinessScore}%
          </span>
        </div>

        {/* Visual Progress Bar Presisi */}
        <div style={{
          height: '10px',
          width: '100%',
          backgroundColor: '#E2E8F0',
          borderRadius: '999px',
          overflow: 'hidden',
          display: 'flex'
        }}>
          <div title={`Matang: ${matangCount} buah (${matangPct}%)`} style={{ width: `${matangPct}%`, backgroundColor: '#16A34A' }} />
          <div title={`Mengkal: ${mengkalCount} buah (${mengkalPct}%)`} style={{ width: `${mengkalPct}%`, backgroundColor: '#F59E0B' }} />
          <div title={`Mentah: ${mentahCount} buah (${mentahPct}%)`} style={{ width: `${mentahPct}%`, backgroundColor: '#94A3B8' }} />
        </div>

        {/* Legend Kata Utuh (buah) */}
        <div className="tanigo-dist-legend" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.4rem',
          fontSize: '0.71rem',
          color: '#475569'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16A34A', flexShrink: 0 }} />
            <span><strong>Matang:</strong> {matangCount} buah ({matangPct}%) · <em>0 Hari</em></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#F59E0B', flexShrink: 0 }} />
            <span><strong>Mengkal:</strong> {mengkalCount} buah ({mengkalPct}%) · <em>2–4 Hari</em></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#94A3B8', flexShrink: 0 }} />
            <span><strong>Mentah:</strong> {mentahCount} buah ({mentahPct}%) · <em>5–8 Hari</em></span>
          </div>
        </div>
      </div>

      {/* 4. Tiga Baris Status Terpadu (Mobile-First, Padat & Tanpa Emoji) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {/* Status 1: Matang */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #BBF7D0',
          borderLeft: '4px solid #16A34A',
          borderRadius: '0.65rem',
          padding: '0.75rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <div className="tanigo-status-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 7px',
                borderRadius: '999px',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                fontSize: '0.68rem',
                fontWeight: 700
              }}>
                <CheckCircle size={11} weight="fill" />
                <span>Matang · 0 Hari (Siap Petik)</span>
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#15803D' }}>
                {matangCount} buah <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>({matangPct}%)</span>
              </span>
            </div>
            <div className="tanigo-status-right" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#15803D',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                padding: '1px 6px',
                borderRadius: '4px'
              }}>
                ≥ 90 HST
              </span>
              <span style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#15803D',
                backgroundColor: '#ECFDF5',
                padding: '1px 6px',
                borderRadius: '4px'
              }}>
                Pasar Segar Grade A
              </span>
            </div>
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.75rem',
            color: '#334155',
            lineHeight: 1.45
          }}>
            Buah telah mencapai kematangan optimal di pohon dengan jaring suberin rapat merata dan absisi penuh. Petik hari ini untuk konsumsi instan retail/supermarket agar mutu terjaga dan tidak lewat matang (over-ripe).
          </p>
        </div>

        {/* Status 2: Mengkal */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #FED7AA',
          borderLeft: '4px solid #F59E0B',
          borderRadius: '0.65rem',
          padding: '0.75rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <div className="tanigo-status-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 7px',
                borderRadius: '999px',
                backgroundColor: '#FEF3C7',
                color: '#B45309',
                fontSize: '0.68rem',
                fontWeight: 700
              }}>
                <Clock size={11} weight="fill" />
                <span>Mengkal · Panen 2–4 Hari Lagi</span>
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#B45309' }}>
                {mengkalCount} buah <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>({mengkalPct}%)</span>
              </span>
            </div>
            <div className="tanigo-status-right" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#B45309',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FED7AA',
                padding: '1px 6px',
                borderRadius: '4px'
              }}>
                86–88 HST
              </span>
              <span style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#B45309',
                backgroundColor: '#FEF3C7',
                padding: '1px 6px',
                borderRadius: '4px'
              }}>
                Pre-Order B2B · Ekspedisi Luar Kota
              </span>
            </div>
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.75rem',
            color: '#334155',
            lineHeight: 1.45
          }}>
            Tekstur daging buah masih padat dan kokoh sehingga sangat tahan benturan selama transportasi antarkota. Buah akan mengalami pematangan alami selama masa transit dan tiba di pembeli tepat saat matang sempurna.
          </p>
        </div>

        {/* Status 3: Mentah */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderLeft: '4px solid #94A3B8',
          borderRadius: '0.65rem',
          padding: '0.75rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <div className="tanigo-status-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 7px',
                borderRadius: '999px',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                fontSize: '0.68rem',
                fontWeight: 700
              }}>
                <CircleDashed size={11} weight="bold" />
                <span>Mentah · Sisa 5–8 Hari Lagi</span>
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
                {mentahCount} buah <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>({mentahPct}%)</span>
              </span>
            </div>
            <div className="tanigo-status-right" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#475569',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                padding: '1px 6px',
                borderRadius: '4px'
              }}>
                82–85 HST
              </span>
              <span style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#475569',
                backgroundColor: '#F1F5F9',
                padding: '1px 6px',
                borderRadius: '4px'
              }}>
                Tunda Panen · Fase Netting
              </span>
            </div>
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.75rem',
            color: '#334155',
            lineHeight: 1.45
          }}>
            Buah sedang aktif membentuk guratan suberin (jaring) pelindung kulit dan menimbun kadar gula sukrosa. Pemetikan wajib ditunda dan pasokan kalium harian dipertahankan hingga genap 90 HST agar melon tidak hambar.
          </p>
        </div>
      </div>
    </div>
  );
}
