import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Child, Group, JoinRequest, Session, Report, Notification, ProgressEntry, CalendarEvent, EventAttendance } from './types';
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
const PROGRESS_KEY = 'ft-progress';
const CALENDAR_KEY = 'ft-calendar-events';
const ATTENDANCE_KEY = 'ft-attendance';
const READ_SESSIONS_KEY = 'ft-read-sessions';
const READ_PROGRESS_KEY = 'ft-read-progress';

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
  progressEntries: ProgressEntry[];

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

  // Postępy zawodnika
  addProgressEntry: (entry: ProgressEntry) => void;
  getProgressEntriesForChild: (childId: string) => ProgressEntry[];

  // Śledzenie odczytów (rodzic)
  markSessionsRead: (childId: string, sessionIds: string[]) => void;
  isSessionRead: (childId: string, sessionId: string) => boolean;
  getUnreadSessionCount: (childId: string, groupId: string) => number;
  markProgressRead: (childId: string, progressIds: string[]) => void;
  isProgressRead: (childId: string, progressId: string) => boolean;
  getUnreadProgressCount: (childId: string) => number;

  // Kalendarz
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (event: CalendarEvent) => void;
  deleteCalendarEvent: (eventId: string) => void;
  getCalendarEventsForGroup: (groupId: string) => CalendarEvent[];

  // Obecność
  attendance: EventAttendance[];
  saveAttendance: (eventId: string, records: Record<string, 'PRESENT' | 'ABSENT' | null>, trainerId: string) => void;
  getAttendanceForEvent: (eventId: string) => Record<string, 'PRESENT' | 'ABSENT'>;
  getAttendanceForChild: (childId: string) => EventAttendance[];

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
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>(() => loadFromStorage(PROGRESS_KEY, []));
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => loadFromStorage(CALENDAR_KEY, []));
  const [attendance, setAttendance] = useState<EventAttendance[]>(() => loadFromStorage(ATTENDANCE_KEY, []));
  // Śledzenie odczytów: Record<childId, string[]> — lista ID sesji/postępów odczytanych
  const [readSessions, setReadSessions] = useState<Record<string, string[]>>(() => loadFromStorage(READ_SESSIONS_KEY, {}));
  const [readProgress, setReadProgress] = useState<Record<string, string[]>>(() => loadFromStorage(READ_PROGRESS_KEY, {}));

  // Persystencja
  useEffect(() => { localStorage.setItem(GROUPS_KEY, JSON.stringify(groups)); }, [groups]);
  useEffect(() => { localStorage.setItem(CHILDREN_KEY, JSON.stringify(children)); }, [children]);
  useEffect(() => { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem(REPORTS_KEY, JSON.stringify(reports)); }, [reports]);
  useEffect(() => { localStorage.setItem(JOIN_REQUESTS_KEY, JSON.stringify(joinRequests)); }, [joinRequests]);
  useEffect(() => { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressEntries)); }, [progressEntries]);
  useEffect(() => { localStorage.setItem(CALENDAR_KEY, JSON.stringify(calendarEvents)); }, [calendarEvents]);
  useEffect(() => { localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem(READ_SESSIONS_KEY, JSON.stringify(readSessions)); }, [readSessions]);
  useEffect(() => { localStorage.setItem(READ_PROGRESS_KEY, JSON.stringify(readProgress)); }, [readProgress]);

  // Migracja: backfill joinedGroupAt dla dzieci już w grupie
  useEffect(() => {
    const needsBackfill = children.filter(c => c.groupId && !c.joinedGroupAt);
    if (needsBackfill.length === 0) return;

    setChildren(prev => prev.map(c => {
      if (!c.groupId || c.joinedGroupAt) return c;

      // Szukaj zaakceptowanego JoinRequest dla tego dziecka w tej grupie
      const acceptedRequest = joinRequests.find(
        r => r.childId === c.id && r.groupId === c.groupId && r.status === 'accepted'
      );

      return {
        ...c,
        joinedGroupAt: acceptedRequest?.createdAt ?? new Date().toISOString(),
      };
    }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    // Usuwamy wydarzenia kalendarza i powiązaną obecność
    setCalendarEvents(prev => {
      const eventIds = prev.filter(e => e.groupId === groupId).map(e => e.id);
      setAttendance(a => a.filter(at => !eventIds.includes(at.eventId)));
      return prev.filter(e => e.groupId !== groupId);
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
      c.id === childId ? { ...c, groupId: undefined, trainerId: undefined, joinedGroupAt: undefined } : c
    ));
  }, []);

  const moveChildToGroup = useCallback((childId: string, newGroupId: string) => {
    const targetGroup = groups.find(g => g.id === newGroupId);
    if (!targetGroup) return;
    setChildren(prev => prev.map(c =>
      c.id === childId ? { ...c, groupId: newGroupId, trainerId: targetGroup.trainerId, joinedGroupAt: new Date().toISOString() } : c
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
            ? { ...c, groupId: r.groupId, trainerId: r.trainerId, joinedGroupAt: new Date().toISOString() }
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
  // Liczy sesje w grupie, dla których dziecko nie ma jeszcze raportu submitted.
  // Uwzględnia joinedGroupAt – sesje sprzed dołączenia do grupy nie są liczone.
  const getPendingSessionsCountForChild = useCallback((childId: string, groupId: string) => {
    const child = children.find(c => c.id === childId);
    const joinedAt = child?.joinedGroupAt;
    const groupSessions = sessions.filter(s =>
      s.groupId === groupId && (!joinedAt || s.date >= joinedAt)
    );
    return groupSessions.filter(s => {
      const report = reports.find(r => r.sessionId === s.id && r.childId === childId);
      return !report || report.status !== 'submitted';
    }).length;
  }, [sessions, reports, children]);

  // === POSTĘPY ZAWODNIKA ===

  const addProgressEntry = useCallback((entry: ProgressEntry) => {
    setProgressEntries(prev => [entry, ...prev]);

    // Powiadomienie dla rodzica
    const child = children.find(c => c.id === entry.childId);
    if (child) {
      const periodLabel = entry.period === 'week' ? 'tydzień' : 'miesiąc';
      const notification: Notification = {
        id: `notif-${Date.now()}-prog`,
        userId: child.parentId,
        message: `Trener dodał nowe postępy dla ${child.name} (okres: ${periodLabel})`,
        read: false,
        createdAt: new Date().toISOString(),
        actionType: 'progress_entry',
        actionId: entry.id,
      };
      setNotifications(prev => [notification, ...prev]);
    }
  }, [children]);

  const getProgressEntriesForChild = useCallback((childId: string) => {
    return progressEntries
      .filter(e => e.childId === childId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [progressEntries]);

  // === ŚLEDZENIE ODCZYTÓW (RODZIC) ===

  const markSessionsRead = useCallback((childId: string, sessionIds: string[]) => {
    setReadSessions(prev => {
      const existing = new Set(prev[childId] || []);
      sessionIds.forEach(id => existing.add(id));
      return { ...prev, [childId]: Array.from(existing) };
    });
  }, []);

  const isSessionRead = useCallback((childId: string, sessionId: string) => {
    return (readSessions[childId] || []).includes(sessionId);
  }, [readSessions]);

  const getUnreadSessionCount = useCallback((childId: string, groupId: string) => {
    const child = children.find(c => c.id === childId);
    const joinedAt = child?.joinedGroupAt;
    const groupSessions = sessions.filter(s =>
      s.groupId === groupId && (!joinedAt || s.date >= joinedAt)
    );
    const readSet = new Set(readSessions[childId] || []);
    return groupSessions.filter(s => !readSet.has(s.id)).length;
  }, [sessions, readSessions, children]);

  const markProgressRead = useCallback((childId: string, progressIds: string[]) => {
    setReadProgress(prev => {
      const existing = new Set(prev[childId] || []);
      progressIds.forEach(id => existing.add(id));
      return { ...prev, [childId]: Array.from(existing) };
    });
  }, []);

  const isProgressRead = useCallback((childId: string, progressId: string) => {
    return (readProgress[childId] || []).includes(progressId);
  }, [readProgress]);

  const getUnreadProgressCount = useCallback((childId: string) => {
    const entries = progressEntries.filter(e => e.childId === childId);
    const readSet = new Set(readProgress[childId] || []);
    return entries.filter(e => !readSet.has(e.id)).length;
  }, [progressEntries, readProgress]);

  // === KALENDARZ ===

  const addCalendarEvent = useCallback((event: CalendarEvent) => {
    setCalendarEvents(prev => [event, ...prev]);
  }, []);

  const updateCalendarEvent = useCallback((updated: CalendarEvent) => {
    setCalendarEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
  }, []);

  const deleteCalendarEvent = useCallback((eventId: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== eventId));
    setAttendance(prev => prev.filter(a => a.eventId !== eventId));
  }, []);

  const getCalendarEventsForGroup = useCallback((groupId: string) => {
    return calendarEvents
      .filter(e => e.groupId === groupId)
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
  }, [calendarEvents]);

  // === OBECNOŚĆ ===

  const saveAttendance = useCallback((eventId: string, records: Record<string, 'PRESENT' | 'ABSENT' | null>, trainerId: string) => {
    setAttendance(prev => {
      // Usuń stare wpisy dla tego wydarzenia
      const withoutEvent = prev.filter(a => a.eventId !== eventId);
      // Dodaj nowe wpisy
      const newEntries: EventAttendance[] = [];
      for (const [childId, status] of Object.entries(records)) {
        if (status) {
          newEntries.push({
            id: `att-${eventId}-${childId}`,
            eventId,
            childId,
            status,
            markedBy: trainerId,
            markedAt: new Date().toISOString(),
          });
        }
      }
      return [...withoutEvent, ...newEntries];
    });
  }, []);

  const getAttendanceForEvent = useCallback((eventId: string): Record<string, 'PRESENT' | 'ABSENT'> => {
    const map: Record<string, 'PRESENT' | 'ABSENT'> = {};
    attendance.filter(a => a.eventId === eventId).forEach(a => {
      map[a.childId] = a.status;
    });
    return map;
  }, [attendance]);

  const getAttendanceForChild = useCallback((childId: string): EventAttendance[] => {
    return attendance.filter(a => a.childId === childId);
  }, [attendance]);

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
    groups, children, sessions, reports, joinRequests, notifications, progressEntries, calendarEvents,
    addGroup, updateGroup, deleteGroup, getGroupsForTrainer, getGroupById,
    addChild, updateChild, removeChildFromGroup, moveChildToGroup, getChildrenForParent, getChildrenForTrainer, getChildrenForGroup, getChildById,
    sendJoinRequest, acceptJoinRequest, rejectJoinRequest,
    getJoinRequestsForTrainer, getJoinRequestsForParent, getPendingRequestsCount,
    addSession, updateSessionTitle, deleteSession, getSessionsForGroup, getSessionsForTrainer, getSessionById,
    addReport, updateReport, submitReport,
    getReportForSessionAndChild, getSubmittedReportsForSession, getSubmittedReportsForChild,
    addNotification, markNotificationRead, getUnreadNotifications, getNotificationsForUser,
    getPendingSessionsCountForChild,
    addProgressEntry, getProgressEntriesForChild,
    markSessionsRead, isSessionRead, getUnreadSessionCount,
    markProgressRead, isProgressRead, getUnreadProgressCount,
    addCalendarEvent, updateCalendarEvent, deleteCalendarEvent, getCalendarEventsForGroup,
    attendance, saveAttendance, getAttendanceForEvent, getAttendanceForChild,
    searchTrainers,
  };

  return <AppContext.Provider value={value}>{reactChildren}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
