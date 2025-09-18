import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress, Box,
} from '@mui/material';
import FormField, { FormFieldProps } from './FormField';

/**
 * Props for the FormDialog component
 */
export interface FormDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disableBackdropClick?: boolean;
  fields: Array<FormFieldProps>;
  children?: React.ReactNode;
}

/**
 * A reusable form dialog component
 */
const FormDialog: React.FC<FormDialogProps> = ({
  open, title, onClose, onSubmit, loading = false, submitLabel = 'Submit',
  cancelLabel = 'Cancel', maxWidth = 'sm', disableBackdropClick = false,
  fields, children,
}) => {
  const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClick && reason === 'backdropClick') return;
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={maxWidth} fullWidth
            aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          {fields.map((field) => <FormField key={field.name} {...field} />)}
          {children}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button onClick={onSubmit} color="primary" variant="contained" disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : undefined}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormDialog;
