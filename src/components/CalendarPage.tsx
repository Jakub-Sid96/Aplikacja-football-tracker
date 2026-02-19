import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useApp } from '../AppContext';
import { CalendarEvent } from '../types';
import ConfirmModal from './ConfirmModal';
import TimePickerField from './ui/TimePicker';

// ============================================================
// CalendarPage – kalendarz treningów/meczów dla grupy.
//
// Trener: dodaje, edytuje, usuwa wydarzenia.
// Rodzic: widok read-only (dostęp przez childId → groupId).
//
// URL trenera:  /trainer/group/:groupId/calendar
// URL rodzica:  /parent/calendar/:childId
// ============================================================

const WEEKDAYS = ['Pn', 'Wt', 'Sr', 'Cz', 'Pt', 'Sb', 'Nd'];

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Mon=0 ... Sun=6
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function toLocaleDatePL(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

const CalendarPage: React.FC = () => {
  const { groupId, childId } = useParams<{ groupId?: string; childId?: string }>();
  const { currentUser } = useAuth();
  const {
    getGroupById,
    getChildById,
    getCalendarEventsForGroup,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
  } = useApp();
  const navigate = useNavigate();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Detail modal (read-only list of events for a day)
  const [detailDate, setDetailDate] = useState<string | null>(null);

  // Resolve data (all computed before any early return)
  const isTrainer = currentUser?.role === 'trainer';
  const child = !isTrainer && childId ? getChildById(childId) : undefined;
  const resolvedGroupId = isTrainer ? groupId : child?.groupId;
  const group = resolvedGroupId ? getGroupById(resolvedGroupId) : undefined;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allEvents = useMemo(
    () => resolvedGroupId ? getCalendarEventsForGroup(resolvedGroupId) : [],
    [resolvedGroupId, getCalendarEventsForGroup]
  );

  // Events indexed by date — always called (hooks must be unconditional)
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    allEvents.forEach(ev => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [allEvents]);

  // Events for selected month (for list below calendar)
  const monthEvents = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    return allEvents.filter(e => e.date.startsWith(prefix));
  }, [allEvents, viewYear, viewMonth]);

  // === Early returns after all hooks ===
  if (!currentUser) return null;

  if (!isTrainer && childId) {
    if (!child || child.parentId !== currentUser.id) {
      return <div className="container"><p>Nie znaleziono zawodnika.</p></div>;
    }
  }

  if (!resolvedGroupId || !group) {
    return <div className="container"><p>Nie znaleziono grupy.</p></div>;
  }

  if (isTrainer && group.trainerId !== currentUser.id) {
    return <div className="container"><p>Brak dostepu.</p></div>;
  }

  // Calendar grid computations
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // === TRAINER: open modal ===
  const handleDayClick = (dateKey: string) => {
    const dayEvents = eventsByDate[dateKey] || [];

    if (isTrainer) {
      if (dayEvents.length === 1) {
        const ev = dayEvents[0];
        setEditingEvent(ev);
        setFormTitle(ev.title);
        setFormTime(ev.time);
        setFormLocation(ev.location);
        setModalDate(dateKey);
        setModalOpen(true);
      } else if (dayEvents.length > 1) {
        setDetailDate(dateKey);
      } else {
        setEditingEvent(null);
        setFormTitle('');
        setFormTime('');
        setFormLocation('');
        setModalDate(dateKey);
        setModalOpen(true);
      }
    } else {
      if (dayEvents.length > 0) {
        setDetailDate(dateKey);
      }
    }
  };

  const handleTrainerEditFromDetail = (ev: CalendarEvent) => {
    setDetailDate(null);
    setEditingEvent(ev);
    setFormTitle(ev.title);
    setFormTime(ev.time);
    setFormLocation(ev.location);
    setModalDate(ev.date);
    setModalOpen(true);
  };

  const handleTrainerNewFromDetail = (dateKey: string) => {
    setDetailDate(null);
    setEditingEvent(null);
    setFormTitle('');
    setFormTime('');
    setFormLocation('');
    setModalDate(dateKey);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formTime.trim() || !formLocation.trim()) return;

    const now = new Date().toISOString();

    if (editingEvent) {
      updateCalendarEvent({
        ...editingEvent,
        title: formTitle.trim(),
        time: formTime,
        location: formLocation.trim(),
        updatedAt: now,
      });
    } else {
      addCalendarEvent({
        id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        groupId: resolvedGroupId,
        title: formTitle.trim(),
        date: modalDate,
        time: formTime,
        location: formLocation.trim(),
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
      });
    }

    setModalOpen(false);
    setEditingEvent(null);
  };

  const handleDelete = () => {
    if (editingEvent) {
      setDeleteConfirmId(editingEvent.id);
    }
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteCalendarEvent(deleteConfirmId);
      setDeleteConfirmId(null);
      setModalOpen(false);
      setEditingEvent(null);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
    setFormTitle('');
    setFormTime('');
    setFormLocation('');
  };

  const backUrl = isTrainer
    ? `/trainer/group/${resolvedGroupId}`
    : `/parent/sessions/${childId}`;

  const backLabel = isTrainer
    ? `← Powrót do ${group.name}`
    : `← Powrót do ${child?.name || 'zawodnika'}`;

  // Build calendar cells
  const calendarCells: { day: number; dateKey: string; isCurrentMonth: boolean }[] = [];
  const prevMonthDays = getDaysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1
  );
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    calendarCells.push({ day: d, dateKey: formatDateKey(y, m, d), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, dateKey: formatDateKey(viewYear, viewMonth, d), isCurrentMonth: true });
  }
  const remaining = 7 - (calendarCells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      calendarCells.push({ day: d, dateKey: formatDateKey(y, m, d), isCurrentMonth: false });
    }
  }

  return (
    <div className="container">
      <button className="btn-back" onClick={() => navigate(backUrl)}>
        {backLabel}
      </button>

      <div className="cal-page-header">
        <h2>Kalendarz — {group.name}</h2>
      </div>

      {/* === CALENDAR GRID === */}
      <div className="cal-widget">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={prevMonth} type="button">‹</button>
          <span className="cal-month-label">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button className="cal-nav-btn" onClick={nextMonth} type="button">›</button>
        </div>

        <div className="cal-weekdays">
          {WEEKDAYS.map(w => (
            <span key={w} className="cal-weekday">{w}</span>
          ))}
        </div>

        <div className="cal-grid">
          {calendarCells.map((cell, i) => {
            const hasEvents = (eventsByDate[cell.dateKey] || []).length > 0;
            const isToday = cell.dateKey === todayKey;

            return (
              <button
                key={i}
                type="button"
                className={[
                  'cal-day',
                  !cell.isCurrentMonth && 'cal-day--outside',
                  isToday && 'cal-day--today',
                  hasEvents && 'cal-day--has-events',
                ].filter(Boolean).join(' ')}
                onClick={() => handleDayClick(cell.dateKey)}
              >
                <span className="cal-day-number">{cell.day}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* === EVENTS LIST FOR MONTH === */}
      <div className="cal-month-events">
        <h3 className="section-label">
          Wydarzenia — {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>
        {monthEvents.length === 0 ? (
          <p className="empty-state" style={{ padding: '1.5rem 0' }}>
            Brak zaplanowanych wydarzen w tym miesiacu.
          </p>
        ) : (
          <div className="cal-events-list">
            {monthEvents.map(ev => (
              <div
                key={ev.id}
                className={`cal-event-card ${isTrainer ? 'clickable' : ''}`}
                onClick={() => {
                  if (isTrainer) handleTrainerEditFromDetail(ev);
                }}
              >
                <div className="cal-event-card-left">
                  <span className="cal-event-day">
                    {new Date(ev.date + 'T00:00:00').getDate()}
                  </span>
                  <span className="cal-event-weekday">
                    {WEEKDAYS[(() => { const d = new Date(ev.date + 'T00:00:00').getDay(); return d === 0 ? 6 : d - 1; })()]}
                  </span>
                </div>
                <div className="cal-event-card-right">
                  <span className="cal-event-title">{ev.title}</span>
                  <span className="cal-event-info">{ev.time} · {ev.location}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === DETAIL MODAL (multiple events on a day) === */}
      {detailDate && (
        <div className="confirm-backdrop" onClick={() => setDetailDate(null)}>
          <div className="confirm-modal cal-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h3 className="confirm-title">{toLocaleDatePL(detailDate)}</h3>
              <button
                type="button"
                className="cal-modal-close"
                onClick={() => setDetailDate(null)}
              >
                ×
              </button>
            </div>
            <div className="cal-detail-list">
              {(eventsByDate[detailDate] || []).map(ev => (
                <div
                  key={ev.id}
                  className={`cal-detail-item ${isTrainer ? 'clickable' : ''}`}
                  onClick={() => {
                    if (isTrainer) handleTrainerEditFromDetail(ev);
                  }}
                >
                  <div className="cal-detail-title">{ev.title}</div>
                  <div className="cal-detail-info">
                    <span>{ev.time}</span>
                    <span className="meta-dot">·</span>
                    <span>{ev.location}</span>
                  </div>
                </div>
              ))}
            </div>
            {isTrainer && (
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: '0.75rem' }}
                onClick={() => handleTrainerNewFromDetail(detailDate)}
              >
                + Dodaj kolejne wydarzenie
              </button>
            )}
          </div>
        </div>
      )}

      {/* === EVENT FORM MODAL (trainer only) === */}
      {modalOpen && isTrainer && (
        <div className="confirm-backdrop" onClick={closeModal}>
          <div className="confirm-modal cal-form-modal" onClick={e => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h3 className="confirm-title">
                {editingEvent ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
              </h3>
              <button type="button" className="cal-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <p className="cal-modal-date">{toLocaleDatePL(modalDate)}</p>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="cal-title">Tytul wydarzenia</label>
                <input
                  id="cal-title"
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="np. Trening, Mecz, Sparring"
                  required
                  autoFocus
                />
              </div>
              <TimePickerField
                label="Godzina"
                value={formTime}
                onChange={setFormTime}
                required
              />
              <div className="form-group">
                <label htmlFor="cal-location">Miejsce</label>
                <input
                  id="cal-location"
                  type="text"
                  value={formLocation}
                  onChange={e => setFormLocation(e.target.value)}
                  placeholder="np. Orlik Bemowo, Stadion Legii"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!formTitle.trim() || !formTime.trim() || !formLocation.trim()}
                >
                  Zapisz
                </button>
              </div>
            </form>

            {editingEvent && (
              <button
                type="button"
                className="btn-delete-event"
                onClick={handleDelete}
              >
                Usun wydarzenie
              </button>
            )}
          </div>
        </div>
      )}

      {/* === DELETE CONFIRM === */}
      {deleteConfirmId && (
        <ConfirmModal
          title="Usun wydarzenie"
          message="Czy na pewno chcesz usunac to wydarzenie? Tej operacji nie mozna cofnac."
          confirmLabel="Usun"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
};

export default CalendarPage;
