const express   = require('express');
const router    = express.Router();
const { query } = require('../config/db');

let transporter = null;
try {
  const nodemailer = require('nodemailer');
  if (process.env.CONTACT_EMAIL_USER && process.env.CONTACT_EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host:   process.env.CONTACT_EMAIL_HOST || 'smtp.gmail.com',
      port:   Number(process.env.CONTACT_EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.CONTACT_EMAIL_USER,
        pass: process.env.CONTACT_EMAIL_PASS,
      },
    });
    console.log('✅ Email transporter configurado');
  } else {
    console.warn('⚠️  CONTACT_EMAIL_USER/PASS no configurados — los mensajes solo se guardarán en BD');
  }
} catch {
  console.warn('⚠️  nodemailer no instalado — los mensajes solo se guardarán en BD');
}

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, discord, message } = req.body;

    if (!first_name || !last_name || !email || !message) {
      return res.status(400).json({
        error: 'Campos requeridos: first_name, last_name, email, message',
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: 'El mensaje no puede superar 2000 caracteres' });
    }

    const { rows } = await query(
      `INSERT INTO contact_messages (first_name, last_name, email, discord, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
      [
        first_name.trim(),
        last_name.trim(),
        email.trim().toLowerCase(),
        discord?.trim() || null,
        message.trim(),
      ]
    );

    if (transporter && process.env.CONTACT_EMAIL_TO) {
      const mailOptions = {
        from:    `"NextStagePro Contacto" <${process.env.CONTACT_EMAIL_USER}>`,
        to:      process.env.CONTACT_EMAIL_TO,
        subject: `[NSP Contacto] Nuevo mensaje de ${first_name} ${last_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#3B82F6">Nuevo mensaje de contacto</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;color:#666">Nombre:</td>
                  <td style="padding:8px"><strong>${first_name} ${last_name}</strong></td></tr>
              <tr><td style="padding:8px;color:#666">Email:</td>
                  <td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
              ${discord ? `<tr><td style="padding:8px;color:#666">Discord:</td>
                  <td style="padding:8px">${discord}</td></tr>` : ''}
              <tr><td colspan="2" style="padding:8px;color:#666">Mensaje:</td></tr>
              <tr><td colspan="2" style="padding:16px;background:#f5f5f5;border-radius:8px">
                  ${message.replace(/\n/g, '<br>')}</td></tr>
            </table>
            <p style="color:#999;font-size:12px">ID del mensaje: ${rows[0].id} · ${new Date(rows[0].created_at).toLocaleString('es-ES')}</p>
          </div>
        `,
      };
      transporter.sendMail(mailOptions).catch(err =>
        console.error('Error enviando email de contacto:', err)
      );
    }

    res.status(201).json({
      message: 'Mensaje enviado correctamente. Nos pondremos en contacto pronto.',
      id:      rows[0].id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
