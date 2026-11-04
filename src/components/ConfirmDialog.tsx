import { useEffect, useRef, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onCancel, loading]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div className="modal__icon">
          <AlertTriangle size={26} aria-hidden="true" />
        </div>
        <button
          type="button"
          className="modal__close"
          onClick={onCancel}
          aria-label="Fechar"
          disabled={loading}
        >
          <X size={18} aria-hidden="true" />
        </button>
        <h2 id="confirm-dialog-title">{title}</h2>
        <div className="modal__description">{description}</div>
        <div className="modal__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
            ref={cancelRef}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
