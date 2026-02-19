import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';

// ============================================================
// RegisterPage – rejestracja z wyborem roli.
//
// Decyzja UX: rola wybierana jako pierwszy krok (dwa duże przyciski),
// żeby użytkownik od razu wiedział, co go czeka po rejestracji.
// Po wyborze roli – formularz z danymi.
// Po rejestracji – automatyczne logowanie i przekierowanie.
// ============================================================

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!role) {
      setError('Wybierz typ konta.');
      return;
    }
    if (!name.trim()) {
      setError('Podaj imię i nazwisko.');
      return;
    }
    if (!email.trim()) {
      setError('Podaj adres email.');
      return;
    }
    if (!password) {
      setError('Podaj hasło.');
      return;
    }

    const result = register(name, email, password, role);
    if (result.success) {
      navigate(role === 'trainer' ? '/trainer' : '/parent');
    } else {
      setError(result.error || 'Błąd rejestracji.');
    }
  };

  return (
    <div className="container">
      <div className="auth-page">
        <div className="auth-logo">Football Tracker</div>
        <p className="auth-subtitle">Obserwacja rozwoju młodych piłkarzy</p>
        <h2 className="auth-title">Utwórz konto</h2>

        {error && <div className="auth-error">{error}</div>}

        {/* Krok 1: Wybór roli */}
        <div className="form-group">
          <label>Kim jesteś?</label>
          <div className="role-selector">
            <button
              type="button"
              className={`role-option ${role === 'parent' ? 'selected' : ''}`}
              onClick={() => setRole('parent')}
            >
              <span className="role-option-icon">👨‍👩‍👦</span>
              <span className="role-option-label">Rodzic</span>
              <span className="role-option-desc">Dodajesz dzieci i wypełniasz raporty</span>
            </button>
            <button
              type="button"
              className={`role-option ${role === 'trainer' ? 'selected' : ''}`}
              onClick={() => setRole('trainer')}
            >
              <span className="role-option-icon">⚽</span>
              <span className="role-option-label">Trener</span>
              <span className="role-option-desc">Tworzysz grupy i raporty meczowe/treningowe</span>
            </button>
          </div>
        </div>

        {/* Krok 2: Dane (widoczne po wyborze roli) */}
        {role && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reg-name">Imię i nazwisko</label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jan Kowalski"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jan@email.pl"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Hasło</label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 4 znaki"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn-primary">
              Zarejestruj się jako {role === 'parent' ? 'rodzic' : 'trener'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Masz już konto? <Link to="/login">Zaloguj się</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
