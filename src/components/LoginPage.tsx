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
    <div className="container">
      <div className="auth-page">
        <div className="auth-logo">Football Tracker</div>
        <p className="auth-subtitle">Obserwacja rozwoju młodych piłkarzy</p>
        <h2 className="auth-title">Zaloguj się</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="twoj@email.pl"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Hasło</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Wpisz hasło"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary">
            Zaloguj się
          </button>
        </form>

        <p className="auth-switch">
          Nie masz konta? <Link to="/register">Zarejestruj się</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
