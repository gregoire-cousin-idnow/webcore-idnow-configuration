import { useState, useCallback } from 'react';

/**
 * Custom hook for managing dialog state
 * @param initialState - Initial open state of the dialog
 * @returns Dialog state and handlers
 */
export function useDialog(initialState: boolean = false) {
  const [isOpen, setIsOpen] = useState<boolean>(initialState);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return { isOpen, open, close, toggle };
}

/**
 * Custom hook for managing confirmation dialog state
 * @returns Confirmation dialog state and handlers
 */
export function useConfirmationDialog<T = void>() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [data, setData] = useState<T | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);
  
  const open = useCallback((itemData: T | null = null) => {
    setData(itemData);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => setResolveRef(() => resolve));
  }, []);
  
  const confirm = useCallback(() => {
    if (resolveRef) resolveRef(true);
    setIsOpen(false);
  }, [resolveRef]);
  
  const cancel = useCallback(() => {
    if (resolveRef) resolveRef(false);
    setIsOpen(false);
  }, [resolveRef]);
  
  return { isOpen, data, open, confirm, cancel };
}

/**
 * Custom hook for managing form dialog state
 * @param initialFormData - Initial form data
 * @returns Form dialog state and handlers
 */
export function useFormDialog<T extends Record<string, any>>(initialFormData: T) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<T>(initialFormData);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const openCreate = useCallback(() => {
    setIsEditing(false);
    setFormData(initialFormData);
    setSelectedItem(null);
    setIsOpen(true);
  }, [initialFormData]);
  
  const openEdit = useCallback((item: any, data: T) => {
    setIsEditing(true);
    setFormData(data);
    setSelectedItem(item);
    setIsOpen(true);
  }, []);
  
  const close = useCallback(() => {
    setIsOpen(false);
    setFormData(initialFormData);
    setSelectedItem(null);
  }, [initialFormData]);
  
  const updateFormData = useCallback((newData: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  }, []);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);
  
  return {
    isOpen,
    formData,
    isEditing,
    selectedItem,
    openCreate,
    openEdit,
    close,
    updateFormData,
    handleInputChange
  };
}
