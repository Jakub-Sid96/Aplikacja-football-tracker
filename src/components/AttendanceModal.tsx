import React, { useState, useEffect } from 'react';
import { CalendarEvent, Child } from '../types';
import { useApp } from '../AppContext';
import { useAuth } from '../AuthContext';

interface Props {
  event: CalendarEvent;
  onClose: () => void;
}

function toLocaleDatePL(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

const AttendanceModal: React.FC<Props> = ({ event, onClose }) => {
  const { currentUser } = useAuth();
  const { getChildrenForGroup, getAttendanceForEvent, saveAttendance } = useApp();

  const players = getChildrenForGroup(event.groupId);
  const [records, setRecords] = useState<Record<string, 'PRESENT' | 'ABSENT' | null>>({});

  useEffect(() => {
    const existing = getAttendanceForEvent(event.id);
    const initial: Record<string, 'PRESENT' | 'ABSENT' | null> = {};
    players.forEach(p => {
      initial[p.id] = existing[p.id] || null;
    });
    setRecords(initial);
  }, [event.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (childId: string, status: 'PRESENT' | 'ABSENT') => {
    setRecords(prev => ({
      ...prev,
      [childId]: prev[childId] === status ? null : status,
    }));
  };

  const handleSave = () => {
    if (!currentUser) return;
    saveAttendance(event.id, records, currentUser.id);
    onClose();
  };

  const markedCount = Object.values(records).filter(Boolean).length;

  return (
    <div className="confirm-backdrop" onClick={onClose}>
      <div className="attendance-modal" onClick={e => e.stopPropagation()}>
        <div className="attendance-modal-header">
          <h2>Lista obecności</h2>
          <button className="cal-modal-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="attendance-event-info">
          <h3>{event.title}</h3>
          <p className="attendance-event-details">
            {toLocaleDatePL(event.date)} &bull; {event.time} &bull; {event.location}
          </p>
        </div>

        <div className="attendance-list">
          {players.length === 0 ? (
            <p className="empty-state" style={{ padding: '1.5rem 0' }}>
              Brak zawodników w tej grupie.
            </p>
          ) : (
            players.map(player => (
              <AttendanceRow
                key={player.id}
                player={player}
                status={records[player.id] || null}
                onToggle={toggle}
              />
            ))
          )}
        </div>

        <div className="attendance-modal-footer">
          <span className="attendance-count">
            {markedCount}/{players.length} zaznaczono
          </span>
          <div className="attendance-footer-buttons">
            <button className="btn-secondary" onClick={onClose} type="button">
              Anuluj
            </button>
            <button className="btn-primary" onClick={handleSave} type="button">
              Zapisz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RowProps {
  player: Child;
  status: 'PRESENT' | 'ABSENT' | null;
  onToggle: (childId: string, status: 'PRESENT' | 'ABSENT') => void;
}

const AttendanceRow: React.FC<RowProps> = ({ player, status, onToggle }) => {
  return (
    <div className="attendance-row">
      <div className="attendance-player-info">
        <span className="attendance-player-name">{player.name}</span>
      </div>
      <div className="attendance-buttons">
        <button
          type="button"
          className={`btn-attendance btn-present ${status === 'PRESENT' ? 'active' : ''}`}
          onClick={() => onToggle(player.id, 'PRESENT')}
          title="Obecny"
        >
          <span className="att-icon">&#10003;</span>
          <span>Był</span>
        </button>
        <button
          type="button"
          className={`btn-attendance btn-absent ${status === 'ABSENT' ? 'active' : ''}`}
          onClick={() => onToggle(player.id, 'ABSENT')}
          title="Nieobecny"
        >
          <span className="att-icon">&#10007;</span>
          <span>Nie był</span>
        </button>
      </div>
    </div>
  );
};

export default AttendanceModal;
