import React from 'react';
import { WarningCircle, ArrowsClockwise } from '@phosphor-icons/react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("TaniGo UI Error Caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F6F8F4',
          padding: '2rem',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            maxWidth: '550px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid #DDE5DC',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#B91C1C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <WarningCircle size={28} weight="bold" />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1B2A22', margin: '0 0 0.5rem 0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Halaman Mengalami Kendala
            </h2>

            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              Gagal memuat tampilan. Silakan muat ulang halaman.
            </p>

            <div style={{
              textAlign: 'left',
              backgroundColor: '#F6F8F4',
              border: '1px solid #DDE5DC',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              fontSize: '0.75rem',
              color: '#B91C1C',
              fontFamily: 'monospace',
              maxHeight: '120px',
              overflowY: 'auto',
              marginBottom: '1.5rem'
            }}>
              {this.state.error?.toString() || 'Kendala tidak dikenal'}
            </div>

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.65rem 1.25rem',
                backgroundColor: '#166534',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <ArrowsClockwise size={16} weight="bold" /> Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

