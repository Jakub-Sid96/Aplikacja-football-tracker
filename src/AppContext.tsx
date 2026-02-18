import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Child, Group, JoinRequest, Session, Report, Notification } from './types';
import { useAuth } from './AuthContext';

// ============================================================
// AppContext – główny stan aplikacji.
//
// Architektura per-grupa:
// - Sesje należą do grup (Session.groupId), nie do trenerów bezpośrednio
// - Dzieci należą do grup po akceptacji JoinRequest
// - Trener pracuje zawsze w kontekście grupy
// - Rodzic widzi sesje z grupy swojego dziecka
// ============================================================

const SESSIONS_KEY = 'ft-sessions';
const REPORTS_KEY = 'ft-reports';
const GROUPS_KEY = 'ft-groups';
const CHILDREN_KEY = 'ft-children';
const JOIN_REQUESTS_KEY = 'ft-join-requests';
const NOTIFICATIONS_KEY = 'ft-notifications';

function loadFromStorage<T>(key: string, fallback: T): T {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  return fallback;
}

interface AppState {
  // Dane
  groups: Group[];
  children: Child[];
  sessions: Session[];
  reports: Report[];
  joinRequests: JoinRequest[];
  notifications: Notification[];

  // Grupy
  addGroup: (group: Group) => void;
  updateGroup: (groupId: string, data: { name: string }) => void;
  deleteGroup: (groupId: string) => void;
  getGroupsForTrainer: (trainerId: string) => Group[];
  getGroupById: (groupId: string) => Group | undefined;

  // Dzieci
  addChild: (child: Child) => void;
  updateChild: (childId: string, data: { name: string; birthDate?: string }) => void;
  removeChildFromGroup: (childId: string) => void;
  moveChildToGroup: (childId: string, newGroupId: string) => void;
  getChildrenForParent: (parentId: string) => Child[];
  getChildrenForTrainer: (trainerId: string) => Child[];
  getChildrenForGroup: (groupId: string) => Child[];
  getChildById: (childId: string) => Child | undefined;

  // Join requests
  sendJoinRequest: (request: JoinRequest) => void;
  acceptJoinRequest: (requestId: string) => void;
  rejectJoinRequest: (requestId: string) => void;
  getJoinRequestsForTrainer: (trainerId: string) => JoinRequest[];
  getJoinRequestsForParent: (parentId: string) => JoinRequest[];
  getPendingRequestsCount: (trainerId: string) => number;

  // Sesje – per grupa
  addSession: (session: Session) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  getSessionsForGroup: (groupId: string) => Session[];
  getSessionsForTrainer: (trainerId: string) => Session[];
  getSessionById: (sessionId: string) => Session | undefined;

  // Raporty
  addReport: (report: Report) => void;
  updateReport: (report: Report) => void;
  submitReport: (reportId: string) => void;
  getReportForSessionAndChild: (sessionId: string, childId: string) => Report | undefined;
  getSubmittedReportsForSession: (sessionId: string) => Report[];
  getSubmittedReportsForChild: (childId: string) => Report[];

  // Powiadomienia
  addNotification: (notification: Notification) => void;
  markNotificationRead: (notificationId: string) => void;
  getUnreadNotifications: (userId: string) => Notification[];
  getNotificationsForUser: (userId: string) => Notification[];

  // Niewypełnione sesje dziecka (bez raportu lub draft)
  getPendingSessionsCountForChild: (childId: string, groupId: string) => number;

  // Wyszukiwanie trenerów
  searchTrainers: (query: string) => { id: string; name: string; groups: Group[] }[];
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const { allUsers } = useAuth();

