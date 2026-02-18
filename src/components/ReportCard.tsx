import React from 'react';
import { Report, Session } from '../types';

interface ReportCardProps {
  report: Report;
  session: Session;
}

// Karta raportu – wyświetla wartości wypełnione przez rodzica
// w kontekście kategorii zdefiniowanych przez trenera
const ReportCard: React.FC<ReportCardProps> = ({ report, session }) => {
  const formattedDate = new Date(session.date).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Podziel kategorie na liczniki i tekstowe dla lepszej czytelności
  const counterCats = session.categories.filter(c => c.type === 'counter');
  const textCats = session.categories.filter(c => c.type === 'text');

  return (
    <div className="entry-card">
      <div className="entry-header">
        <h3 className="entry-title">{session.title}</h3>
        <span className="entry-date">{formattedDate}</span>
      </div>

      {/* Statystyki liczbowe jako badge */}
      {counterCats.length > 0 && (
        <div className="entry-stats">
          {counterCats.map(cat => {
            const val = report.values[cat.id];
            if (typeof val === 'number' && val > 0) {
              return (
                <span key={cat.id} className="entry-stat-badge">
                  {cat.name}: <strong>{val}</strong>
                </span>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Opisy tekstowe */}
      {textCats.map(cat => {
        const val = report.values[cat.id];
        if (typeof val === 'string' && val.trim()) {
          return (
            <div key={cat.id} className="report-text-field">
              <span className="report-text-label">{cat.name}</span>
              <p className="entry-note">{val}</p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default ReportCard;
