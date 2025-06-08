const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend fonctionne !' });
});

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Créer la table articles (temporaire)
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Base de données initialisée');
  } catch (err) {
    console.error('Erreur DB:', err);
  }
};

initDB();
// Routes pour les articles (temporaire, sans base)
const articles = [
  { id: 1, title: 'Premier article', content: 'Contenu du premier article' },
  { id: 2, title: 'Deuxième article', content: 'Contenu du deuxième article' }
];

app.get('/api/articles', (req, res) => {
  res.json(articles);
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});