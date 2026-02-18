import React from 'react';

interface EditModalProps {
  title: string;
  onSave: () => void;
  onCancel: () => void;
  canSave: boolean;
  children: React.ReactNode;
}

const EditModal: React.FC<EditModalProps> = ({ title, onSave, onCancel, canSave, children }) => {
  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <h3 className="confirm-title">{title}</h3>
        <div className="edit-modal-body">
          {children}
        </div>
        <div className="confirm-actions">
          <button className="btn-secondary confirm-cancel" onClick={onCancel}>
            Anuluj
          </button>
          <button
            className="confirm-btn confirm-btn--primary"
            onClick={onSave}
            disabled={!canSave}
          >
            Zapisz zmiany
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
