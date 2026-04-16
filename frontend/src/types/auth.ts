export type SignupRequest = {
  email: string;
  password: string;
  name: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupResponse = {
  id: number;
  email: string;
  name: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type ApiErrorResponse = {
  message: string;
};
