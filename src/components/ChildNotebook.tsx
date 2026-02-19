import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import ReportCard from './ReportCard';
import { pluralWpis } from '../plurals';

// ============================================================
// ChildNotebook – widok zawodnika widziany przez trenera.
//
// Dwie zakladki z systemem statusow (perspektywa trenera):
// 1. Raporty:
//    - zolty badge + pasek = rodzic nie odeslal wszystkich raportow
//    - zielony pasek = wszystkie raporty odeslane
// 2. Postepy zawodnika:
//    - zolty badge + pasek = rodzic nie odczytal wszystkich postepow
//    - zielony pasek = rodzic odczytal wszystko
// ============================================================

type Tab = 'reports' | 'progress';

const ChildNotebook: React.FC = () => {
  const { groupId, childId } = useParams<{ groupId: string; childId: string }>();
  const navigate = useNavigate();
  const {
    getChildById,
    getGroupById,
    getSessionsForGroup,
    getSubmittedReportsForChild,
    getSessionById,
    getProgressEntriesForChild,
    addProgressEntry,
    getUnreadProgressCount,
  } = useApp();

  const [tab, setTab] = useState<Tab>('reports');

  // Formularz postepow
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [description, setDescription] = useState('');

  const child = childId ? getChildById(childId) : undefined;
  const group = groupId ? getGroupById(groupId) : undefined;

  if (!child || !group) {
    return <div className="container"><p>Nie znaleziono zawodnika.</p></div>;
  }

  // Sesje z tej grupy – filtrowane wg daty dołączenia zawodnika
  const allGroupSessions = getSessionsForGroup(group.id);
  const joinedAt = child.joinedGroupAt;
  const groupSessions = joinedAt
    ? allGroupSessions.filter(s => s.date >= joinedAt)
    : allGroupSessions;
  const groupSessionIds = new Set(groupSessions.map(s => s.id));

  // Tylko submitted raporty tego dziecka, filtrowane do sesji z tej grupy
  const allReports = childId ? getSubmittedReportsForChild(childId) : [];
  const reports = allReports.filter(r => groupSessionIds.has(r.sessionId));

  // Postepy zawodnika
  const progressEntries = childId ? getProgressEntriesForChild(childId) : [];

  // === STATUSY DLA TRENERA ===

  // Raporty: zolty jesli rodzic nie wyslal wszystkich, zielony jesli wyslal
  const totalSessions = groupSessions.length;
  const submittedCount = reports.length;
  const pendingReportsCount = totalSessions - submittedCount;

  type TabStatus = 'warning' | 'success' | 'default';
  let reportsTabStatus: TabStatus = 'default';
  if (totalSessions > 0) {
    reportsTabStatus = pendingReportsCount > 0 ? 'warning' : 'success';
  }

  // Postepy: zolty jesli rodzic nie odczytal wszystkich, zielony jesli odczytal
  const unreadByParent = childId ? getUnreadProgressCount(childId) : 0;
  let progressTabStatus: TabStatus = 'default';
  if (progressEntries.length > 0) {
    progressTabStatus = unreadByParent > 0 ? 'warning' : 'success';
  }

  const backUrl = `/trainer/group/${groupId}`;

  const handleAddProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !childId || !groupId) return;

    addProgressEntry({
      id: `prog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      childId,
      groupId,
      trainerId: group.trainerId,
      period,
      description: description.trim(),
      createdAt: new Date().toISOString(),
    });

    setDescription('');
    setPeriod('week');
    setShowForm(false);
  };

  return (
    <div className="container">
      <button className="btn-back" onClick={() => navigate(backUrl)}>
        ← Powrót do {group.name}
      </button>

      <div className="notebook-header">
        <h2>{child.name}</h2>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${tab === 'reports' ? 'active' : ''} ${tab === 'reports' ? `tab-status-${reportsTabStatus}` : ''}`}
          onClick={() => setTab('reports')}
        >
          Raporty
          {reportsTabStatus === 'warning' && pendingReportsCount > 0 && (
            <span className="tab-badge tab-badge-warning">{pendingReportsCount}</span>
          )}
        </button>
        <button
          className={`tab-btn ${tab === 'progress' ? 'active' : ''} ${tab === 'progress' ? `tab-status-${progressTabStatus}` : ''}`}
          onClick={() => setTab('progress')}
        >
          Postępy zawodnika
          {progressTabStatus === 'warning' && unreadByParent > 0 && (
            <span className="tab-badge tab-badge-warning">{unreadByParent}</span>
          )}
        </button>
      </div>

      {/* === TAB: RAPORTY === */}
      {tab === 'reports' && (
        <>
          {totalSessions === 0 ? (
            <p className="empty-state">Brak raportow meczowych/treningowych w tej grupie. Utworz pierwszy raport w widoku grupy.</p>
          ) : reports.length === 0 ? (
            <p className="empty-state">Rodzic nie wyslal jeszcze zadnych raportow dla tego zawodnika.</p>
          ) : (
            <div className="entries-list">
              {reports.map(report => {
                const session = getSessionById(report.sessionId);
                if (!session) return null;
                return <ReportCard key={report.id} report={report} session={session} />;
              })}
            </div>
          )}

          {/* Podsumowanie statusu */}
          {totalSessions > 0 && (
            <div className={`trainer-status-summary ${reportsTabStatus}`}>
              <span className="trainer-status-icon">
                {reportsTabStatus === 'success' ? '✓' : '⏳'}
              </span>
              <span>
                {reportsTabStatus === 'success'
                  ? `Rodzic odeslal wszystkie raporty (${submittedCount}/${totalSessions})`
                  : `Oczekiwanie na raporty od rodzica (${submittedCount}/${totalSessions})`
                }
              </span>
            </div>
          )}
        </>
      )}

      {/* === TAB: POSTEPY ZAWODNIKA === */}
      {tab === 'progress' && (
        <>
          {showForm ? (
            <form onSubmit={handleAddProgress} className="inline-form">
              <h3 className="section-label">Nowy wpis postepow</h3>
              <div className="form-group">
                <label>Okres</label>
                <div className="period-selector">
                  <button
                    type="button"
                    className={`period-option ${period === 'week' ? 'selected' : ''}`}
                    onClick={() => setPeriod('week')}
                  >
                    Tydzien
                  </button>
                  <button
                    type="button"
                    className={`period-option ${period === 'month' ? 'selected' : ''}`}
                    onClick={() => setPeriod('month')}
                  >
                    Miesiąc
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="progress-desc">Opis zalozen i oczekiwan</label>
                <textarea
                  id="progress-desc"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Cele treningowe, mentalne, techniczne... Opisz oczekiwania wobec rozwoju zawodnika."
                  rows={5}
                  required
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setShowForm(false); setDescription(''); setPeriod('week'); }}
                >
                  Anuluj
                </button>
                <button type="submit" className="btn-primary" disabled={!description.trim()}>
                  Zapisz postępy
                </button>
              </div>
            </form>
          ) : (
            <button
              className="btn-primary"
              onClick={() => setShowForm(true)}
            >
              + Dodaj postępy
            </button>
          )}

          {progressEntries.length === 0 && !showForm ? (
            <p className="empty-state">Brak wpisow postepow. Dodaj pierwszy wpis, aby prowadzic rozwoj zawodnika.</p>
          ) : (
            <>
              {/* Podsumowanie statusu odczytu */}
              {progressEntries.length > 0 && (
                <div className={`trainer-status-summary ${progressTabStatus}`}>
                  <span className="trainer-status-icon">
                    {progressTabStatus === 'success' ? '✓' : '⏳'}
                  </span>
                  <span>
                    {progressTabStatus === 'success'
                      ? 'Rodzic odczytał wszystkie postępy'
                      : `Rodzic nie odczytał ${unreadByParent} z ${progressEntries.length} ${pluralWpis(progressEntries.length)}`
                    }
                  </span>
                </div>
              )}

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
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ChildNotebook;
