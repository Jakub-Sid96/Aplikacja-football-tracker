import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';
import { PremiumButton } from './ui/PremiumButton';

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
    <div className="auth-fullscreen">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo">Football Tracker</h1>
          <p className="auth-subtitle">Obserwacja rozwoju młodych piłkarzy</p>
        </div>

        <h2 className="auth-title">Utwórz konto</h2>

        {error && <div className="auth-error">{error}</div>}

        {/* Krok 1: Wybór roli */}
        <div className="form-group auth-form">
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
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="floating-group">
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder=" "
                autoComplete="name"
                className="floating-input"
              />
              <label htmlFor="reg-name" className="floating-label">Imię i nazwisko</label>
            </div>

            <div className="floating-group">
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder=" "
                autoComplete="email"
                className="floating-input"
              />
              <label htmlFor="reg-email" className="floating-label">Email</label>
            </div>

            <div className="floating-group">
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder=" "
                autoComplete="new-password"
                className="floating-input"
              />
              <label htmlFor="reg-password" className="floating-label">Hasło</label>
            </div>

            <PremiumButton type="submit" variant="blue" size="lg" className="btn-auth-premium pbtn--hover-white">
              Zarejestruj się jako {role === 'parent' ? 'rodzic' : 'trener'}
            </PremiumButton>
          </form>
        )}

        <p className="auth-switch">
          Masz już konto? <Link to="/login">Zaloguj się</Link>
        </p>

        <div className="auth-footer">
          <img src="/football.png" alt="Football Tracker Logo" className="auth-footer-logo" />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
