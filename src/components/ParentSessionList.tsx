import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useApp } from '../AppContext';
import { pluralKategoria } from '../plurals';

// ============================================================
// ParentSessionList – widok zawodnika widziany przez rodzica.
//
// Dwie zakladki z systemem statusow:
// 1. Raporty – lista raportow do wypelnienia
//    - czerwony badge/pasek = nowe, nieodczytane sesje od trenera
//    - zolty badge/pasek = raporty do wypelnienia
//    - zielony pasek = wszystko wyslane
// 2. Postepy zawodnika – wpisy rozwojowe od trenera
//    - zielony badge = nowe, nieodczytane postepy
//    - badge znika po otwarciu zakladki
// ============================================================

type Tab = 'reports' | 'progress';

const ParentSessionList: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const { currentUser } = useAuth();
  const {
    getChildById,
    getSessionsForGroup,
    getReportForSessionAndChild,
    getProgressEntriesForChild,
    getUnreadSessionCount,
    getUnreadProgressCount,
    markSessionsRead,
    markProgressRead,
    isSessionRead,
  } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('reports');

  if (!currentUser || !childId) return null;

  const child = getChildById(childId);

  if (!child || child.parentId !== currentUser.id) {
    return <div className="container"><p>Nie znaleziono dziecka.</p></div>;
  }

  if (!child.groupId) {
    return (
      <div className="container">
        <button className="btn-back" onClick={() => navigate('/parent')}>← Powrót</button>
        <p className="empty-state">
          To dziecko nie jest jeszcze przypisane do zadnej grupy treningowej.
        </p>
      </div>
    );
  }

  const allSessions = getSessionsForGroup(child.groupId);
  const progressEntries = getProgressEntriesForChild(child.id);

  // Filtruj sesje – pokaż tylko te od daty dołączenia do grupy
  const sessions = child.joinedGroupAt
    ? allSessions.filter(s => s.date >= child.joinedGroupAt!)
    : allSessions;

  // === STATUSY ===
  // Nieodczytane sesje (nowe od trenera, rodzic nie widzial)
  const unreadSessionCount = getUnreadSessionCount(child.id, child.groupId);

  // Raporty do wypelnienia (odczytane, ale nie submitted)
  const pendingReportCount = sessions.filter(s => {
    if (!isSessionRead(child.id, s.id)) return false; // nieodczytane liczone osobno
    const report = getReportForSessionAndChild(s.id, child.id);
    return !report || report.status !== 'submitted';
  }).length;

  // Nieodczytane postepy
  const unreadProgressCount = getUnreadProgressCount(child.id);

  // Kolor zakladki raportow
  type TabStatus = 'danger' | 'warning' | 'success' | 'default';
  let reportsTabStatus: TabStatus = 'default';
  let reportsTabBadge = 0;

  if (unreadSessionCount > 0) {
    reportsTabStatus = 'danger';
    reportsTabBadge = unreadSessionCount;
  } else if (pendingReportCount > 0) {
    reportsTabStatus = 'warning';
    reportsTabBadge = pendingReportCount;
  } else if (sessions.length > 0) {
    reportsTabStatus = 'success';
  }

  // Kolor zakladki postepow
  let progressTabStatus: TabStatus = 'default';
  let progressTabBadge = 0;

  if (unreadProgressCount > 0) {
    progressTabStatus = 'success';
    progressTabBadge = unreadProgressCount;
  }

  // === AUTO-MARK READ ===
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (tab === 'reports' && childId && child.groupId && unreadSessionCount > 0) {
      const sessionIds = sessions.map(s => s.id);
      markSessionsRead(childId, sessionIds);
    }
  }, [tab, childId, child.groupId, sessions, unreadSessionCount, markSessionsRead]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (tab === 'progress' && childId && unreadProgressCount > 0) {
      const progressIds = progressEntries.map(e => e.id);
      markProgressRead(childId, progressIds);
    }
  }, [tab, childId, progressEntries, unreadProgressCount, markProgressRead]);

  return (
    <div className="container">
      <button className="btn-back" onClick={() => navigate('/parent')}>← Powrót</button>

      <div className="form-header cal-header-row">
        <h2>{child.name}</h2>
        {child.groupId && (
          <button
            className="cal-icon-btn"
            onClick={() => navigate(`/parent/calendar/${childId}`)}
            title="Kalendarz treningów"
            type="button"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
        )}
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${tab === 'reports' ? 'active' : ''} ${tab === 'reports' ? `tab-status-${reportsTabStatus}` : ''}`}
          onClick={() => setTab('reports')}
        >
          Raporty
          {reportsTabBadge > 0 && (
            <span className={`tab-badge tab-badge-${reportsTabStatus}`}>{reportsTabBadge}</span>
          )}
        </button>
        <button
          className={`tab-btn ${tab === 'progress' ? 'active' : ''} ${tab === 'progress' ? `tab-status-${progressTabStatus}` : ''}`}
          onClick={() => setTab('progress')}
        >
          Postępy zawodnika
          {progressTabBadge > 0 && (
            <span className={`tab-badge tab-badge-${progressTabStatus}`}>{progressTabBadge}</span>
          )}
        </button>
      </div>

      {/* === TAB: RAPORTY === */}
      {tab === 'reports' && (
        <>
          {sessions.length === 0 ? (
            <p className="empty-state">
              Trener nie utworzyl jeszcze zadnego raportu meczowego/treningowego w tej grupie.
            </p>
          ) : (
            <div className="sessions-list">
              {sessions.map(session => {
                const report = getReportForSessionAndChild(session.id, child.id);
                const status = report?.status;
                const formattedDate = new Date(session.date).toLocaleDateString('pl-PL');
                const isNew = !isSessionRead(child.id, session.id);

                return (
                  <div
                    key={session.id}
                    className={`session-card clickable ${status === 'submitted' ? 'completed' : ''} ${isNew ? 'session-card-new' : ''}`}
                    onClick={() => navigate(`/parent/report/${session.id}/${child.id}`)}
                  >
                    <div className="session-card-header">
                      <h3>{session.title}</h3>
                      <span className="session-card-date">{formattedDate}</span>
                    </div>
                    <div className="session-card-meta">
                      <span>{session.categories.length} {pluralKategoria(session.categories.length)}</span>
                      {isNew && (
                        <span className="status-badge new-badge">Nowy</span>
                      )}
                      {!isNew && status === 'submitted' && (
                        <span className="status-badge done">Wysłano</span>
                      )}
                      {!isNew && status === 'draft' && (
                        <span className="status-badge draft">Wersja robocza</span>
                      )}
                      {!isNew && !status && (
                        <span className="status-badge pending">Do wypełnienia</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* === TAB: POSTEPY ZAWODNIKA === */}
      {tab === 'progress' && (
        <>
          {progressEntries.length === 0 ? (
            <p className="empty-state">
              Trener nie dodal jeszcze wpisow postepow dla tego zawodnika.
            </p>
          ) : (
            <div className="progress-list">
              {progressEntries.map(entry => (
                <div key={entry.id} className="progress-card">
                  <div className="progress-card-header">
                    <span className={`progress-period-badge ${entry.period}`}>
                      {entry.period === 'week' ? 'Tydzień' : 'Miesiąc'}
                    </span>
                    <span className="progress-card-date">
                      {new Date(entry.createdAt).toLocaleDateString('pl-PL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="progress-card-description">{entry.description}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ParentSessionList;
