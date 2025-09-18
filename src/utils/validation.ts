/**
 * Validation utility functions
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Base validator class
 */
export class Validator<T> {
  validate(value: T): ValidationResult {
    return { isValid: true };
  }
}

/**
 * Required validator
 */
export class RequiredValidator extends Validator<any> {
  private fieldName: string;
  
  constructor(fieldName: string = 'Field') {
    super();
    this.fieldName = fieldName;
  }
  
  validate(value: any): ValidationResult {
    if (value === undefined || value === null || value === '') {
      return { 
        isValid: false, 
        errorMessage: `${this.fieldName} is required` 
      };
    }
    
    return { isValid: true };
  }
}

/**
 * Pattern validator
 */
export class PatternValidator extends Validator<string> {
  private pattern: RegExp;
  private errorMessage: string;
  
  constructor(pattern: RegExp, errorMessage: string) {
    super();
    this.pattern = pattern;
    this.errorMessage = errorMessage;
  }
  
  validate(value: string): ValidationResult {
    if (!value) return { isValid: true }; 
    if (!this.pattern.test(value)) return {  isValid: false,  errorMessage: this.errorMessage  };
    return { isValid: true };
  }
}

/**
 * Min length validator
 */
export class MinLengthValidator extends Validator<string> {
  private minLength: number;
  
  constructor(minLength: number) {
    super();
    this.minLength = minLength;
  }
  
  validate(value: string): ValidationResult {
    if (!value) return { isValid: true }; 
    if (value.length < this.minLength) return {  isValid: false,  errorMessage: `Minimum length is ${this.minLength} characters`  };
    return { isValid: true };
  }
}

/**
 * Max length validator
 */
export class MaxLengthValidator extends Validator<string> {
  private maxLength: number;
  
  constructor(maxLength: number) {
    super();
    this.maxLength = maxLength;
  }
  
  validate(value: string): ValidationResult {
    if (!value) return { isValid: true }; 
    if (value.length > this.maxLength) return {  isValid: false,  errorMessage: `Maximum length is ${this.maxLength} characters`  };
    return { isValid: true };
  }
}

/**
 * Prefix validator
 */
export class PrefixValidator extends Validator<string> {
  private prefix: string;
  
  constructor(prefix: string) {
    super();
    this.prefix = prefix;
  }
  
  validate(value: string): ValidationResult {
    if (!value) return { isValid: true }; 
    if (!value.startsWith(this.prefix)) return {  isValid: false,  errorMessage: `Must start with "${this.prefix}"`  };
    return { isValid: true };
  }
}

/**
 * Composite validator that runs multiple validators
 */
export class CompositeValidator<T> extends Validator<T> {
  private validators: Validator<T>[];
  
  constructor(validators: Validator<T>[]) {
    super();
    this.validators = validators;
  }
  
  validate(value: T): ValidationResult {
    for (const validator of this.validators) {
      const result = validator.validate(value);
      if (!result.isValid) return result;
    }
    
    return { isValid: true };
  }
}

/**
 * Shortname validator
 */
export const shortnameValidator = new CompositeValidator([
  new RequiredValidator('Shortname'),
  new PatternValidator(
    /^[a-zA-Z0-9-]+$/,
    'Shortname can only contain letters (including camelCase), numbers, and hyphens'
  ),
  new MinLengthValidator(2),
  new MaxLengthValidator(50)
]);

/**
 * Configuration key validator
 */
export const configKeyValidator = new CompositeValidator([
  new RequiredValidator('Key'),
  new PrefixValidator('public.'),
  new PatternValidator(
    /^[a-zA-Z0-9._-]+$/,
    'Key can only contain letters, numbers, dots, underscores, and hyphens'
  )
]);

/**
 * Version validator
 */
export const versionValidator = new CompositeValidator([
  new RequiredValidator('Version'),
  new PatternValidator(
    /^[a-zA-Z0-9.-]+$/,
    'Version can only contain letters, numbers, dots, and hyphens'
  )
]);

/**
 * Validates a shortname
 * @param shortname - The shortname to validate
 * @returns An object with validation result and error message
 */
export const validateShortname = (shortname: string): ValidationResult => {
  return shortnameValidator.validate(shortname);
};

/**
 * Validates a configuration key
 * @param key - The configuration key to validate
 * @returns An object with validation result and error message
 */
export const validateConfigKey = (key: string): ValidationResult => {
  return configKeyValidator.validate(key);
};

/**
 * Validates a version string
 * @param version - The version string to validate
 * @returns An object with validation result and error message
 */
export const validateVersion = (version: string): ValidationResult => {
  return versionValidator.validate(version);
};

/**
 * Validates form data with custom validation rules
 * @param data - The form data to validate
 * @param validationRules - Object containing validation functions for each field
 * @returns An object with errors for each invalid field
 */
export const validateForm = <T extends Record<string, any>>(
  data: T,
  validationRules: {
    [K in keyof T]?: (value: T[K]) => ValidationResult
  }
): { [K in keyof T]?: string } => {
  const errors: Partial<Record<keyof T, string>> = {};
  
  Object.entries(validationRules).forEach(([field, validateFn]) => {
    if (validateFn) {
      const key = field as keyof T;
      const result = validateFn(data[key]);
      if (!result.isValid) errors[key] = result.errorMessage;
    }
  });
  
  return errors;
};
