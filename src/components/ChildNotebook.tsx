import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import ReportCard from './ReportCard';

// ============================================================
// ChildNotebook – notatnik zawodnika widziany przez trenera.
//
// Kontekst grupy: groupId z URL → pokazuje TYLKO raporty
// dotyczące jednostek z tej grupy i o statusie SUBMITTED.
// ============================================================

const ChildNotebook: React.FC = () => {
  const { groupId, childId } = useParams<{ groupId: string; childId: string }>();
  const navigate = useNavigate();
  const {
    getChildById,
    getGroupById,
    getSessionsForGroup,
    getSubmittedReportsForChild,
    getSessionById,
  } = useApp();

  const child = childId ? getChildById(childId) : undefined;
  const group = groupId ? getGroupById(groupId) : undefined;

  if (!child || !group) {
    return <div className="container"><p>Nie znaleziono zawodnika.</p></div>;
  }

  // Sesje z tej grupy
  const groupSessions = getSessionsForGroup(group.id);
  const groupSessionIds = new Set(groupSessions.map(s => s.id));

  // Tylko submitted raporty tego dziecka, filtrowane do sesji z tej grupy
  const allReports = childId ? getSubmittedReportsForChild(childId) : [];
  const reports = allReports.filter(r => groupSessionIds.has(r.sessionId));

  const backUrl = `/trainer/group/${groupId}`;

  return (
    <div className="container">
      <button className="btn-back" onClick={() => navigate(backUrl)}>
        ← Powrót do {group.name}
      </button>

      <div className="notebook-header">
        <h2>{child.name}</h2>
        <span className="entries-count">
          {reports.length} {reports.length === 1 ? 'raport' : 'raportów'}
        </span>
      </div>

      {reports.length === 0 ? (
        <p className="empty-state">Brak wysłanych raportów dla tego zawodnika w tej grupie.</p>
      ) : (
        <div className="entries-list">
          {reports.map(report => {
            const session = getSessionById(report.sessionId);
            if (!session) return null;
            return <ReportCard key={report.id} report={report} session={session} />;
          })}
        </div>
      )}
    </div>
  );
};

export default ChildNotebook;
