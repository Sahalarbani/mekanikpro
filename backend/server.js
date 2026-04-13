/**
 * Mekanik Pro - API Server
 * Version: 1.0.1
 * Changelog: 
 * - Injeksi API Key dan API Secret produksi untuk autentikasi Signed Upload.
 * - Resolusi error 401 Unauthorized.
 */
const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();
app.use(cors()); // Mengizinkan React (port 5173) mengakses API ini (port 3000)

// KONFIGURASI BRANKAS CLOUDINARY
cloudinary.config({
  cloud_name: 'dxgkpvca2',
  api_key: '838114913422473', 
  api_secret: 'iEJcUe7eqCy2lugVj5JupzxWjKs'
});

// Endpoint untuk mengambil galeri
app.get('/api/gallery', async (req, res) => {
  try {
    // Meminta 50 gambar terbaru dari server Cloudinary
    const result = await cloudinary.search
      .expression('resource_type:image')
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();

    // Kirim URL gambar ke frontend
    res.json(result.resources);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ error: 'Gagal mengambil data dari Cloudinary. Cek kredensial Anda.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`[SYSTEM READY] Backend API Mekanik Pro menyala di http://localhost:${PORT}`);
});
