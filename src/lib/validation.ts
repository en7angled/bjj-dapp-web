import type { ValidationError } from '../types/api';

// Validation rules
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

// Validation functions
export function validateField(value: any, rules: ValidationRule, fieldName: string): ValidationError | null {
  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED'
    };
  }

  // Skip other validations if value is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  // Length validations
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${rules.minLength} characters`,
        code: 'MIN_LENGTH'
      };
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be no more than ${rules.maxLength} characters`,
        code: 'MAX_LENGTH'
      };
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return {
        field: fieldName,
        message: `${fieldName} format is invalid`,
        code: 'INVALID_FORMAT'
      };
    }
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      return {
        field: fieldName,
        message: customError,
        code: 'CUSTOM'
      };
    }
  }

  return null;
}

export function validateForm<T extends Record<string, any>>(
  data: T, 
  rules: ValidationRules
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const error = validateField(data[fieldName], fieldRules, fieldName);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  URL: /^https?:\/\/.+/,
  CARDANO_ADDRESS: /^addr[0-9a-z]+$/i,
  PROFILE_ID: /^[0-9a-f]{56}\.[0-9a-f]+$/i,
  NAME: /^[\p{L}\s\-']+$/u, // Unicode letters, spaces, hyphens, apostrophes
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^[0-9]+$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
};

// Common validation rules
export const COMMON_RULES = {
  REQUIRED: { required: true },
  EMAIL: { 
    required: true, 
    pattern: VALIDATION_PATTERNS.EMAIL,
    message: 'Please enter a valid email address'
  },
  NAME: { 
    required: true, 
    pattern: VALIDATION_PATTERNS.NAME,
    minLength: 2,
    maxLength: 50
  },
  PROFILE_ID: {
    required: true,
    pattern: VALIDATION_PATTERNS.PROFILE_ID,
    message: 'Please enter a valid profile ID'
  },
  CARDANO_ADDRESS: {
    required: true,
    pattern: VALIDATION_PATTERNS.CARDANO_ADDRESS,
    message: 'Please enter a valid Cardano address'
  },
  DESCRIPTION: {
    maxLength: 500
  },
  URL: {
    pattern: VALIDATION_PATTERNS.URL,
    message: 'Please enter a valid URL'
  }
};

// Form validation hooks
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  rules: ValidationRules
) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validate = useCallback(() => {
    const validationErrors = validateForm(data, rules);
    setErrors(validationErrors);
    return validationErrors.length === 0;
  }, [data, rules]);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (touched.has(field as string)) {
      setErrors(prev => prev.filter(error => error.field !== field));
    }
  }, [touched]);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => new Set(prev).add(field as string));
    
    // Validate this field
    const fieldRules = rules[field as string];
    if (fieldRules) {
      const fieldError = validateField(data[field], fieldRules, field as string);
      setErrors(prev => {
        const filtered = prev.filter(error => error.field !== field);
        return fieldError ? [...filtered, fieldError] : filtered;
      });
    }
  }, [data, rules]);

  const getFieldError = useCallback((field: keyof T) => {
    return errors.find(error => error.field === field);
  }, [errors]);

  const isValid = useMemo(() => errors.length === 0, [errors]);

  return {
    data,
    errors,
    touched,
    isValid,
    validate,
    setFieldValue,
    setFieldTouched,
    getFieldError,
    setData,
    setErrors
  };
}

// Import React hooks
import { useState, useCallback, useMemo } from 'react';
