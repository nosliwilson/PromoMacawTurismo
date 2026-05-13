import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'participants.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Initialize data files if they don't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

const DEFAULT_CONFIG = {
  app: {
    name: 'BTS World Tour',
    subtitle: 'Promoção Exclusiva - Ganhe seu Desconto',
    footerText: '© 2024 BTS EXCURSÕES',
  },
  theme: {
    primaryColor: '#7B61FF',
    backgroundColor: '#0D0D0D',
    darkBackgroundColor: '#1A1A1A',
    grayColor: '#2D2D2D',
    textColor: '#FFFFFF',
    accentColor: '#FF4D4D',
    bgImageUrl: '',
    bgImageOpacity: 50,
  },
  texts: {
    scratchTitle: 'Hora da Sorte!',
    scratchSubtitle: 'Raspe o card abaixo para ver o seu prêmio!',
    successMessage: 'Apresente seu celular com esta tela para validar seu desconto ou prêmio.',
  },
  social: {
    instagram: '',
    twitter: '',
    website: '',
  },
  prizes: [
    { id: 'p1', label: 'R$ 20 de Desconto', probability: 60 },
    { id: 'p2', label: 'R$ 35 de Desconto', probability: 30 },
    { id: 'p3', label: 'R$ 50 de Desconto', probability: 10 },
  ],
  formFields: [
    { id: 'name', label: 'Nome Completo', type: 'text', placeholder: 'Como no RG', required: true, options: '' },
    { id: 'socialName', label: 'Nome Social (opcional)', type: 'text', placeholder: 'Nome Social', required: false, options: '' },
    { id: 'phone', label: 'WhatsApp', type: 'tel', placeholder: '(00) 00000-0000', required: true, options: '' },
    { id: 'email', label: 'E-mail', type: 'email', placeholder: 'contato@email.com', required: true, options: '' },
    { id: 'hasTicket', label: 'Ingresso?', type: 'select', placeholder: '', required: true, options: 'Sim,Não' }
  ]
};

if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
}

function getParticipants() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function getConfig() {
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_CONFIG;
  }
}

function saveParticipant(participant: any) {
  const participants = getParticipants();
  participants.push(participant);
  fs.writeFileSync(DATA_FILE, JSON.stringify(participants, null, 2));
}

function saveConfig(config: any) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Public Settings
  app.get('/api/settings', (req, res) => {
    // Merge dynamically added root objects with default config if missing
    const config = getConfig();
    res.json({ ...DEFAULT_CONFIG, ...config, theme: { ...DEFAULT_CONFIG.theme, ...config.theme } });
  });

  // API Routes
  app.get('/api/participants/check', (req, res) => {
    const { email, phone } = req.query;
    const participants = getParticipants();
    
    const existing = participants.find((p: any) => {
      if (email && email !== 'undefined' && p.email === email) return true;
      if (phone && phone !== 'undefined' && p.phone === phone) return true;
      return false;
    });
    
    if (existing) {
      return res.json({ 
        participated: true, 
        prize: existing.prize,
        name: existing.name || existing.socialName || 'Participante'
      });
    }
    
    res.json({ participated: false });
  });

  app.post('/api/participants/register', (req, res) => {
    const data = req.body;
    
    const participants = getParticipants();
    const existing = participants.find((p: any) => {
      if (data.email && p.email === data.email) return true;
      if (data.phone && p.phone === data.phone) return true;
      return false;
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Você já participou!' });
    }

    const newParticipant = {
      ...data,
      date: new Date().toISOString()
    };

    saveParticipant(newParticipant);
    res.json({ success: true });
  });

  // Admin Routes
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin';

    if (username === adminUser && password === adminPass) {
      res.json({ success: true, token: 'fake-admin-token-' + Date.now() });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  });

  app.get('/api/admin/data', (req, res) => {
    // Basic protection: check for a token in headers (simulated)
    if (!req.headers.authorization) return res.status(403).json({ error: 'Não autorizado' });
    
    res.json({
      participants: getParticipants(),
      config: getConfig()
    });
  });

  app.post('/api/admin/config', (req, res) => {
    if (!req.headers.authorization) return res.status(403).json({ error: 'Não autorizado' });
    
    saveConfig(req.body);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`STRAY KIDS PROMO Server running on http://localhost:${PORT}`);
  });
}

startServer();
