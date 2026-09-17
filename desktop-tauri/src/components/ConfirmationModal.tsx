import React from 'react';
import styles from './ConfirmationModal.module.css';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  subtext?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  subtext = 'SECURITY CONFIRMATION REQUIRED',
  message,
  confirmLabel = 'CONFIRM EXECUTION',
  cancelLabel = 'CANCEL',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onCancel}>
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.warningHeader}>
          <div className={styles.warningIcon}>⚠️</div>
          <div>
            <div className={styles.title}>{title}</div>
            <div className={styles.subtext}>{subtext}</div>
          </div>
        </div>

        <div className={styles.messageBody}>{message}</div>

        <div className={styles.buttonRow}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={styles.confirmBtn} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
