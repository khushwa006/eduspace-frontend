import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScanSuccess, onCancel }) {
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    // Configure the scanner UI overlay box
    const scanner = new Html5QrcodeScanner('qr-reader-target', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    });

    scanner.render(
      (decodedText) => {
        // Clear scanner interface once a match is registered
        scanner.clear();
        onScanSuccess(decodedText);
      },
      (error) => {
        // Continuous passive scanning errors can be ignored safely, 
        // but we flag fatal configuration drops.
        if (typeof error === 'string' && error.includes('Permission')) {
          setScanError('Camera permission denied. Please grant access.');
        }
      }
    );

    // Cleanup scanning tracks on unmount
    return () => {
      scanner.clear().catch(err => console.error("Failed to clear scanner tracks", err));
    };
  }, [onScanSuccess]);

  return (
    <div style={scannerModalStyles.overlay}>
      <div style={scannerModalStyles.card}>
        <h3 style={scannerModalStyles.title}>Scan Classroom QR Code</h3>
        <p style={scannerModalStyles.subtitle}>Align the code printed on the classroom desk/wall inside the frame.</p>
        
        {scanError && <div style={scannerModalStyles.errorBanner}>{scanError}</div>}
        
        <div id="qr-reader-target" style={{ width: '100%', overflow: 'hidden', borderRadius: '12px' }}></div>
        
        <button onClick={onCancel} style={scannerModalStyles.cancelButton}>
          Cancel Scanner
        </button>
      </div>
    </div>
  );
}

const scannerModalStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(6px)'
  },
  card: {
    backgroundColor: '#0a0e14',
    border: '1px solid rgba(79, 195, 247, 0.2)',
    borderRadius: '20px',
    padding: '24px',
    width: '90%',
    maxWidth: '400px',
    textAlign: 'center',
    color: '#e8f4fd'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'rgba(232, 244, 253, 0.5)',
    marginBottom: '20px',
    lineHeight: '1.4'
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginBottom: '12px'
  },
  cancelButton: {
    marginTop: '20px',
    width: '100%',
    padding: '12px',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: 'rgba(232, 244, 253, 0.6)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  }
};