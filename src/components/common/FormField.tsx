import React from 'react';
import {
  TextField, FormControl, FormControlLabel, Switch, InputLabel, Select,
  MenuItem, FormHelperText, SelectChangeEvent, TextFieldProps,
} from '@mui/material';

/**
 * Props for the FormField component
 */
export interface FormFieldProps {
  name: string;
  label: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  error?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  options?: Array<{ value: string | number; label: string }>;
  placeholder?: string;
  helperText?: string;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium';
  sx?: any;
  autoFocus?: boolean;
}

/**
 * A reusable form field component that supports different input types
 */
const FormField: React.FC<FormFieldProps> = ({
  name, label, value, onChange, error, type = 'text', required = false,
  disabled = false, fullWidth = true, multiline = false, rows = 1,
  options = [], placeholder = '', helperText = '', variant = 'outlined',
  size = 'medium', sx = {}, autoFocus = false,
}) => {
  // Handle checkbox/switch type
  if (type === 'checkbox' || type === 'switch') {
    return (
      <FormControlLabel
        control={<Switch checked={Boolean(value)} onChange={onChange} name={name} 
                         disabled={disabled} color="primary" size={size} />}
        label={label}
        sx={{ ...sx, display: 'block', mb: 2 }}
      />
    );
  }

  // Handle select type
  if (type === 'select') {
    return (
      <FormControl fullWidth={fullWidth} error={!!error} variant={variant}
                   disabled={disabled} required={required} sx={{ ...sx, mb: 2 }} size={size}>
        <InputLabel id={`${name}-label`}>{label}</InputLabel>
        <Select labelId={`${name}-label`} id={name} name={name} value={value || ''}
                onChange={onChange} label={label} autoFocus={autoFocus}>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </Select>
        {(error || helperText) && <FormHelperText>{error || helperText}</FormHelperText>}
      </FormControl>
    );
  }

  // Default to TextField for all other types
  const textFieldProps: TextFieldProps = {
    id: name, name, label, value: value || '', onChange, error: !!error,
    helperText: error || helperText, type, required, disabled, fullWidth,
    multiline, rows, placeholder, variant, size, sx: { ...sx, mb: 2 }, autoFocus,
  };

  return <TextField {...textFieldProps} />;
};

export default FormField;
