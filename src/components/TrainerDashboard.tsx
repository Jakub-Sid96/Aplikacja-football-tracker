import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useApp } from '../AppContext';
import EditModal from './EditModal';
import ConfirmModal from './ConfirmModal';
import { pluralZawodnik } from '../plurals';
import { PremiumButton } from './ui/PremiumButton';

// ============================================================
// TrainerDashboard – główny widok trenera po zalogowaniu.
//
// Dwa taby:
// 1. Grupy – lista grup treningowych, klikalne (→ GroupView)
// 2. Prośby – akceptacja/odrzucenie join requests
//
// Trener NIE widzi jednostek ani zawodników na tym poziomie.
// Musi wejść do konkretnej grupy, żeby widzieć jej zawartość.
// To odzwierciedla realny workflow: trener myśli "per grupa".
// ============================================================

type Tab = 'groups' | 'requests';

const TrainerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    getGroupsForTrainer,
    addGroup,
    updateGroup,
    deleteGroup,
    getChildrenForGroup,
    getJoinRequestsForTrainer,
    acceptJoinRequest,
    rejectJoinRequest,
    getPendingRequestsCount,
    getGroupById,
    getChildById,
  } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('groups');

  // Tworzenie grupy
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [groupName, setGroupName] = useState('');

  // Edycja nazwy grupy
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');

  // Usuwanie grupy
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

  if (!currentUser) return null;

  const groups = getGroupsForTrainer(currentUser.id);
  const requests = getJoinRequestsForTrainer(currentUser.id);
  const pendingCount = getPendingRequestsCount(currentUser.id);

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    addGroup({
      id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: groupName.trim(),
      trainerId: currentUser.id,
    });

    setGroupName('');
    setShowAddGroup(false);
  };

  return (
    <div className="container">
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${tab === 'groups' ? 'active' : ''}`}
          onClick={() => setTab('groups')}
        >
          Grupy
        </button>
        <button
          className={`tab-btn ${tab === 'requests' ? 'active' : ''}`}
          onClick={() => setTab('requests')}
        >
          Prośby
          {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
        </button>
      </div>

      {/* === TAB: GRUPY === */}
      {tab === 'groups' && (
        <>
          {groups.length === 0 && !showAddGroup && (
            <div className="empty-state">
              <p>Nie utworzono jeszcze żadnej grupy.</p>
              <p>Utwórz grupę, żeby rodzice mogli przypisywać do niej dzieci.</p>
            </div>
          )}

          {groups.length > 0 && (
            <div className="groups-list">
              {groups.map(group => {
                const groupChildren = getChildrenForGroup(group.id);
                return (
                  <div
                    key={group.id}
                    className="group-card clickable"
                    onClick={() => navigate(`/trainer/group/${group.id}`)}
                  >
                    <div className="group-card-header">
                      <h3>{group.name}</h3>
                      <div className="group-card-header-right">
                        <span className="group-card-count">
                          {groupChildren.length} {pluralZawodnik(groupChildren.length)}
                        </span>
                        <PremiumButton
                          variant="blue"
                          size="sm"
                          iconOnly
                          className="pbtn--ghost"
                          icon={<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>}
                          onClick={e => {
                            e.stopPropagation();
                            setEditGroupId(group.id);
                            setEditGroupName(group.name);
                          }}
                          title="Edytuj nazwę grupy"
                        >
                          Edytuj nazwę grupy
                        </PremiumButton>
                        <PremiumButton
                          variant="rose"
                          size="sm"
                          iconOnly
                          className="pbtn--ghost"
                          icon={<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>}
                          onClick={e => {
                            e.stopPropagation();
                            setDeleteGroupId(group.id);
                          }}
                          title="Usuń grupę"
                        >
                          Usuń grupę
                        </PremiumButton>
                      </div>
                    </div>
                    {groupChildren.length > 0 && (
                      <div className="group-children">
                        {groupChildren.slice(0, 3).map(c => (
                          <span key={c.id} className="group-child-badge">{c.name}</span>
                        ))}
                        {groupChildren.length > 3 && (
                          <span className="group-child-badge extra-badge">
                            +{groupChildren.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showAddGroup ? (
            <form onSubmit={handleAddGroup} className="inline-form">
              <div className="form-group">
                <label htmlFor="group-name">Nazwa grupy</label>
                <input
                  id="group-name"
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="np. U9, Rocznik 2016"
                  required
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <PremiumButton
                  type="button"
                  variant="navy"
                  size="sm"
                  onClick={() => { setShowAddGroup(false); setGroupName(''); }}
                >
                  Anuluj
                </PremiumButton>
                <PremiumButton variant="blue" size="sm" type="submit" disabled={!groupName.trim()}>
                  Utwórz
                </PremiumButton>
              </div>
            </form>
          ) : (
            <PremiumButton variant="blue" className="pbtn--block" onClick={() => setShowAddGroup(true)}>
              + Nowa grupa
            </PremiumButton>
          )}
        </>
      )}

      {/* === TAB: PROŚBY – tylko pending (do podjęcia decyzji) ===
           Zaakceptowane/odrzucone znikają automatycznie.
           Zakładka służy wyłącznie do obsługi nowych próśb. */}
      {tab === 'requests' && (() => {
        const pendingRequests = requests.filter(r => r.status === 'pending');
        return (
          <>
            {pendingRequests.length === 0 ? (
              <p className="empty-state">Brak próśb oczekujących na decyzję.</p>
            ) : (
              <div className="requests-list">
                {pendingRequests.map(req => {
                  const child = getChildById(req.childId);
                  const group = getGroupById(req.groupId);

                  return (
                    <div key={req.id} className="request-card">
                      <div className="request-card-header">
                        <div>
                          <strong>{child?.name || 'Dziecko'}</strong>
                          <span className="request-card-arrow"> → </span>
                          <span>{group?.name || 'Grupa'}</span>
                        </div>
                        <span className="status-badge pending">Oczekuje</span>
                      </div>
                      <div className="request-card-date">
                        {new Date(req.createdAt).toLocaleDateString('pl-PL')}
                      </div>
                      <div className="request-actions">
                        <PremiumButton
                          variant="rose"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); rejectJoinRequest(req.id); }}
                        >
                          Odrzuć
                        </PremiumButton>
                        <PremiumButton
                          variant="emerald"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); acceptJoinRequest(req.id); }}
                        >
                          Akceptuj
                        </PremiumButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );
      })()}
      {/* === MODAL: Edycja nazwy grupy === */}
      {editGroupId && (
        <EditModal
          title="Edytuj nazwę grupy"
          canSave={editGroupName.trim().length > 0}
          onSave={() => {
            updateGroup(editGroupId, { name: editGroupName.trim() });
            setEditGroupId(null);
          }}
          onCancel={() => setEditGroupId(null)}
        >
          <div className="form-group">
            <label>Nazwa grupy</label>
            <input
              type="text"
              value={editGroupName}
              onChange={e => setEditGroupName(e.target.value)}
              placeholder="np. U9, Rocznik 2016"
              autoFocus
            />
          </div>
        </EditModal>
      )}
      {/* === MODAL: Usuwanie grupy === */}
      {deleteGroupId && (() => {
        const groupToDelete = groups.find(g => g.id === deleteGroupId);
        return (
          <ConfirmModal
            title="Usuń grupę"
            message={`Czy na pewno chcesz usunąć grupę „${groupToDelete?.name || ''}"? Wszystkie raporty meczowe/treningowe w tej grupie zostaną usunięte. Tej operacji nie można cofnąć.`}
            confirmLabel="Usuń grupę"
            danger
            onConfirm={() => {
              deleteGroup(deleteGroupId);
              setDeleteGroupId(null);
            }}
            onCancel={() => setDeleteGroupId(null)}
          />
        );
      })()}
    </div>
  );
};

export default TrainerDashboard;
