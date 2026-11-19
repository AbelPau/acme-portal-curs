const path = require('path');
const express = require('express');
const cors = require('cors');
const { requireAuth } = require('./auth');
const {
  getClientsFast,
  invitations,
  delay,
} = require('./db');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'acme-portal' });
  });

  /** Panell admin: lent a propòsit */
  app.get('/api/clients', requireAuth, async (_req, res) => {
    const data = await getClientsFast();
    res.json({ data, meta: { count: data.length, note: 'endpoint lent (lab)' } });
  });

  /** Formulari de contacte. */
  app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Cal name, email i message' });
    }

    return res.status(201).json({
      ok: true,
      ticketId: `T-${Date.now()}`,
      received: { name, email },
    });
  });

  /**
   * Invitacions.
   * La reserva al Map és síncrona, abans de cap await: si no, dues peticions
   * amb el mateix email passen el has() durant el delay i creen dos tokens.
   */
  app.post('/api/invitations', requireAuth, async (req, res) => {
    const email = (req.body && req.body.email) || '';
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Email invàlid' });
    }

    if (invitations.has(email)) {
      return res.status(409).json({ error: 'Ja existeix una invitació per aquest email' });
    }

    const token = `inv_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    invitations.set(email, { token, createdAt: Date.now() });

    // Simula latència de xarxa / BD un cop la plaça ja està ocupada.
    await delay(150);
    await delay(150);

    return res.status(201).json({ email, token });
  });

  app.get('/api/invitations/:email', requireAuth, (req, res) => {
    const row = invitations.get(req.params.email);
    if (!row) return res.status(404).json({ error: 'No trobat' });
    return res.json(row);
  });

  return app;
}

module.exports = { createApp };
