/**
 * Authentication Type Definitions
 * These types handle authentication state and user information
 *
 * Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
 */

// Core User interface
export interface User {
  id: string;
  email: string;
  name: string | null;
  provider: "google" | "email";
  createdAt: string;
}

// Authentication state for Redux
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  sessionChecked: boolean; // Track if session was verified
  connectionError: boolean; // True when session check failed due to DB/cloud timeout
}

// Login credentials for email/password authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration credentials
export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}
