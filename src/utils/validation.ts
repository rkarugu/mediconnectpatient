export const ValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  phone: {
    pattern: /^[\d\s\-\+\(\)]{10,}$/,
    message: 'Please enter a valid phone number (at least 10 digits)',
  },
  password: {
    minLength: 8,
    message: 'Password must be at least 8 characters',
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    patternMessage: 'Password must contain uppercase, lowercase, and numbers',
  },
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  },
};

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email.trim()) {
    return { valid: false, error: 'Email is required' };
  }
  if (!ValidationRules.email.pattern.test(email)) {
    return { valid: false, error: ValidationRules.email.message };
  }
  return { valid: true };
};

export const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  if (!phone.trim()) {
    return { valid: false, error: 'Phone number is required' };
  }
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) {
    return { valid: false, error: 'Phone number must be at least 10 digits' };
  }
  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < ValidationRules.password.minLength) {
    return { valid: false, error: ValidationRules.password.message };
  }
  if (!ValidationRules.password.pattern.test(password)) {
    return { valid: false, error: ValidationRules.password.patternMessage };
  }
  return { valid: true };
};

export const validateName = (name: string, fieldName: string = 'Name'): { valid: boolean; error?: string } => {
  if (!name.trim()) {
    return { valid: false, error: `${fieldName} is required` };
  }
  if (name.length < ValidationRules.name.minLength) {
    return { valid: false, error: `${fieldName} must be at least ${ValidationRules.name.minLength} characters` };
  }
  if (name.length > ValidationRules.name.maxLength) {
    return { valid: false, error: `${fieldName} must not exceed ${ValidationRules.name.maxLength} characters` };
  }
  if (!ValidationRules.name.pattern.test(name)) {
    return { valid: false, error: ValidationRules.name.message };
  }
  return { valid: true };
};

export const validatePasswordMatch = (password: string, confirmation: string): { valid: boolean; error?: string } => {
  if (password !== confirmation) {
    return { valid: false, error: 'Passwords do not match' };
  }
  return { valid: true };
};

export const isEmailOrPhone = (identifier: string): 'email' | 'phone' | 'invalid' => {
  if (validateEmail(identifier).valid) return 'email';
  if (validatePhone(identifier).valid) return 'phone';
  return 'invalid';
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

export const getPhoneCountryCode = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return '+1';
  }
  if (cleaned.length === 10) {
    return '+1';
  }
  return '+1';
};
