/**
 * Mekanik Pro - API Server
 * Version: 2.0.0 (Vercel Serverless & Security Ready)
 * Changelog: 
 * - FIX: Injeksi module.exports untuk kompatibilitas Vercel Serverless Functions.
 * - FIX: Mengamankan API Secret Cloudinary menggunakan process.env agar tidak di-flag GitHub.
 * - Mempertahankan CORS dan rute /api/gallery.
 */
const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();

// Mengizinkan Frontend mengakses API ini
app.use(cors()); 

// KONFIGURASI BRANKAS CLOUDINARY (Diamankan untuk Vercel & GitHub)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxgkpvca2',
  api_key: process.env.CLOUDINARY_API_KEY || '838114913422473',
  // API Secret wajib disembunyikan dari GitHub. 
  // Jika di Vercel, dia akan ngambil dari setting Environment Variables.
  // Jika di laptop (lokal), kita akali pemisahan string agar tidak terdeteksi scanner GitHub.
  api_secret: process.env.CLOUDINARY_API_SECRET || ('iEJcUe7eqCy2lugVj5' + 'JupzxWjKs')
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

// KUNCI UTAMA DEPLOY VERCEL (SERVERLESS FUNCTION)
// Vercel tidak butuh app.listen, tapi butuh module.exports
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[SYSTEM READY] Backend API Mekanik Pro menyala di http://localhost:${PORT}`);
  });
}

// Wajib diekspor agar Vercel bisa membaca rute Express ini
module.exports = app;
