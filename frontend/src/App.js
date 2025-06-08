import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchTerm, setSearchTerm] = useState('');

  // Récupérer les données au chargement
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [articlesRes, categoriesRes, statsRes] = await Promise.all([
          axios.get('http://localhost:3001/api/articles'),
          axios.get('http://localhost:3001/api/categories'),
          axios.get('http://localhost:3001/api/stats')
        ]);

        setArticles(articlesRes.data);
        setCategories(categoriesRes.data);
        setStats(statsRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur:', error);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Filtrer les articles quand la catégorie ou recherche change
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const params = {};
        if (selectedCategory !== 'Tous') params.category = selectedCategory;
        if (searchTerm) params.search = searchTerm;

        const response = await axios.get('http://localhost:3001/api/articles', { params });
        setArticles(response.data);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };
    fetchArticles();
  }, [selectedCategory, searchTerm]);


  const handleLike = async (articleId) => {
    try {
      const response = await axios.post(`http://localhost:3001/api/articles/${articleId}/like`);

      // Mettre à jour l'article localement
      setArticles(prevArticles =>
        prevArticles.map(article =>
          article.id === articleId
            ? { ...article, likes: response.data.likes }
            : article
        )
      );
    } catch (error) {
      console.error('Erreur like:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement du blog...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Header avec stats */}
      <header className="header">
        <h1>🚀 Blog DevSecOps</h1>
        <p>Apprenez les meilleures pratiques de sécurité dans le DevOps</p>

        <div className="stats">
          <div className="stat-item">
            <strong>{stats.totalArticles}</strong>
            <span>Articles</span>
          </div>
          <div className="stat-item">
            <strong>{stats.totalLikes}</strong>
            <span>Likes</span>
          </div>
          <div className="stat-item">
            <strong>{stats.averageReadTime} min</strong>
            <span>Lecture moy.</span>
          </div>
        </div>
      </header>

      {/* Filtres */}
      <div className="filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="🔍 Rechercher un article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="categories">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="articles-container">
        {articles.length === 0 ? (
          <div className="no-articles">
            <p>😔 Aucun article trouvé pour votre recherche</p>
          </div>
        ) : (
          <div className="articles">
            {articles.map(article => (
              <article key={article.id} className="article-card">
                <div className="article-header">
                  <span className="category-tag">{article.category}</span>
                  <span className="read-time">⏱️ {article.readTime} min</span>
                </div>

                <h2 className="article-title">{article.title}</h2>

                <p className="article-content">{article.content}</p>

                <div className="article-tags">
                  {article.tags.map(tag => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>

                <div className="article-footer">
                  <div className="article-meta">
                    <span className="author">👤 {article.author}</span>
                    <span className="date">📅 {formatDate(article.createdAt)}</span>
                  </div>

                  <button
                    className="like-btn"
                    onClick={() => handleLike(article.id)}
                    title="J'aime cet article"
                  >
                    ❤️ {article.likes}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;