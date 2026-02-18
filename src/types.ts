// === MODEL DANYCH ===
// Architektura: Trener → Grupy → (Raporty postępów + Zawodnicy)
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
// Raporty postępów i zawodnicy należą do grupy, nie bezpośrednio do trenera.
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

// Raport postępów – kluczowa zmiana: należy do GRUPY (groupId),
// nie bezpośrednio do trenera. Trener tworzy raport postępów w kontekście grupy.
// Widoczna tylko dla rodziców dzieci z tej grupy.
export interface Session {
  id: string;
  title: string;
  date: string;
  categories: Category[];
  trainerId: string;
  groupId: string;  // NOWE: raport postępów przypisany do grupy
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

// Powiadomienie.
export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionType?: 'join_request';
  actionId?: string;
}
