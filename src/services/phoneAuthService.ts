import { PhoneAuthProvider, RecaptchaVerifier, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';

export interface PhoneAuthResult {
  success: boolean;
  message?: string;
  verificationId?: string;
  phoneNumber?: string;
}

class PhoneAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  async sendOTP(phoneNumber: string): Promise<PhoneAuthResult> {
    try {
      if (!auth) {
        return {
          success: false,
          message: 'Firebase not configured',
        };
      }

      const provider = new PhoneAuthProvider(auth);
      
      if (!this.recaptchaVerifier) {
        this.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }

      const verificationId = await provider.verifyPhoneNumber(
        phoneNumber,
        this.recaptchaVerifier
      );

      return {
        success: true,
        verificationId,
        phoneNumber,
      };
    } catch (error: any) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
      };
    }
  }

  async verifyOTP(verificationId: string, code: string): Promise<PhoneAuthResult> {
    try {
      if (!auth) {
        return {
          success: false,
          message: 'Firebase not configured',
        };
      }

      const credential = PhoneAuthProvider.credential(verificationId, code);
      const result = await signInWithCredential(auth, credential);

      return {
        success: true,
        phoneNumber: result.user.phoneNumber || undefined,
      };
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        message: error.message || 'Invalid OTP',
      };
    }
  }

  clearRecaptcha() {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
  }
}

export const phoneAuthService = new PhoneAuthService();
