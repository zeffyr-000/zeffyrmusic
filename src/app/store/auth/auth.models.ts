/**
 * Auth Store Models
 * Gestion de l'authentification et des préférences utilisateur
 */

export type Language = 'fr' | 'en';

export interface UserInfo {
  pseudo: string;
  idPerso: string;
  mail: string;
}

export interface UserPreferences {
  darkModeEnabled: boolean;
  language: Language;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  preferences: UserPreferences;
  initialized: boolean;
}

export const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  preferences: {
    darkModeEnabled: false,
    language: 'fr',
  },
  initialized: false,
};
