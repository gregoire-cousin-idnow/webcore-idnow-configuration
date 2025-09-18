import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, CircularProgress,
} from '@mui/material';

/**
 * Props for the ConfirmationDialog component
 */
export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
}

/**
 * A reusable confirmation dialog component
 */
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, loading = false, confirmColor = 'primary',
  maxWidth = 'sm', disableBackdropClick = false, disableEscapeKeyDown = false,
}) => {
  const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClick && reason === 'backdropClick') return;
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') return;
    onCancel();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={maxWidth}
            aria-labelledby="confirmation-dialog-title"
            aria-describedby="confirmation-dialog-description">
      <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent>
        {typeof message === 'string' ? 
          <Typography id="confirmation-dialog-description">{message}</Typography> : message}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : undefined}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
