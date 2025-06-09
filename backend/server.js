const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
// Données enrichies (temporaire, avant la vraie base)
const articles = [
  {
    id: 1,
    title: 'Introduction au DevSecOps',
    content: 'Le DevSecOps intègre la sécurité dès le début du cycle de développement. Cette approche révolutionne la façon dont nous construisons et déployons les applications.',
    author: 'Alice Martin',
    category: 'DevSecOps',
    readTime: 5,
    likes: 12,
    createdAt: '2024-01-15',
    tags: ['DevSecOps', 'Sécurité', 'DevOps']
  },
  {
    id: 2,
    title: 'Docker : Les bonnes pratiques de sécurité',
    content: 'Sécuriser ses conteneurs Docker est essentiel. Voici les principales pratiques : utiliser des images minimales, scanner les vulnérabilités, éviter les privilèges root...',
    author: 'Bob Dupont',
    category: 'Conteneurs',
    readTime: 8,
    likes: 24,
    createdAt: '2024-01-10',
    tags: ['Docker', 'Sécurité', 'Conteneurs']
  },
  {
    id: 3,
    title: 'Infrastructure as Code avec Terraform',
    content: 'Terraform permet de gérer son infrastructure comme du code. Versioning, reproductibilité, collaboration... découvrez pourquoi c\'est indispensable.',
    author: 'Charlie Brown',
    category: 'Infrastructure',
    readTime: 12,
    likes: 18,
    createdAt: '2024-01-05',
    tags: ['Terraform', 'IaC', 'Cloud']
  },
  {
    id: 4,
    title: 'CI/CD Pipeline sécurisée',
    content: 'Construire un pipeline CI/CD qui intègre les contrôles de sécurité à chaque étape. Tests de sécurité automatisés, analyse de code, scan de dépendances.',
    author: 'Diana Prince',
    category: 'CI/CD',
    readTime: 10,
    likes: 31,
    createdAt: '2024-01-01',
    tags: ['CI/CD', 'Pipeline', 'Automatisation']
  }
];
// Middlewares
app.use(cors());
app.use(express.json());

// Configuration de la base de données PostgreSQL
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Vérifier la connexion à la base de données
pool.connect()
  .then(() => console.log('✅ Connecté à PostgreSQL'))
  .catch(err => console.error('❌ Erreur de connexion PostgreSQL:', err));

async function initDatabase() {
  try {
    // Ensuite, créer la table avec la structure correcte
    await pool.query(`
      CREATE TABLE articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        read_time INTEGER NOT NULL,
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tags TEXT[]
      )
    `);

    // Insérer les données
    for (const article of articles) {
      await pool.query(`
        INSERT INTO articles (id, title, content, author, category, read_time, likes, created_at, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [article.id, article.title, article.content, article.author,
      article.category, article.readTime, article.likes, article.createdAt, article.tags]);
    }
    console.log('📝 Données initiales insérées dans PostgreSQL');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
}

async function initDatabase() {
  try {
    // Vérifier si la table existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'articles'
      )
    `);

    if (!tableExists.rows[0].exists) {
      // Créer la table si elle n'existe pas
      await pool.query(`
        CREATE TABLE articles (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          author VARCHAR(100) NOT NULL,
          category VARCHAR(50) NOT NULL,
          read_time INTEGER NOT NULL,
          likes INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          tags TEXT[]
        )
      `);
      console.log('✅ Table articles créée');
    } else {
      console.log('✅ Table articles existe déjà');
    }

    // Vérifier si des données existent déjà
    const { rows } = await pool.query('SELECT COUNT(*) FROM articles');

    // Si aucune donnée, insérer les données de test
    if (parseInt(rows[0].count) === 0) {
      for (const article of articles) {
        await pool.query(`
          INSERT INTO articles (id, title, content, author, category, read_time, likes, created_at, tags)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [article.id, article.title, article.content, article.author,
        article.category, article.readTime, article.likes, article.createdAt, article.tags]);
      }
      console.log('📝 Données initiales insérées dans PostgreSQL');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
}

// Appeler la fonction d'initialisation
initDatabase();


// Route pour obtenir tous les articles
app.get('/api/articles', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM articles';
    const params = [];

    // Construire la requête avec filtres
    if (category && category !== 'Tous') {
      query += ' WHERE category = $1';
      params.push(category);
    }

    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      if (params.length === 0) {
        query += ' WHERE';
      } else {
        query += ' AND';
      }
      query += ` (LOWER(title) LIKE $${params.length + 1} OR LOWER(content) LIKE $${params.length + 1}`;
      query += ` OR EXISTS (SELECT 1 FROM unnest(tags) tag WHERE LOWER(tag) LIKE $${params.length + 1}))`;
      params.push(searchPattern);
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour obtenir un article par ID
app.get('/api/articles/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rows } = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour "liker" un article
app.post('/api/articles/:id/like', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rows } = await pool.query(
      'UPDATE articles SET likes = likes + 1 WHERE id = $1 RETURNING likes',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }

    res.json({ likes: rows[0].likes });
  } catch (error) {
    console.error('Erreur lors du like:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour obtenir les catégories
app.get('/api/categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT DISTINCT category FROM articles');
    const categories = ['Tous', ...rows.map(row => row.category)];
    res.json(categories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour les statistiques
app.get('/api/stats', async (req, res) => {
  try {
    const totalArticles = await pool.query('SELECT COUNT(*) FROM articles');
    const totalLikes = await pool.query('SELECT SUM(likes) FROM articles');
    const categories = await pool.query('SELECT COUNT(DISTINCT category) FROM articles');
    const avgReadTime = await pool.query('SELECT AVG(read_time) FROM articles');

    const stats = {
      totalArticles: parseInt(totalArticles.rows[0].count),
      totalLikes: parseInt(totalLikes.rows[0].sum) || 0,
      categories: parseInt(categories.rows[0].count),
      averageReadTime: Math.round(parseFloat(avgReadTime.rows[0].avg) || 0)
    };

    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// Dans ton server.js (à ajouter avec tes autres routes)

// Endpoint de santé simple
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'blog-backend'
  });
});

// Endpoint de santé avancé (avec vérification DB)
app.get('/health/detailed', async (req, res) => {
  try {
    // Vérifier la connexion à la base de données
    // Remplace cette partie par ta méthode de connexion DB
    // Exemple avec PostgreSQL :
    // await pool.query('SELECT 1');

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'blog-backend',
      database: 'connected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'blog-backend',
      database: 'disconnected',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📝 ${articles.length} articles disponibles`);
  console.log(`🌐 http://localhost:${PORT}/api/articles`);
});