import React, { useState, useRef, useEffect } from 'react';

interface TimePickerFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatDisplay(val: string) {
  if (!val) return '';
  return val; // already HH:MM
}

const TimePickerField: React.FC<TimePickerFieldProps> = ({
  label = 'Godzina',
  value,
  onChange,
  required,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const parts = value ? value.split(':').map(Number) : [null, null];
  const selectedHour = parts[0];
  const selectedMinute = parts[1];

  // Scroll selected items into view when opening
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      if (hoursRef.current && selectedHour !== null) {
        const el = hoursRef.current.querySelector(`[data-hour="${selectedHour}"]`);
        if (el) el.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
      if (minutesRef.current && selectedMinute !== null) {
        // Snap to nearest 5
        const snapMin = Math.round(selectedMinute / 5) * 5;
        const el = minutesRef.current.querySelector(`[data-minute="${snapMin}"]`);
        if (el) el.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    });
  }, [open, selectedHour, selectedMinute]);

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

  const selectHour = (h: number) => {
    const min = selectedMinute !== null ? selectedMinute : 0;
    onChange(`${pad2(h)}:${pad2(min)}`);
  };

  const selectMinute = (m: number) => {
    const hr = selectedHour !== null ? selectedHour : 12;
    onChange(`${pad2(hr)}:${pad2(m)}`);
    setOpen(false);
  };

  return (
    <div className="form-group tp-wrapper" ref={wrapperRef}>
      <label className="tp-field-label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>

      <button
        type="button"
        className={`tp-trigger-input ${open ? 'tp-trigger-input--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="tp-trigger-text">
          {value ? formatDisplay(value) : 'Wybierz godzin\u0119'}
        </span>
        <svg
          className="tp-trigger-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>

      {open && (
        <>
          <div className="tp-backdrop" onClick={() => setOpen(false)} />

          <div className="tp-panel" role="dialog" aria-label="Wybierz godzin\u0119">
            <div className="tp-handle-bar"><div className="tp-handle" /></div>

            <div className="tp-columns">
              {/* Hours */}
              <div className="tp-column" ref={hoursRef}>
                <div className="tp-column-header">Godz.</div>
                <div className="tp-scroll">
                  {HOURS.map(h => (
                    <button
                      key={h}
                      type="button"
                      data-hour={h}
                      className={`tp-option ${selectedHour === h ? 'tp-option--selected' : ''}`}
                      onClick={() => selectHour(h)}
                    >
                      {pad2(h)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes */}
              <div className="tp-column" ref={minutesRef}>
                <div className="tp-column-header">Min.</div>
                <div className="tp-scroll">
                  {MINUTES.map(m => (
                    <button
                      key={m}
                      type="button"
                      data-minute={m}
                      className={`tp-option ${selectedMinute !== null && Math.round(selectedMinute / 5) * 5 === m ? 'tp-option--selected' : ''}`}
                      onClick={() => selectMinute(m)}
                    >
                      {pad2(m)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TimePickerField;
