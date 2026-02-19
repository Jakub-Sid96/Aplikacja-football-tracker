import React, { useState, useRef, useEffect } from 'react';

interface DatePickerFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

/* ── helpers ─────────────────────────────────────────────── */

const DAYS_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

function toISO(y: number, m: number, d: number) {
  return `${String(y).padStart(4, '0')}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function formatDisplay(iso: string) {
  if (!iso) return '';
  const { year, month, day } = parseISO(iso);
  return `${day} ${MONTHS_PL[month]?.slice(0, 3).toLowerCase()} ${year}`;
}

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  // Monday = 0 in our grid
  let startDay = first.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { day: number; month: number; year: number; outside: boolean }[] = [];

  // Previous month fill
  for (let i = startDay - 1; i >= 0; i--) {
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    cells.push({ day: daysInPrev - i, month: pm, year: py, outside: true });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, year, outside: false });
  }

  // Next month fill (complete to 6 rows = 42 cells, or at least full last row)
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, month: nm, year: ny, outside: true });
    }
  }

  return cells;
}

const todayISO = () => {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
};

/* ── component ───────────────────────────────────────────── */

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label = 'Data',
  value,
  onChange,
  required,
}) => {
  const [open, setOpen] = useState(false);
  const parsed = value ? parseISO(value) : null;
  const [viewYear, setViewYear] = useState(parsed?.year ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? new Date().getMonth());

  const wrapperRef = useRef<HTMLDivElement>(null);
  const today = todayISO();

  // Sync view to value when opening
  useEffect(() => {
    if (open && value) {
      const p = parseISO(value);
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [open, value]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (!open) return;
    const isMobile = window.innerWidth <= 600;
    if (!isMobile) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const selectDate = (iso: string) => {
    onChange(iso);
    setOpen(false);
  };

  const currentRealYear = new Date().getFullYear();
  const minYear = Math.min(1920, viewYear);
  const maxYear = Math.max(currentRealYear + 5, viewYear);
  const yearOptions: number[] = [];
  for (let y = minYear; y <= maxYear; y++) yearOptions.push(y);

  const days = getCalendarDays(viewYear, viewMonth);

  return (
    <div className="form-group dp-wrapper" ref={wrapperRef}>
      <label className="dp-field-label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>

      <button
        type="button"
        className={`dp-trigger-input ${open ? 'dp-trigger-input--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="dp-trigger-text">
          {value ? formatDisplay(value) : 'Wybierz datę'}
        </span>
        <svg
          className="dp-trigger-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop for mobile bottom-sheet */}
          <div className="dp-backdrop" onClick={() => setOpen(false)} />

          <div className="dp-panel" role="dialog" aria-label="Wybierz datę">
            {/* Mobile handle */}
            <div className="dp-handle-bar"><div className="dp-handle" /></div>

            {/* Header: month/year navigation */}
            <div className="dp-header">
              <button
                type="button"
                className="dp-nav"
                onClick={prevMonth}
                aria-label="Poprzedni miesiąc"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="dp-selects">
                <select
                  className="dp-select dp-select--month"
                  value={viewMonth}
                  onChange={e => setViewMonth(Number(e.target.value))}
                  aria-label="Miesiąc"
                >
                  {MONTHS_PL.map((name, i) => (
                    <option key={i} value={i}>{name}</option>
                  ))}
                </select>
                <select
                  className="dp-select dp-select--year"
                  value={viewYear}
                  onChange={e => setViewYear(Number(e.target.value))}
                  aria-label="Rok"
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="dp-nav"
                onClick={nextMonth}
                aria-label="Następny miesiąc"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Weekday headers */}
            <div className="dp-weekdays">
              {DAYS_PL.map(d => (
                <span key={d} className="dp-weekday">{d}</span>
              ))}
            </div>

            {/* Day grid */}
            <div className="dp-grid">
              {days.map((cell, i) => {
                const iso = toISO(cell.year, cell.month, cell.day);
                const isSelected = iso === value;
                const isToday = iso === today;
                return (
                  <button
                    key={i}
                    type="button"
                    className={[
                      'dp-day',
                      cell.outside && 'dp-day--outside',
                      isSelected && 'dp-day--selected',
                      isToday && !isSelected && 'dp-day--today',
                    ].filter(Boolean).join(' ')}
                    onClick={() => selectDate(iso)}
                    tabIndex={cell.outside ? -1 : 0}
                    aria-label={`${cell.day} ${MONTHS_PL[cell.month]} ${cell.year}`}
                    aria-pressed={isSelected}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Footer: quick actions */}
            <div className="dp-footer">
              <button
                type="button"
                className="dp-quick"
                onClick={() => selectDate(todayISO())}
              >
                Dzisiaj
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DatePickerField;
