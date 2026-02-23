import React, { useRef } from 'react';

interface StatCounterProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

// Pojedynczy licznik statystyki z przyciskami +/-
const StatCounter: React.FC<StatCounterProps> = ({ label, value, onIncrement, onDecrement }) => {
  const valueRef = useRef<HTMLSpanElement>(null);

  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    action: () => void,
    direction: 'up' | 'down'
  ) => {
    const btn = e.currentTarget;
    btn.classList.remove('stat-btn--pulse');
    requestAnimationFrame(() => {
      btn.classList.add('stat-btn--pulse');
      setTimeout(() => btn.classList.remove('stat-btn--pulse'), 300);
    });

    const val = valueRef.current;
    if (val) {
      val.classList.remove('stat-value--up', 'stat-value--down');
      requestAnimationFrame(() => {
        val.classList.add(direction === 'up' ? 'stat-value--up' : 'stat-value--down');
        setTimeout(() => val.classList.remove('stat-value--up', 'stat-value--down'), 250);
      });
    }

    action();
  };

  return (
    <div className="stat-counter">
      <span className="stat-label">{label}</span>
      <div className="stat-controls">
        <button
          className="stat-btn stat-btn-minus"
          onClick={(e) => handleClick(e, onDecrement, 'down')}
          disabled={value === 0}
          aria-label={`Zmniejsz ${label}`}
        >
          −
        </button>
        <span className="stat-value" ref={valueRef}>{value}</span>
        <button
          className="stat-btn stat-btn-plus"
          onClick={(e) => handleClick(e, onIncrement, 'up')}
          aria-label={`Zwiększ ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default StatCounter;
