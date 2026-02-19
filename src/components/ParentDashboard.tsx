import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useApp } from '../AppContext';
import EditModal from './EditModal';
import DatePickerField from './ui/DatePicker';
import { pluralPostep } from '../plurals';

// ============================================================
// ParentDashboard – główny widok rodzica po zalogowaniu.
//
// Dwie sekcje (taby):
// 1. Moje dzieci – lista z pełną informacją o przypisaniu
//    (trener + grupa), wyszukiwarka trenera, dodawanie dziecka
// 2. Prośby – status wysłanych próśb o dołączenie
//
// UX: Przypisane dziecko wyświetla imię trenera i nazwę grupy,
// żeby rodzic od razu widział kontekst bez klikania.
// ============================================================

type Tab = 'children' | 'requests';

const ParentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    getChildrenForParent,
    addChild,
    updateChild,
    getJoinRequestsForParent,
    searchTrainers,
    sendJoinRequest,
    getGroupById,
    getPendingSessionsCountForChild,
    getUnreadSessionCount,
    getUnreadProgressCount,
  } = useApp();
  const { allUsers } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('children');

  // Dodawanie dziecka
  const [showAddChild, setShowAddChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');

  // Edycja dziecka
  const [editChildId, setEditChildId] = useState<string | null>(null);
  const [editChildName, setEditChildName] = useState('');
  const [editChildBirthDate, setEditChildBirthDate] = useState('');

  // Wyszukiwanie trenera
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchTrainers>>([]);
  const [selectedChildForJoin, setSelectedChildForJoin] = useState<string>('');

  if (!currentUser) return null;

  const myChildren = getChildrenForParent(currentUser.id);
  const myRequests = getJoinRequestsForParent(currentUser.id);

  // Dzieci z zaakceptowaną prośbą (przypisane do trenera)
  const assignedChildren = myChildren.filter(c => c.trainerId);
  // Dzieci bez przypisania
  const unassignedChildren = myChildren.filter(c => !c.trainerId);

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) return;

    addChild({
      id: `child-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: childName.trim(),
      birthDate: childBirthDate || undefined,
      parentId: currentUser.id,
    });

    setChildName('');
    setChildBirthDate('');
    setShowAddChild(false);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setSearchResults(searchTrainers(searchQuery));
  };

  const handleSendRequest = (trainerId: string, groupId: string) => {
    // Jeśli jest tylko 1 nieprzypisane dziecko, użyj go automatycznie
    const childForJoin = unassignedChildren.length === 1
      ? unassignedChildren[0].id
      : selectedChildForJoin;
    if (!childForJoin) return;

    // Sprawdź czy nie ma już takiej prośby
    const exists = myRequests.find(r =>
      r.childId === childForJoin &&
      r.groupId === groupId &&
      r.status === 'pending'
    );
    if (exists) return;

    sendJoinRequest({
      id: `req-${Date.now()}`,
      childId: childForJoin,
      groupId,
      trainerId,
      parentId: currentUser.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    setSearchQuery('');
    setSearchResults([]);
    setSelectedChildForJoin('');
    setTab('requests');
  };

  return (
    <div className="container">
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${tab === 'children' ? 'active' : ''}`}
          onClick={() => setTab('children')}
        >
          Moje dzieci
        </button>
        <button
          className={`tab-btn ${tab === 'requests' ? 'active' : ''}`}
          onClick={() => setTab('requests')}
        >
          Prośby
          {myRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="tab-badge">{myRequests.filter(r => r.status === 'pending').length}</span>
          )}
        </button>
      </div>

      {/* === TAB: DZIECI === */}
      {tab === 'children' && (
        <>
          {/* Przypisane dzieci – pełna informacja: trener + grupa */}
          {assignedChildren.length > 0 && (
            <div className="section-block">
              <h3 className="section-label">Przypisane do trenera</h3>
              <div className="children-list">
                {assignedChildren.map(child => {
                  const trainer = allUsers.find(u => u.id === child.trainerId);
                  const group = child.groupId ? getGroupById(child.groupId) : undefined;
                  const pendingCount = child.groupId
                    ? getPendingSessionsCountForChild(child.id, child.groupId)
                    : 0;
                  const unreadSessions = child.groupId
                    ? getUnreadSessionCount(child.id, child.groupId)
                    : 0;
                  const unreadProgress = getUnreadProgressCount(child.id);

                  return (
                    <div
                      key={child.id}
                      className="child-card clickable"
                      onClick={() => navigate(`/parent/sessions/${child.id}`)}
                    >
                      <div className="child-card-info">
                        <div>
                          <h3>{child.name}</h3>
                          {child.birthDate && (
                            <span className="child-card-meta">
                              ur. {new Date(child.birthDate).toLocaleDateString('pl-PL')}
                            </span>
                          )}
                          <div className="child-assignment-info">
                            {trainer && <span>Trener: {trainer.name}</span>}
                            {group && <span>Grupa: {group.name}</span>}
                          </div>
                        </div>
                        <div className="child-card-status">
                          {unreadSessions > 0 && (
                            <span className="child-status-dot danger">
                              {unreadSessions} nowe
                            </span>
                          )}
                          {unreadProgress > 0 && (
                            <span className="child-status-dot success">
                              {unreadProgress} {pluralPostep(unreadProgress)}
                            </span>
                          )}
                          {pendingCount > 0 && unreadSessions === 0 && (
                            <span className="child-status-dot warning">
                              {pendingCount} do wypełnienia
                            </span>
                          )}
                          {unreadSessions === 0 && unreadProgress === 0 && pendingCount === 0 && (
                            <span className="status-badge done">Aktywne</span>
                          )}
                        </div>
                      </div>
                      <button
                        className="btn-edit-inline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditChildId(child.id);
                          setEditChildName(child.name);
                          setEditChildBirthDate(child.birthDate || '');
                        }}
                        title="Edytuj dane dziecka"
                      >
                        ✏️ Edytuj dane
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nieprzypisane dzieci – czytelny status */}
          {unassignedChildren.length > 0 && (
            <div className="section-block">
              <h3 className="section-label">Oczekujące na przypisanie</h3>
              <div className="children-list">
                {unassignedChildren.map(child => {
                  // Sprawdź czy jest pending request dla tego dziecka
                  const hasPendingRequest = myRequests.some(
                    r => r.childId === child.id && r.status === 'pending'
                  );

                  return (
                    <div key={child.id} className="child-card">
                      <div className="child-card-info">
                        <div>
                          <h3>{child.name}</h3>
                          {child.birthDate && (
                            <span className="child-card-meta">
                              ur. {new Date(child.birthDate).toLocaleDateString('pl-PL')}
                            </span>
                          )}
                        </div>
                        <span className={`status-badge ${hasPendingRequest ? 'draft' : 'pending'}`}>
                          {hasPendingRequest ? 'Oczekuje na akceptację' : 'Brak przypisania'}
                        </span>
                      </div>
                      <button
                        className="btn-edit-inline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditChildId(child.id);
                          setEditChildName(child.name);
                          setEditChildBirthDate(child.birthDate || '');
                        }}
                        title="Edytuj dane dziecka"
                      >
                        ✏️ Edytuj dane
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {myChildren.length === 0 && !showAddChild && (
            <div className="empty-state">
              <p>Nie dodano jeszcze żadnego dziecka.</p>
              <p>Dodaj dziecko, aby móc przypisać je do grupy treningowej.</p>
            </div>
          )}

          {/* Formularz dodawania dziecka */}
          {showAddChild ? (
            <form onSubmit={handleAddChild} className="inline-form">
              <h3 className="section-label">Dodaj dziecko</h3>
              <div className="form-group">
                <label htmlFor="child-name">Imię dziecka</label>
                <input
                  id="child-name"
                  type="text"
                  value={childName}
                  onChange={e => setChildName(e.target.value)}
                  placeholder="np. Jan Nowak"
                  required
                  autoFocus
                />
              </div>
              <DatePickerField
                label="Data urodzenia (opcjonalnie)"
                value={childBirthDate}
                onChange={setChildBirthDate}
              />
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setShowAddChild(false); setChildName(''); setChildBirthDate(''); }}
                >
                  Anuluj
                </button>
                <button type="submit" className="btn-primary" disabled={!childName.trim()}>
                  Dodaj
                </button>
              </div>
            </form>
          ) : (
            <button
              className="btn-primary"
              onClick={() => setShowAddChild(true)}
            >
              + Dodaj dziecko
            </button>
          )}

          {/* Wyszukiwanie trenera */}
          {unassignedChildren.length > 0 && (
            <div className="section-block">
              <h3 className="section-label">Znajdź trenera</h3>
              <p className="section-subtitle">Wyszukaj trenera i wyślij prośbę o dołączenie do grupy.</p>

              {/* Wybierz dziecko */}
              {unassignedChildren.length > 1 && (
                <div className="form-group">
                  <label>Wybierz dziecko</label>
                  <select
                    value={selectedChildForJoin}
                    onChange={e => setSelectedChildForJoin(e.target.value)}
                  >
                    <option value="">-- wybierz --</option>
                    {unassignedChildren.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="search-row">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Wpisz imię trenera..."
                  onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                />
                <button
                  type="button"
                  className="btn-add-cat"
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                >
                  Szukaj
                </button>
              </div>

              {/* Wyniki wyszukiwania */}
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(trainer => (
                    <div key={trainer.id} className="trainer-result">
                      <h4>{trainer.name}</h4>
                      {trainer.groups.length === 0 ? (
                        <p className="search-no-groups">Trener nie ma jeszcze grup.</p>
                      ) : (
                        <div className="group-list">
                          {trainer.groups.map(group => {
                            const childForJoin = unassignedChildren.length === 1
                              ? unassignedChildren[0].id
                              : selectedChildForJoin;
                            const alreadyRequested = myRequests.some(r =>
                              r.childId === childForJoin &&
                              r.groupId === group.id &&
                              (r.status === 'pending' || r.status === 'accepted')
                            );

                            return (
                              <div key={group.id} className="group-item">
                                <span className="group-name">{group.name}</span>
                                {alreadyRequested ? (
                                  <span className="status-badge draft">Wysłano</span>
                                ) : (
                                  <button
                                    className="btn-join"
                                    onClick={() => handleSendRequest(trainer.id, group.id)}
                                    disabled={!childForJoin}
                                  >
                                    Dołącz
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <p className="empty-state">
                  Nie znaleziono trenera o tej nazwie.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* === TAB: PROŚBY === */}
      {tab === 'requests' && (
        <>
          {myRequests.length === 0 ? (
            <div className="empty-state">
              Nie wysłano jeszcze żadnych próśb o dołączenie.
            </div>
          ) : (
            <div className="requests-list">
              {myRequests.map(req => {
                const child = myChildren.find(c => c.id === req.childId);
                const group = getGroupById(req.groupId);

                return (
                  <div key={req.id} className="request-card">
                    <div className="request-card-header">
                      <div>
                        <strong>{child?.name || 'Dziecko'}</strong>
                        <span className="request-card-arrow"> → </span>
                        <span>{group?.name || 'Grupa'}</span>
                      </div>
                      <span className={`status-badge ${
                        req.status === 'pending' ? 'pending' :
                        req.status === 'accepted' ? 'done' : 'rejected'
                      }`}>
                        {req.status === 'pending' && 'Oczekuje'}
                        {req.status === 'accepted' && 'Zaakceptowana'}
                        {req.status === 'rejected' && 'Odrzucona'}
                      </span>
                    </div>
                    <div className="request-card-date">
                      {new Date(req.createdAt).toLocaleDateString('pl-PL')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {/* === MODAL: Edycja danych dziecka === */}
      {editChildId && (
        <EditModal
          title="Edytuj dane dziecka"
          canSave={editChildName.trim().length > 0}
          onSave={() => {
            updateChild(editChildId, {
              name: editChildName.trim(),
              birthDate: editChildBirthDate || undefined,
            });
            setEditChildId(null);
          }}
          onCancel={() => setEditChildId(null)}
        >
          <div className="form-group">
            <label>Imię i nazwisko</label>
            <input
              type="text"
              value={editChildName}
              onChange={e => setEditChildName(e.target.value)}
              placeholder="Imię i nazwisko dziecka"
              autoFocus
            />
          </div>
          <DatePickerField
            label="Data urodzenia"
            value={editChildBirthDate}
            onChange={setEditChildBirthDate}
          />
        </EditModal>
      )}
    </div>
  );
};

export default ParentDashboard;
