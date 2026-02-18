import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useApp } from '../AppContext';
import ConfirmModal from './ConfirmModal';
import EditModal from './EditModal';

// ============================================================
// GroupView – widok konkretnej grupy treningowej.
//
// Dwa taby:
// 1. Raporty postępów – lista raportów postępów tej grupy
// 2. Zawodnicy – lista dzieci przypisanych do grupy
//
// Trener zawsze pracuje w kontekście grupy.
// Raporty postępów tworzone tutaj automatycznie należą do tej grupy.
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
    deleteSession,
    updateSessionTitle,
    removeChildFromGroup,
    moveChildToGroup,
  } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('sessions');

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
      <button className="btn-back" onClick={() => navigate('/trainer')}>
        ← Powrót do grup
      </button>

      <div className="form-header">
        <h2>{group.name}</h2>
        <p className="child-badge">
          {groupChildren.length} zawodników · {sessions.length} raportów postępów
        </p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${tab === 'sessions' ? 'active' : ''}`}
          onClick={() => setTab('sessions')}
        >
          Raporty postępów
        </button>
        <button
          className={`tab-btn ${tab === 'children' ? 'active' : ''}`}
          onClick={() => setTab('children')}
        >
          Zawodnicy
        </button>
      </div>

      {/* === TAB: RAPORTY POSTĘPÓW === */}
      {tab === 'sessions' && (
        <>
          <button
            className="btn-primary"
            onClick={() => navigate(`/trainer/group/${groupId}/new-session`)}
          >
            + Nowy raport postępów
          </button>

          {sessions.length === 0 ? (
            <p className="empty-state">Nie utworzono jeszcze żadnego raportu postępów w tej grupie.</p>
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
                        <button
                          className="btn-icon-edit"
                          onClick={() => {
                            setEditSessionId(session.id);
                            setEditSessionTitle(session.title);
                          }}
                          title="Edytuj tytuł"
                        >
                          ✏️
                        </button>
                      </div>
                      <div className="session-card-actions">
                        <span className="session-card-date">{formattedDate}</span>
                        <button
                          className="btn-icon-danger"
                          onClick={() => setDeleteSessionId(session.id)}
                          aria-label={`Usuń ${session.title}`}
                          title="Usuń raport"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                    <div className="session-card-meta">
                      <span>{session.categories.length} kategorii</span>
                      <span className="meta-dot">·</span>
                      <span>{reports.length} raportów</span>
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

                return (
                  <div key={child.id} className="child-card">
                    <div className="child-card-info">
                      <div
                        className="child-card-clickable"
                        onClick={() => navigate(`/trainer/group/${groupId}/child/${child.id}`)}
                      >
                        <h3>{child.name}</h3>
                      </div>
                      <span className={`child-card-meta ${reports.length === sessions.length ? 'reports-complete' : 'reports-pending'}`}>
                        {reports.length}/{sessions.length} raportów
                      </span>
                    </div>
                    <div className="child-card-actions">
                      {otherGroups.length > 0 && (
                        <button
                          className="btn-action-move"
                          onClick={() => {
                            setMoveChildId(child.id);
                            setMoveTargetGroupId(otherGroups[0].id);
                          }}
                        >
                          Przenieś do innej grupy
                        </button>
                      )}
                      <button
                        className="btn-action-danger"
                        onClick={() => setRemoveChildId(child.id)}
                      >
                        Usuń z grupy
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* === MODAL: Usuń raport postępów === */}
      {sessionToDelete && (
        <ConfirmModal
          title="Usuń raport postępów"
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
            <label>Tytuł raportu postępów</label>
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
              <select
                value={moveTargetGroupId}
                onChange={e => setMoveTargetGroupId(e.target.value)}
              >
                {otherGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="confirm-actions">
              <button className="btn-secondary confirm-cancel" onClick={() => setMoveChildId(null)}>
                Anuluj
              </button>
              <button
                className="confirm-btn confirm-btn--primary"
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
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupView;
