import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useApp } from '../AppContext';
import ConfirmModal from './ConfirmModal';
import EditModal from './EditModal';
import { pluralZawodnik, pluralRaport, pluralKategoria, pluralPostep } from '../plurals';
import { PremiumButton } from './ui/PremiumButton';

// ============================================================
// GroupView – widok konkretnej grupy treningowej.
//
// Dwa taby:
// 1. Raporty meczowe/treningowe – lista raportów tej grupy
// 2. Zawodnicy – lista dzieci przypisanych do grupy
//
// Trener zawsze pracuje w kontekście grupy.
// Raporty meczowe/treningowe tworzone tutaj automatycznie należą do tej grupy.
// Kliknięcie w zawodnika → notatnik tego zawodnika (per grupa).
// ============================================================

type Tab = 'sessions' | 'children';

const GroupView: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { currentUser } = useAuth();
  const {
    getGroupById,
    getGroupsForTrainer,
    getSessionsForGroup,
    getSubmittedReportsForSession,
    getChildrenForGroup,
    getSubmittedReportsForChild,
    getProgressEntriesForChild,
    deleteSession,
    updateSessionTitle,
    removeChildFromGroup,
    moveChildToGroup,
  } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('children');

  // Modals
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [removeChildId, setRemoveChildId] = useState<string | null>(null);
  const [moveChildId, setMoveChildId] = useState<string | null>(null);
  const [moveTargetGroupId, setMoveTargetGroupId] = useState<string>('');

  // Edycja tytułu raportu
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [editSessionTitle, setEditSessionTitle] = useState('');

  if (!currentUser || !groupId) return null;

  const group = getGroupById(groupId);

  // Bezpieczeństwo: trener widzi tylko swoje grupy
  if (!group || group.trainerId !== currentUser.id) {
    return <div className="container"><p>Nie znaleziono grupy.</p></div>;
  }

  const sessions = getSessionsForGroup(groupId);
  const groupChildren = getChildrenForGroup(groupId);

  // Inne grupy trenera (do przenoszenia)
  const allTrainerGroups = getGroupsForTrainer(currentUser.id);
  const otherGroups = allTrainerGroups.filter(g => g.id !== groupId);

  const sessionToDelete = deleteSessionId ? sessions.find(s => s.id === deleteSessionId) : null;
  const childToRemove = removeChildId ? groupChildren.find(c => c.id === removeChildId) : null;
  const childToMove = moveChildId ? groupChildren.find(c => c.id === moveChildId) : null;
  return (
    <div className="container">
      <PremiumButton variant="navy" size="sm" className="pbtn--back" onClick={() => navigate('/trainer')}>
        ← Powrót do grup
      </PremiumButton>

      <div className="form-header cal-header-row">
        <div>
          <h2>{group.name}</h2>
          <p className="child-badge">
            {groupChildren.length} {pluralZawodnik(groupChildren.length)} · {sessions.length} {pluralRaport(sessions.length)}
          </p>
        </div>
        <button
          className="cal-icon-btn"
          onClick={() => navigate(`/trainer/group/${groupId}/calendar`)}
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
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${tab === 'children' ? 'active' : ''}`}
          onClick={() => setTab('children')}
        >
          Zawodnicy
        </button>
        <button
          className={`tab-btn ${tab === 'sessions' ? 'active' : ''}`}
          onClick={() => setTab('sessions')}
        >
          Raporty meczowe/treningowe
        </button>
      </div>

      {/* === TAB: RAPORTY MECZOWE/TRENINGOWE === */}
      {tab === 'sessions' && (
        <>
          <PremiumButton
            variant="blue"
            className="pbtn--block"
            onClick={() => navigate(`/trainer/group/${groupId}/new-session`)}
          >
            + Nowy raport meczowy/treningowy
          </PremiumButton>

          {sessions.length === 0 ? (
            <p className="empty-state">Nie utworzono jeszcze żadnego raportu meczowego/treningowego w tej grupie.</p>
          ) : (
            <div className="sessions-list">
              {sessions.map(session => {
                const reports = getSubmittedReportsForSession(session.id);
                const formattedDate = new Date(session.date).toLocaleDateString('pl-PL');

                return (
                  <div key={session.id} className="session-card">
                    <div className="session-card-header">
                      <div className="session-card-title-row">
                        <h3>{session.title}</h3>
                        <PremiumButton
                          variant="blue"
                          size="sm"
                          iconOnly
                          className="pbtn--ghost"
                          icon={<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>}
                          onClick={() => {
                            setEditSessionId(session.id);
                            setEditSessionTitle(session.title);
                          }}
                          title="Edytuj tytuł"
                        >
                          Edytuj tytuł
                        </PremiumButton>
                      </div>
                      <div className="session-card-actions">
                        <span className="session-card-date">{formattedDate}</span>
                        <PremiumButton
                          variant="rose"
                          size="sm"
                          iconOnly
                          className="pbtn--ghost"
                          icon={<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>}
                          onClick={() => setDeleteSessionId(session.id)}
                          aria-label={`Usuń ${session.title}`}
                          title="Usuń raport"
                        >
                          Usuń raport
                        </PremiumButton>
                      </div>
                    </div>
                    <div className="session-card-meta">
                      <span>{session.categories.length} {pluralKategoria(session.categories.length)}</span>
                      <span className="meta-dot">·</span>
                      <span>{reports.length} {pluralRaport(reports.length)}</span>
                    </div>
                    <div className="session-card-categories">
                      {session.categories.map(cat => (
                        <span key={cat.id} className={`category-type-badge small ${cat.type}`}>
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* === TAB: ZAWODNICY === */}
      {tab === 'children' && (
        <>
          {groupChildren.length === 0 ? (
            <p className="empty-state">
              Brak zawodników w tej grupie. Poczekaj na prośby rodziców o dołączenie.
            </p>
          ) : (
            <div className="children-list">
              {groupChildren.map(child => {
                const reports = getSubmittedReportsForChild(child.id);
                const progressCount = getProgressEntriesForChild(child.id).length;

                // Sesje widoczne dla tego zawodnika (od daty dołączenia do grupy)
                const joinedAt = child.joinedGroupAt;
                const visibleSessions = joinedAt
                  ? sessions.filter(s => s.date >= joinedAt)
                  : sessions;
                const visibleReports = reports.filter(r => visibleSessions.some(s => s.id === r.sessionId));
                const visibleTotal = visibleSessions.length;

                return (
                  <div
                    key={child.id}
                    className="child-card clickable"
                    onClick={() => navigate(`/trainer/group/${groupId}/child/${child.id}`)}
                  >
                    <div className="child-card-info">
                      <div>
                        <h3>{child.name}</h3>
                      </div>
                      <div className="child-card-stats">
                        <span className={`child-card-meta ${visibleReports.length === visibleTotal ? 'reports-complete' : 'reports-pending'}`}>
                          {visibleReports.length}/{visibleTotal} {pluralRaport(visibleTotal)}
                        </span>
                        <span className="child-card-meta child-card-progress-count">
                          {progressCount} {pluralPostep(progressCount)}
                        </span>
                      </div>
                    </div>
                    <div className="child-card-actions">
                      {otherGroups.length > 0 && (
                        <PremiumButton
                          variant="blue"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMoveChildId(child.id);
                            setMoveTargetGroupId('');
                          }}
                        >
                          Przenieś do innej grupy
                        </PremiumButton>
                      )}
                      <PremiumButton
                        variant="rose"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setRemoveChildId(child.id); }}
                      >
                        Usuń z grupy
                      </PremiumButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* === MODAL: Usuń raport meczowy/treningowy === */}
      {sessionToDelete && (
        <ConfirmModal
          title="Usuń raport meczowy/treningowy"
          message={`Czy na pewno chcesz usunąć raport „${sessionToDelete.title}"? Wszystkie powiązane dane zostaną usunięte. Tej operacji nie można cofnąć.`}
          confirmLabel="Usuń raport"
          danger
          onConfirm={() => {
            deleteSession(sessionToDelete.id);
            setDeleteSessionId(null);
          }}
          onCancel={() => setDeleteSessionId(null)}
        />
      )}

      {/* === MODAL: Usuń dziecko z grupy === */}
      {childToRemove && (
        <ConfirmModal
          title="Usuń z grupy"
          message={`Czy na pewno chcesz usunąć ${childToRemove.name} z grupy „${group.name}"? Dziecko nie będzie już widoczne w tej grupie.`}
          confirmLabel="Usuń z grupy"
          danger
          onConfirm={() => {
            removeChildFromGroup(childToRemove.id);
            setRemoveChildId(null);
          }}
          onCancel={() => setRemoveChildId(null)}
        />
      )}

      {/* === MODAL: Edytuj tytuł raportu === */}
      {editSessionId && (
        <EditModal
          title="Edytuj tytuł raportu"
          canSave={editSessionTitle.trim().length > 0}
          onSave={() => {
            updateSessionTitle(editSessionId, editSessionTitle.trim());
            setEditSessionId(null);
          }}
          onCancel={() => setEditSessionId(null)}
        >
          <div className="form-group">
            <label>Tytuł raportu meczowego/treningowego</label>
            <input
              type="text"
              value={editSessionTitle}
              onChange={e => setEditSessionTitle(e.target.value)}
              placeholder="np. Mecz ligowy – Górnik Libiąż"
              autoFocus
            />
          </div>
        </EditModal>
      )}

      {/* === MODAL: Przenieś dziecko === */}
      {childToMove && (
        <div className="confirm-backdrop" onClick={() => setMoveChildId(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="confirm-title">Przenieś do innej grupy</h3>
            <p className="confirm-message">
              Przenosisz <strong>{childToMove.name}</strong> z grupy <strong>{group.name}</strong>.
            </p>
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label>Grupa docelowa</label>
              <div className="radio-group">
                {otherGroups.map(g => (
                  <label key={g.id} className={`radio-option${moveTargetGroupId === g.id ? ' selected' : ''}`}>
                    <input
                      type="radio"
                      name="moveTarget"
                      value={g.id}
                      checked={moveTargetGroupId === g.id}
                      onChange={e => setMoveTargetGroupId(e.target.value)}
                    />
                    {g.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="confirm-actions">
              <PremiumButton variant="navy" size="sm" onClick={() => setMoveChildId(null)}>
                Anuluj
              </PremiumButton>
              <PremiumButton
                variant="blue"
                size="sm"
                disabled={!moveTargetGroupId}
                onClick={() => {
                  if (moveTargetGroupId) {
                    moveChildToGroup(childToMove.id, moveTargetGroupId);
                    setMoveChildId(null);
                    setMoveTargetGroupId('');
                  }
                }}
              >
                Przenieś
              </PremiumButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupView;
