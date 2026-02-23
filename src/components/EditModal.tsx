import React from 'react';
import { PremiumButton } from './ui/PremiumButton';

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
          <PremiumButton variant="navy" size="sm" onClick={onCancel}>
            Anuluj
          </PremiumButton>
          <PremiumButton variant="blue" size="sm" onClick={onSave} disabled={!canSave}>
            Zapisz zmiany
          </PremiumButton>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