  const [groups, setGroups] = useState<Group[]>(() => loadFromStorage(GROUPS_KEY, []));
  const [children, setChildren] = useState<Child[]>(() => loadFromStorage(CHILDREN_KEY, []));
  const [sessions, setSessions] = useState<Session[]>(() => loadFromStorage(SESSIONS_KEY, []));
  const [reports, setReports] = useState<Report[]>(() => loadFromStorage(REPORTS_KEY, []));
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(() => loadFromStorage(JOIN_REQUESTS_KEY, []));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromStorage(NOTIFICATIONS_KEY, []));

  // Persystencja
  useEffect(() => { localStorage.setItem(GROUPS_KEY, JSON.stringify(groups)); }, [groups]);
  useEffect(() => { localStorage.setItem(CHILDREN_KEY, JSON.stringify(children)); }, [children]);
  useEffect(() => { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem(REPORTS_KEY, JSON.stringify(reports)); }, [reports]);
  useEffect(() => { localStorage.setItem(JOIN_REQUESTS_KEY, JSON.stringify(joinRequests)); }, [joinRequests]);
  useEffect(() => { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications)); }, [notifications]);

  // === GRUPY ===

  const addGroup = useCallback((group: Group) => {
    setGroups(prev => [group, ...prev]);
  }, []);

  const updateGroup = useCallback((groupId: string, data: { name: string }) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: data.name } : g));
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    // Usuwamy sesje przypisane do grupy i ich raporty
    setSessions(prev => {
      const sessionIds = prev.filter(s => s.groupId === groupId).map(s => s.id);
      setReports(r => r.filter(rep => !sessionIds.includes(rep.sessionId)));
      return prev.filter(s => s.groupId !== groupId);
    });
    // Odpinamy dzieci z grupy
    setChildren(prev => prev.map(c =>
      c.groupId === groupId ? { ...c, groupId: undefined, trainerId: undefined } : c
    ));
  }, []);

  const getGroupsForTrainer = useCallback((trainerId: string) => {
    return groups.filter(g => g.trainerId === trainerId);
  }, [groups]);

  const getGroupById = useCallback((groupId: string) => {
    return groups.find(g => g.id === groupId);
  }, [groups]);

  // === DZIECI ===

  const addChild = useCallback((child: Child) => {
    setChildren(prev => [child, ...prev]);
  }, []);

  const updateChild = useCallback((childId: string, data: { name: string; birthDate?: string }) => {
    setChildren(prev => prev.map(c =>
      c.id === childId ? { ...c, name: data.name, birthDate: data.birthDate || undefined } : c
    ));
  }, []);

  const removeChildFromGroup = useCallback((childId: string) => {
    setChildren(prev => prev.map(c =>
      c.id === childId ? { ...c, groupId: undefined, trainerId: undefined } : c
    ));
  }, []);

  const moveChildToGroup = useCallback((childId: string, newGroupId: string) => {
    const targetGroup = groups.find(g => g.id === newGroupId);
    if (!targetGroup) return;
    setChildren(prev => prev.map(c =>
      c.id === childId ? { ...c, groupId: newGroupId, trainerId: targetGroup.trainerId } : c
    ));
  }, [groups]);

  const getChildrenForParent = useCallback((parentId: string) => {
    return children.filter(c => c.parentId === parentId);
  }, [children]);

  const getChildrenForTrainer = useCallback((trainerId: string) => {
    return children.filter(c => c.trainerId === trainerId);
  }, [children]);

  // NOWE: dzieci w konkretnej grupie
  const getChildrenForGroup = useCallback((groupId: string) => {
    return children.filter(c => c.groupId === groupId);
  }, [children]);

  const getChildById = useCallback((childId: string) => {
    return children.find(c => c.id === childId);
  }, [children]);

  // === JOIN REQUESTS ===

  const sendJoinRequest = useCallback((request: JoinRequest) => {
    setJoinRequests(prev => [request, ...prev]);
    // Powiadomienie dla trenera
    const child = children.find(c => c.id === request.childId);
    const group = groups.find(g => g.id === request.groupId);
    if (child && group) {
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        userId: request.trainerId,
        message: `${child.name} chce dołączyć do grupy "${group.name}"`,
        read: false,
        createdAt: new Date().toISOString(),
        actionType: 'join_request',
        actionId: request.id,
      };
      setNotifications(prev => [notification, ...prev]);
    }
  }, [children, groups]);

  const acceptJoinRequest = useCallback((requestId: string) => {
    setJoinRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        setChildren(prevChildren => prevChildren.map(c =>
          c.id === r.childId
            ? { ...c, groupId: r.groupId, trainerId: r.trainerId }
            : c
        ));
        return { ...r, status: 'accepted' as const };
      }
      return r;
    }));
  }, []);

  const rejectJoinRequest = useCallback((requestId: string) => {
    setJoinRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' as const } : r
    ));
  }, []);

  const getJoinRequestsForTrainer = useCallback((trainerId: string) => {
    return joinRequests
      .filter(r => r.trainerId === trainerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [joinRequests]);

  const getJoinRequestsForParent = useCallback((parentId: string) => {
    return joinRequests
      .filter(r => r.parentId === parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [joinRequests]);

  const getPendingRequestsCount = useCallback((trainerId: string) => {
    return joinRequests.filter(r => r.trainerId === trainerId && r.status === 'pending').length;
  }, [joinRequests]);

  // === SESJE ===

  const addSession = useCallback((session: Session) => {
    setSessions(prev => [session, ...prev]);
  }, []);

  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    // Usuwamy powiązane raporty
    setReports(prev => prev.filter(r => r.sessionId !== sessionId));
  }, []);

  // NOWE: sesje per grupa – główny sposób pobierania sesji
  const getSessionsForGroup = useCallback((groupId: string) => {
    return sessions
      .filter(s => s.groupId === groupId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions]);

  // Wszystkie sesje trenera (across all groups)
  const getSessionsForTrainer = useCallback((trainerId: string) => {
    return sessions
      .filter(s => s.trainerId === trainerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions]);

  const getSessionById = useCallback((sessionId: string) => {
    return sessions.find(s => s.id === sessionId);
  }, [sessions]);

  // === RAPORTY ===

  const addReport = useCallback((report: Report) => {
    setReports(prev => [report, ...prev]);
  }, []);

  const updateReport = useCallback((updated: Report) => {
    setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
  }, []);

  const submitReport = useCallback((reportId: string) => {
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? { ...r, status: 'submitted' as const, submittedAt: new Date().toISOString() }
        : r
    ));
  }, []);

  const getReportForSessionAndChild = useCallback((sessionId: string, childId: string) => {
    return reports.find(r => r.sessionId === sessionId && r.childId === childId);
  }, [reports]);

  const getSubmittedReportsForSession = useCallback((sessionId: string) => {
    return reports.filter(r => r.sessionId === sessionId && r.status === 'submitted');
  }, [reports]);

  const getSubmittedReportsForChild = useCallback((childId: string) => {
    return reports
      .filter(r => r.childId === childId && r.status === 'submitted')
      .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());
  }, [reports]);

  // === POWIADOMIENIA ===

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
  }, []);

  const getUnreadNotifications = useCallback((userId: string) => {
    return notifications.filter(n => n.userId === userId && !n.read);
  }, [notifications]);

  const getNotificationsForUser = useCallback((userId: string) => {
    return notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications]);

  // === NIEWYPEŁNIONE SESJE DZIECKA ===
  // Liczy sesje w grupie, dla których dziecko nie ma jeszcze raportu submitted
  const getPendingSessionsCountForChild = useCallback((childId: string, groupId: string) => {
    const groupSessions = sessions.filter(s => s.groupId === groupId);
    return groupSessions.filter(s => {
      const report = reports.find(r => r.sessionId === s.id && r.childId === childId);
      return !report || report.status !== 'submitted';
    }).length;
  }, [sessions, reports]);

  // === WYSZUKIWANIE TRENERÓW ===
  const searchTrainers = useCallback((query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const trainers = allUsers.filter(u =>
      u.role === 'trainer' && u.name.toLowerCase().includes(q)
    );

    return trainers.map(t => ({
      id: t.id,
      name: t.name,
      groups: groups.filter(g => g.trainerId === t.id),
    }));
  }, [allUsers, groups]);

  const value: AppState = {
    groups, children, sessions, reports, joinRequests, notifications,
    addGroup, updateGroup, deleteGroup, getGroupsForTrainer, getGroupById,
    addChild, updateChild, removeChildFromGroup, moveChildToGroup, getChildrenForParent, getChildrenForTrainer, getChildrenForGroup, getChildById,
    sendJoinRequest, acceptJoinRequest, rejectJoinRequest,
    getJoinRequestsForTrainer, getJoinRequestsForParent, getPendingRequestsCount,
    addSession, updateSessionTitle, deleteSession, getSessionsForGroup, getSessionsForTrainer, getSessionById,
    addReport, updateReport, submitReport,
    getReportForSessionAndChild, getSubmittedReportsForSession, getSubmittedReportsForChild,
    addNotification, markNotificationRead, getUnreadNotifications, getNotificationsForUser,
    getPendingSessionsCountForChild,
    searchTrainers,
  };

  return <AppContext.Provider value={value}>{reactChildren}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
