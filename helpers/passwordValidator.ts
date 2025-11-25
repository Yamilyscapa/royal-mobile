export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validatePasswordStrength = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  // Requirements matching SignUp screen:
  // 8+ chars, letters, numbers, special char
  
  // Minimum 8 characters
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  // At least one letter (any case)
  if (!/[A-Za-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra');
  }

  // At least one number
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  // At least one special character
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial (ej. @ !)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
