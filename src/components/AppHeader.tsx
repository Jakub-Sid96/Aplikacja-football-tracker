import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useApp } from '../AppContext';

// ============================================================
// AppHeader – nagłówek aplikacji po zalogowaniu.
//
// Zastępuje RoleSwitcher – zamiast ręcznego przełączania ról
// wyświetla nazwę użytkownika, jego rolę i przycisk wylogowania.
// Dla trenera: badge z liczbą oczekujących próśb.
// ============================================================

const AppHeader: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { getPendingRequestsCount } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const pendingCount = currentUser.role === 'trainer'
    ? getPendingRequestsCount(currentUser.id)
    : 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogoClick = () => {
    navigate(currentUser.role === 'trainer' ? '/trainer' : '/parent');
  };

  return (
    <header className="app-header">
      <div className="header-row">
        <div className="header-left" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <img src="/football.png" alt="" className="header-logo" />
          <h1 className="app-title">Football Tracker</h1>
        </div>
        <div className="header-right">
          {pendingCount > 0 && (
            <span className="header-notif-badge" title="Oczekujące prośby">
              {pendingCount}
            </span>
          )}
          <div className="header-user">
            <span className="header-user-name">{currentUser.name}</span>
            <span className="header-user-role">
              <img
                src={currentUser.role === 'trainer' ? '/trener.png' : '/rodzic.png'}
                alt=""
                className="header-role-icon"
              />
              {currentUser.role === 'trainer' ? 'Trener' : 'Rodzic'}
            </span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Wyloguj
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
