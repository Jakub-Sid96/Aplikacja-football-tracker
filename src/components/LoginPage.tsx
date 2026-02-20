import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// ============================================================
// LoginPage – prosty formularz logowania.
// Email + hasło, obsługa błędów, przekierowanie po sukcesie.
// ============================================================

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Wypełnij wszystkie pola.');
      return;
    }

    const result = login(email, password);
    if (result.success) {
      // Przekierowanie na podstawie roli – AuthContext ustawia currentUser
      const stored = localStorage.getItem('ft-session');
      if (stored) {
        const user = JSON.parse(stored);
        navigate(user.role === 'trainer' ? '/trainer' : '/parent');
      }
    } else {
      setError(result.error || 'Błąd logowania.');
    }
  };

  return (
    <div className="auth-fullscreen">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo">Football Tracker</h1>
          <p className="auth-subtitle">Obserwacja rozwoju młodych piłkarzy</p>
        </div>

        <h2 className="auth-title">Zaloguj się</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="floating-group">
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder=" "
              autoComplete="email"
              className="floating-input"
            />
            <label htmlFor="login-email" className="floating-label">Email</label>
          </div>

          <div className="floating-group">
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder=" "
              autoComplete="current-password"
              className="floating-input"
            />
            <label htmlFor="login-password" className="floating-label">Hasło</label>
          </div>

          <button type="submit" className="btn-auth">
            <span className="neon-glow-top" />
            Zaloguj się
            <span className="neon-glow-bottom" />
          </button>
        </form>

        <p className="auth-switch">
          Nie masz konta? <Link to="/register">Zarejestruj się</Link>
        </p>

        <div className="auth-footer">
          <img src="/football.png" alt="Football Tracker Logo" className="auth-footer-logo" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
