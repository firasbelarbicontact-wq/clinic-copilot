export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string; // format AAAA-MM-JJ
  role?: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
}

export interface UserResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  createdAt: string;
  role: string;
  isActive: boolean;
}