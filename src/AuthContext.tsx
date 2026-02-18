import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from './types';

// ============================================================
// AuthContext – zarządzanie autentykacją użytkowników.
//
// Decyzje:
// - localStorage jako "baza" użytkowników (demo/prototyp)
// - Proste hashowanie hasła (w produkcji: backend + bcrypt)
// - Sesja zapisana w localStorage – przetrwa odświeżenie
// - Po rejestracji automatyczne logowanie
// ============================================================

const USERS_KEY = 'ft-users';
const SESSION_KEY = 'ft-session';

// Proste hashowanie do demo – NIE do produkcji
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'hash_' + Math.abs(hash).toString(36);
}

function loadUsers(): User[] {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) return JSON.parse(stored);
  return [];
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession(): User | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) return JSON.parse(stored);
  return null;
}

function saveSession(user: User | null) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

interface AuthState {
  currentUser: User | null;
  register: (name: string, email: string, password: string, role: UserRole) => { success: boolean; error?: string };
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  allUsers: User[];
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadSession());
  const [users, setUsers] = useState<User[]>(() => loadUsers());

  const register = useCallback((name: string, email: string, password: string, role: UserRole) => {
    const existingUsers = loadUsers();
    const emailLower = email.toLowerCase().trim();

    if (existingUsers.find(u => u.email.toLowerCase() === emailLower)) {
      return { success: false, error: 'Konto z tym adresem email już istnieje.' };
    }

    if (password.length < 4) {
      return { success: false, error: 'Hasło musi mieć co najmniej 4 znaki.' };
    }

    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role,
      name: name.trim(),
      email: emailLower,
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...existingUsers, newUser];
    saveUsers(updatedUsers);
    saveSession(newUser);
    setUsers(updatedUsers);
    setCurrentUser(newUser);

    return { success: true };
  }, []);

  const login = useCallback((email: string, password: string) => {
    const existingUsers = loadUsers();
    const emailLower = email.toLowerCase().trim();
    const user = existingUsers.find(u => u.email.toLowerCase() === emailLower);

    if (!user) {
      return { success: false, error: 'Nie znaleziono konta z tym adresem email.' };
    }

    if (user.passwordHash !== simpleHash(password)) {
      return { success: false, error: 'Nieprawidłowe hasło.' };
    }

    saveSession(user);
    setCurrentUser(user);
    setUsers(existingUsers);

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    saveSession(null);
    setCurrentUser(null);
  }, []);

  const value: AuthState = {
    currentUser,
    register,
    login,
    logout,
    allUsers: users,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
