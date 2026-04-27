// src/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
// cloudinary v1 — compatible con multer-storage-cloudinary@4
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Storage para avatares y covers ──────────────────────────
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isAvatar = file.fieldname === 'avatar';
    return {
      folder: `nextstagepro/profiles/${isAvatar ? 'avatars' : 'covers'}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: isAvatar
        ? [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
        : [{ width: 1400, height: 400, crop: 'fill' }],
    };
  },
});

// ── Storage para highlights (fotos y vídeos) ────────────────
const highlightStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: 'nextstagepro/highlights',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov'],
    };
  },
});

// ── Storage para logos de equipos ───────────────────────────
const logoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'nextstagepro/team-logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }],
  },
});

const uploadProfile   = multer({ storage: profileStorage });
const uploadHighlight = multer({ storage: highlightStorage });
const uploadLogo      = multer({ storage: logoStorage });

module.exports = { cloudinary, uploadProfile, uploadHighlight, uploadLogo };
