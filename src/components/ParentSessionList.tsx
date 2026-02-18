import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useApp } from '../AppContext';

// ============================================================
// ParentSessionList – lista raportów postępów do wypełnienia
// dla konkretnego dziecka (wybranego z dashboardu rodzica).
//
// Filtruje sesje PO GRUPIE dziecka (child.groupId),
// a nie po wszystkich sesjach trenera.
// ============================================================

const ParentSessionList: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const { currentUser } = useAuth();
  const {
    getChildById,
    getSessionsForGroup,
    getReportForSessionAndChild,
  } = useApp();
  const navigate = useNavigate();

  if (!currentUser || !childId) return null;

  const child = getChildById(childId);

  // Bezpieczeństwo: rodzic widzi tylko swoje dzieci
  if (!child || child.parentId !== currentUser.id) {
    return <div className="container"><p>Nie znaleziono dziecka.</p></div>;
  }

  // Dziecko musi być przypisane do grupy
  if (!child.groupId) {
    return (
      <div className="container">
        <button className="btn-back" onClick={() => navigate('/parent')}>← Powrót</button>
        <p className="empty-state">
          To dziecko nie jest jeszcze przypisane do żadnej grupy treningowej.
        </p>
      </div>
    );
  }

  // Sesje z grupy dziecka (nie wszystkie sesje trenera)
  const sessions = getSessionsForGroup(child.groupId);

  return (
    <div className="container">
      <button className="btn-back" onClick={() => navigate('/parent')}>← Powrót</button>

      <div className="form-header">
        <h2>Raporty postępów do wypełnienia</h2>
        <p className="child-badge">Zawodnik: <strong>{child.name}</strong></p>
      </div>

      {sessions.length === 0 ? (
        <p className="empty-state">
          Trener nie utworzył jeszcze żadnego raportu postępów w tej grupie.
        </p>
      ) : (
        <div className="sessions-list">
          {sessions.map(session => {
            const report = getReportForSessionAndChild(session.id, child.id);
            const status = report?.status;
            const formattedDate = new Date(session.date).toLocaleDateString('pl-PL');

            return (
              <div
                key={session.id}
                className={`session-card clickable ${status === 'submitted' ? 'completed' : ''}`}
                onClick={() => navigate(`/parent/report/${session.id}/${child.id}`)}
              >
                <div className="session-card-header">
                  <h3>{session.title}</h3>
                  <span className="session-card-date">{formattedDate}</span>
                </div>
                <div className="session-card-meta">
                  <span>{session.categories.length} kategorii</span>
                  {status === 'submitted' && (
                    <span className="status-badge done">Wysłano</span>
                  )}
                  {status === 'draft' && (
                    <span className="status-badge draft">Wersja robocza</span>
                  )}
                  {!status && (
                    <span className="status-badge pending">Do wypełnienia</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParentSessionList;
