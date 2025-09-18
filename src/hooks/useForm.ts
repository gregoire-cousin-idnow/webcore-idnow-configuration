import { useState, useCallback } from 'react';

/**
 * Custom hook for form handling
 * @param initialValues - Initial form values
 * @returns Form state and handlers
 */
export function useForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /**
   * Handle input change
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setValues(prevValues => ({
      ...prevValues,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is edited
    if (errors[name as keyof T]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
  }, [errors]);

  /**
   * Set a specific form value
   */
  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prevValues => ({
      ...prevValues,
      [name]: value
    }));
    
    // Clear error when field is set
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
  }, [errors]);

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Set form values
   */
  const setFormValues = useCallback((newValues: Partial<T>) => {
    setValues(prevValues => ({
      ...prevValues,
      ...newValues
    }));
  }, []);

  /**
   * Validate form with validation function
   */
  const validateForm = useCallback((validationFn: (values: T) => Partial<Record<keyof T, string>>) => {
    const validationErrors = validationFn(values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [values]);

  return {
    values,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    setValue,
    resetForm,
    setFormValues,
    setErrors,
    validateForm
  };
}
