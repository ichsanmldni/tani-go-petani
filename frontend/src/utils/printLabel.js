import { createQrSvg } from './qrCode.js';

/**
 * Mencetak Label Stiker Fisik Buah (Bukan Screenshot Halaman Web).
 * Didesain khusus untuk printer label thermal / kertas stiker panen (58mm/60mm/80mm).
 */
export function printFruitLabel(fruit) {
  if (!fruit) return;

  const qrText = fruit.qr_code || `QR-FRUIT-${fruit.fruit_id}`;
  const qrSvg = createQrSvg(qrText, { size: 140, margin: 2, color: '#000000', bgColor: '#ffffff' });
  const isMatang = fruit.tingkat_kematangan === 'matang';
  const isMengkal = fruit.tingkat_kematangan === 'mengkal';
  const labelKematangan = isMatang ? 'Matang' : isMengkal ? 'Mengkal' : 'Mentah';
  const kesimpulanMarketplace = isMatang ? 'Siap dijual' : 'Belum siap dijual';
  const scanDate = fruit.scan_date || new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  const printWindow = window.open('', '_blank', 'width=460,height=680');
  if (!printWindow) {
    alert('Popup diblokir peramban. Izinkan popup untuk mencetak label stiker.');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Label Panen - ${fruit.fruit_id}</title>
  <style>
    @page {
      size: 60mm 85mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #ffffff;
      color: #000000;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .sticker {
      width: 100%;
      max-width: 340px;
      border: 2px dashed #000000;
      border-radius: 8px;
      padding: 14px;
      background: #ffffff;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .brand-title {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }
    .brand-subtitle {
      font-size: 9px;
      color: #333333;
      letter-spacing: 0.2px;
      margin-top: 2px;
    }
    .qr-section {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 8px 0;
      padding: 6px;
      background: #ffffff;
    }
    .qr-section svg {
      display: block;
      width: 130px;
      height: 130px;
    }
    .qr-text {
      font-family: "Courier New", Courier, monospace;
      font-size: 10px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 10px;
      word-break: break-all;
    }
    .info-table {
      width: 100%;
      border-top: 1px solid #000000;
      border-bottom: 1px solid #000000;
      padding: 8px 0;
      margin-bottom: 8px;
      font-size: 10px;
      line-height: 1.5;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .label {
      color: #444444;
      font-weight: 600;
    }
    .val {
      font-weight: 800;
      text-align: right;
    }
    .status-badge {
      display: inline-block;
      border: 1.5px solid #000000;
      padding: 2px 6px;
      font-size: 9.5px;
      font-weight: 900;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .footer {
      text-align: center;
      font-size: 8px;
      color: #333333;
      margin-top: 6px;
    }
    .barcode-line {
      height: 14px;
      background: repeating-linear-gradient(
        90deg,
        #000 0,
        #000 2px,
        transparent 2px,
        transparent 4px,
        #000 4px,
        #000 7px,
        transparent 7px,
        transparent 8px
      );
      margin: 6px auto;
      width: 85%;
    }
    .no-print-bar {
      margin-bottom: 15px;
      text-align: center;
    }
    .btn-print {
      background: #166534;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
        justify-content: flex-start;
      }
      .sticker {
        border: 1px solid #000000;
        max-width: 100%;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <button class="btn-print" onclick="window.print()">Cetak Label Stiker</button>
  </div>

  <div class="sticker">
    <div class="header">
      <div class="brand-title">TANIGO</div>
      <div class="brand-subtitle">Pantau kebun, panen tepat waktu.</div>
    </div>

    <div class="qr-section">
      ${qrSvg}
    </div>
    <div class="qr-text">${qrText}</div>

    <div class="info-table">
      <div class="row">
        <span class="label">ID Buah:</span>
        <span class="val">${fruit.fruit_id}</span>
      </div>
      <div class="row">
        <span class="label">ID Pohon:</span>
        <span class="val">${fruit.tree_id || '-'}</span>
      </div>
      <div class="row">
        <span class="label">Lokasi Greenhouse:</span>
        <span class="val">${fruit.greenhouse_name || fruit.greenhouse_id}</span>
      </div>
      <div class="row">
        <span class="label">Jalur & Nomor:</span>
        <span class="val">${fruit.row} (Pohon #${fruit.tree_index})</span>
      </div>
      <div class="row">
        <span class="label">Umur Tanaman:</span>
        <span class="val">${fruit.age_days} Hari</span>
      </div>
      <div class="row">
        <span class="label">Tingkat Kematangan:</span>
        <span class="val"><span class="status-badge">${labelKematangan}</span></span>
      </div>
      <div class="row">
        <span class="label">Status Penjualan:</span>
        <span class="val">${kesimpulanMarketplace}</span>
      </div>
    </div>

    <div class="barcode-line"></div>
    <div class="footer">
      <div>Pindai kode QR untuk verifikasi buah</div>
      <div style="margin-top: 2px; font-size: 7.5px;">Waktu Cek: ${scanDate}</div>
    </div>
  </div>

  <script>
    // Auto-trigger print dialog setelah dokumen siap
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

