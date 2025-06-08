import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Récupérer les articles au chargement
  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/articles');
      setArticles(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="App">
      <h1>Mon Blog DevSecOps</h1>
      <div className="articles">
        {articles.map(article => (
          <div key={article.id} className="article">
            <h2>{article.title}</h2>
            <p>{article.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;