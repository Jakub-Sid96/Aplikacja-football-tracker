// === MODEL DANYCH ===
// Architektura: Trener → Grupy → (Raporty meczowe/treningowe + Zawodnicy)
// Wszystko jest per-grupa. Trener pracuje zawsze w kontekście grupy.

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export type UserRole = 'parent' | 'trainer';

// Grupa treningowa – centralny punkt organizacji.
// Raporty meczowe/treningowe i zawodnicy należą do grupy, nie bezpośrednio do trenera.
export interface Group {
  id: string;
  name: string;
  trainerId: string;
}

// Dziecko – przypisywane do grupy (i pośrednio do trenera) po akceptacji JoinRequest.
export interface Child {
  id: string;
  name: string;
  birthDate?: string;
  parentId: string;
  groupId?: string;
  trainerId?: string;
  joinedGroupAt?: string;  // ISO timestamp dołączenia do bieżącej grupy
}

// Prośba o dołączenie dziecka do grupy.
export interface JoinRequest {
  id: string;
  childId: string;
  groupId: string;
  trainerId: string;
  parentId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// Kategoria obserwacji w jednostce.
export interface Category {
  id: string;
  name: string;
  type: 'counter' | 'text';
}

// Raport meczowy/treningowy – kluczowa zmiana: należy do GRUPY (groupId),
// nie bezpośrednio do trenera. Trener tworzy raport meczowy/treningowy w kontekście grupy.
// Widoczna tylko dla rodziców dzieci z tej grupy.
export interface Session {
  id: string;
  title: string;
  date: string;
  categories: Category[];
  trainerId: string;
  groupId: string;  // NOWE: raport meczowy/treningowy przypisany do grupy
}

// Raport rodzica – bez zmian w strukturze.
export interface Report {
  id: string;
  sessionId: string;
  childId: string;
  parentId: string;
  status: 'draft' | 'submitted';
  values: Record<string, number | string>;
  updatedAt: string;
  submittedAt?: string;
}

// Wpis postępów zawodnika – tworzony przez trenera dla konkretnego dziecka.
export interface ProgressEntry {
  id: string;
  childId: string;
  groupId: string;
  trainerId: string;
  period: 'week' | 'month';
  description: string;
  createdAt: string;
}

// Wydarzenie kalendarzowe – przypisane do grupy, tworzone przez trenera.
export interface CalendarEvent {
  id: string;
  groupId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  createdBy: string; // trainerId
  createdAt: string;
  updatedAt: string;
}

// Obecność zawodnika na wydarzeniu.
export interface EventAttendance {
  id: string;
  eventId: string;
  childId: string;
  status: 'PRESENT' | 'ABSENT';
  markedBy: string; // trainerId
  markedAt: string; // ISO timestamp
}

// Powiadomienie.
export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionType?: 'join_request' | 'progress_entry';
  actionId?: string;
}
