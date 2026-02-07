import { validateEmail, validatePhone } from './validation';

export interface AuthError {
  field?: string;
  message: string;
  code?: string;
}

export const parseAuthError = (error: any): AuthError => {
  if (error?.response?.data?.errors) {
    const errors = error.response.data.errors;
    const firstField = Object.keys(errors)[0];
    return {
      field: firstField,
      message: Array.isArray(errors[firstField]) ? errors[firstField][0] : errors[firstField],
      code: error.response.data.error_code,
    };
  }

  if (error?.response?.data?.message) {
    return {
      message: error.response.data.message,
      code: error.response.data.error_code,
    };
  }

  if (error?.message) {
    return { message: error.message };
  }

  return { message: 'An unexpected error occurred. Please try again.' };
};

export const isPhoneRequiredError = (error: any): boolean => {
  return error?.response?.status === 422 && error?.response?.data?.error_code === 'PHONE_REQUIRED';
};

export const isEmailAlreadyExistsError = (error: any): boolean => {
  return error?.response?.status === 422 && error?.response?.data?.error_code === 'EMAIL_EXISTS';
};

export const isPhoneAlreadyExistsError = (error: any): boolean => {
  return error?.response?.status === 422 && error?.response?.data?.error_code === 'PHONE_EXISTS';
};

export const getIdentifierType = (identifier: string): 'email' | 'phone' | null => {
  if (validateEmail(identifier).valid) return 'email';
  if (validatePhone(identifier).valid) return 'phone';
  return null;
};

export const formatErrorMessage = (error: AuthError): string => {
  if (error.code === 'PHONE_REQUIRED') {
    return 'Please provide your phone number to complete registration';
  }
  if (error.code === 'EMAIL_EXISTS') {
    return 'This email is already registered. Please login or use a different email.';
  }
  if (error.code === 'PHONE_EXISTS') {
    return 'This phone number is already registered. Please login or use a different number.';
  }
  return error.message;
};

export const shouldShowPhoneScreen = (error: any): boolean => {
  return isPhoneRequiredError(error);
};
