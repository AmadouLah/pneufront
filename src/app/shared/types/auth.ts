export type MessageResponse = Readonly<{ message: string }>;

export type LoginRequest = Readonly<{ email: string; password: string }>;

export type RegisterRequest = Readonly<{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string | null;
}>;

export type VerificationRequest = Readonly<{ email: string; code: string }>;

export type ResendVerificationRequest = Readonly<{ email: string }>;

export type ForgotPasswordRequest = Readonly<{ email: string }>;

export type ResetPasswordRequest = Readonly<{
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}>;

export type SetInitialPasswordRequest = Readonly<{
  email: string;
  token: string;
  password: string;
  confirmPassword: string;
}>;

export type RefreshTokenRequest = Readonly<{ refreshToken: string }>;

export type StartLoginResponse = Readonly<{
  mode: 'ADMIN_PASSWORD' | 'EMAIL_CODE';
  message: string;
}>;

export type AuthResponse = Readonly<{
  token: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userInfo: Readonly<{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    gender: string | null;
  }>;
}>;

export type UpdateGenderRequest = Readonly<{
  gender: 'HOMME' | 'FEMME' | 'AUTRE';
}>;

export type CodeRequiredResponse = Readonly<{
  status: 'CODE_REQUIRED';
  message: string;
  email: string;
}>;
