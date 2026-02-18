import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useApp } from '../AppContext';
import { Category } from '../types';
import DatePickerField from './ui/DatePicker';

// ============================================================
// SessionBuilder – trener tworzy raport postępów.
//
// Kluczowa zmiana: groupId pochodzi z URL (kontekst grupy).
// Trener NIE wybiera grupy – jest ona ustalona przez to,
// z jakiej grupy kliknął "+ Nowy raport postępów".
// ============================================================

const SessionBuilder: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { currentUser } = useAuth();
  const { addSession, getGroupById } = useApp();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'counter' | 'text'>('counter');

  if (!currentUser || !groupId) return null;

  const group = getGroupById(groupId);
  if (!group || group.trainerId !== currentUser.id) {
    return <div className="container"><p>Nie znaleziono grupy.</p></div>;
  }

  const backUrl = `/trainer/group/${groupId}`;

  const addCategory = () => {
    if (!newCatName.trim()) return;
    setCategories(prev => [
      ...prev,
      {
        id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: newCatName.trim(),
        type: newCatType,
      },
    ]);
    setNewCatName('');
  };

  const removeCategory = (catId: string) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || categories.length === 0) return;

    addSession({
      id: `session-${Date.now()}`,
      title: title.trim(),
      date,
      categories,
      trainerId: currentUser.id,
      groupId,  // Raport postępów należy do grupy
    });

    navigate(backUrl);
  };

  const canSubmit = title.trim() && categories.length > 0;

  return (
    <div className="container">
      <button className="btn-back" onClick={() => navigate(backUrl)}>
        ← Powrót do {group.name}
      </button>

      <h2>Nowy raport postępów</h2>
      <p className="section-subtitle">
        Grupa: <strong>{group.name}</strong> – kategorie, które rodzic wypełni po treningu lub meczu.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="session-title">Tytuł</label>
          <input
            id="session-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="np. Mecz z Górnikiem Libiąż"
            required
          />
        </div>

        <DatePickerField label="Data" value={date} onChange={setDate} required />

        <div className="form-group">
          <label>Dodaj kategorię obserwacji</label>
          <div className="category-add-row">
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Nazwa kategorii"
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addCategory(); }
              }}
            />
            <select
              value={newCatType}
              onChange={e => setNewCatType(e.target.value as 'counter' | 'text')}
            >
              <option value="counter">Licznik (+1)</option>
              <option value="text">Opis tekstowy</option>
            </select>
            <button
              type="button"
              className="btn-add-cat"
              onClick={addCategory}
              disabled={!newCatName.trim()}
            >
              Dodaj
            </button>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="form-group">
            <label>Kategorie ({categories.length})</label>
            <div className="categories-list">
              {categories.map((cat, index) => (
                <div key={cat.id} className="category-item">
                  <span className="category-index">{index + 1}.</span>
                  <span className="category-name">{cat.name}</span>
                  <span className={`category-type-badge ${cat.type}`}>
                    {cat.type === 'counter' ? 'Licznik' : 'Tekst'}
                  </span>
                  <button
                    type="button"
                    className="category-remove"
                    onClick={() => removeCategory(cat.id)}
                    aria-label={`Usuń ${cat.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div className="form-group">
            <label>Podgląd formularza rodzica</label>
            <div className="session-preview">
              <div className="preview-title">{title || 'Tytuł raportu postępów'}</div>
              {categories.map(cat => (
                <div key={cat.id} className="preview-field">
                  <span className="preview-field-name">{cat.name}</span>
                  {cat.type === 'counter' ? (
                    <div className="preview-counter">
                      <span className="preview-counter-btn">−</span>
                      <span>0</span>
                      <span className="preview-counter-btn">+</span>
                    </div>
                  ) : (
                    <div className="preview-textarea">Pole tekstowe...</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={!canSubmit}>
          Zapisz raport postępów
        </button>

        {!canSubmit && (
          <p className="form-hint">Dodaj tytuł i co najmniej jedną kategorię.</p>
        )}
      </form>
    </div>
  );
};

export default SessionBuilder;
