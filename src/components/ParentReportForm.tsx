import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useApp } from '../AppContext';
import { Category } from '../types';
import StatCounter from './StatCounter';

// ============================================================
// ParentReportForm – formularz raportu z obsługą draftów.
//
// Zmiana vs. poprzednia wersja:
// - childId pochodzi z URL (nie z getChildForParent)
// - weryfikacja: rodzic widzi tylko swoje dzieci
// - reszta logiki identyczna
// ============================================================

const ParentReportForm: React.FC = () => {
  const { sessionId, childId } = useParams<{ sessionId: string; childId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    getChildById,
    getSessionById,
    getReportForSessionAndChild,
    addReport,
    updateReport,
    submitReport,
  } = useApp();

  const child = childId ? getChildById(childId) : undefined;
  const session = sessionId ? getSessionById(sessionId) : undefined;
  const existingReport = session && child
    ? getReportForSessionAndChild(session.id, child.id)
    : undefined;

  const [values, setValues] = useState<Record<string, number | string>>(() => {
    if (existingReport) return { ...existingReport.values };
    if (!session) return {};
    const initial: Record<string, number | string> = {};
    session.categories.forEach(cat => {
      initial[cat.id] = cat.type === 'counter' ? 0 : '';
    });
    return initial;
  });

  const [feedback, setFeedback] = useState<'saved' | 'submitted' | null>(null);

  // Bezpieczeństwo: rodzic widzi tylko raporty swoich dzieci
  if (!currentUser || !child || child.parentId !== currentUser.id) {
    return <div className="container"><p>Brak dostępu.</p></div>;
  }
  if (!session) {
    return <div className="container"><p>Nie znaleziono raportu meczowego/treningowego.</p></div>;
  }

  const isSubmitted = existingReport?.status === 'submitted';
  const backUrl = `/parent/sessions/${child.id}`;

  const handleCounterChange = (catId: string, delta: number) => {
    setValues(prev => ({
      ...prev,
      [catId]: Math.max(0, (prev[catId] as number) + delta),
    }));
  };

  const handleTextChange = (catId: string, text: string) => {
    setValues(prev => ({ ...prev, [catId]: text }));
  };

  const handleSaveDraft = () => {
    const now = new Date().toISOString();

    if (existingReport) {
      updateReport({ ...existingReport, values, updatedAt: now });
    } else {
      addReport({
        id: `report-${Date.now()}`,
        sessionId: session.id,
        childId: child.id,
        parentId: currentUser.id,
        status: 'draft',
        values,
        updatedAt: now,
      });
    }

    setFeedback('saved');
    setTimeout(() => navigate(backUrl), 1500);
  };

  const handleSubmit = () => {
    const now = new Date().toISOString();

    if (existingReport) {
      updateReport({ ...existingReport, values, updatedAt: now });
      submitReport(existingReport.id);
    } else {
      addReport({
        id: `report-${Date.now()}`,
        sessionId: session.id,
        childId: child.id,
        parentId: currentUser.id,
        status: 'submitted',
        values,
        updatedAt: now,
        submittedAt: now,
      });
    }

    // Po wysłaniu → powrót na stronę główną rodzica,
    // żeby widział podsumowanie swoich dzieci i przypisań
    setFeedback('submitted');
    setTimeout(() => navigate('/parent'), 1500);
  };

  if (feedback) {
    return (
      <div className="container">
        <div className={`success-message ${feedback === 'saved' ? 'draft-saved' : ''}`}>
          {feedback === 'saved'
            ? 'Dane zapisane roboczo.'
            : 'Raport wysłany do trenera!'
          }
        </div>
      </div>
    );
  }

  const formattedDate = new Date(session.date).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="container">
      <button className="btn-back" onClick={() => navigate(backUrl)}>
        ← Powrót
      </button>

      <div className="form-header">
        <h2>{session.title}</h2>
        <p className="child-badge">{formattedDate} · {child.name}</p>
        {isSubmitted && (
          <div className="submitted-banner">Raport wysłany – tylko podgląd</div>
        )}
        {existingReport?.status === 'draft' && (
          <div className="draft-banner">Wersja robocza – możesz edytować</div>
        )}
      </div>

      <form onSubmit={e => e.preventDefault()}>
        <div className="report-fields">
          {session.categories.map((cat: Category) => (
            <div key={cat.id} className="form-group">
              <label>{cat.name}</label>

              {cat.type === 'counter' ? (
                <StatCounter
                  label={cat.name}
                  value={(values[cat.id] as number) ?? 0}
                  onIncrement={() => !isSubmitted && handleCounterChange(cat.id, 1)}
                  onDecrement={() => !isSubmitted && handleCounterChange(cat.id, -1)}
                />
              ) : (
                <textarea
                  value={(values[cat.id] as string) ?? ''}
                  onChange={e => handleTextChange(cat.id, e.target.value)}
                  placeholder={`Opisz: ${cat.name.toLowerCase()}...`}
                  rows={3}
                  disabled={isSubmitted}
                />
              )}
            </div>
          ))}
        </div>

        {!isSubmitted && (
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSaveDraft}
            >
              Zapisz roboczo
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmit}
            >
              Wyślij do trenera
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ParentReportForm;
