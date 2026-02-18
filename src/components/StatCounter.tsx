import React from 'react';

interface StatCounterProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

// Pojedynczy licznik statystyki z przyciskami +/-
const StatCounter: React.FC<StatCounterProps> = ({ label, value, onIncrement, onDecrement }) => {
  return (
    <div className="stat-counter">
      <span className="stat-label">{label}</span>
      <div className="stat-controls">
        <button
          className="stat-btn stat-btn-minus"
          onClick={onDecrement}
          disabled={value === 0}
          aria-label={`Zmniejsz ${label}`}
        >
          −
        </button>
        <span className="stat-value">{value}</span>
        <button
          className="stat-btn stat-btn-plus"
          onClick={onIncrement}
          aria-label={`Zwiększ ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default StatCounter;
