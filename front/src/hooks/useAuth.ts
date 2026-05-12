// useAuth — manages Cognito session state via Amplify v6.
// Exposes isAuthenticated, isAdmin, isLoading, signIn, signOut, and the raw token.

import { useState, useEffect, useCallback } from "react";
import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchAuthSession,
} from "aws-amplify/auth";

export interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  idToken: string | null;
  email: string | null;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isAdmin: false,
    isLoading: true,
    idToken: null,
    email: null,
    error: null,
  });

  // Check for an existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = useCallback(async () => {
    try {
      await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;

      if (!idToken) {
        setState(s => ({ ...s, isAuthenticated: false, isAdmin: false, isLoading: false }));
        return;
      }

      const payload = idToken.payload;
      const groups = (payload["cognito:groups"] as string[] | undefined) ?? [];
      const email = (payload["email"] as string | undefined) ?? null;

      setState({
        isAuthenticated: true,
        isAdmin: groups.includes("admin"),
        isLoading: false,
        idToken: idToken.toString(),
        email,
        error: null,
      });
    } catch {
      // No active session — not an error
      setState({
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        idToken: null,
        email: null,
        error: null,
      });
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      await amplifySignIn({ username: email, password });
      await checkSession();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed.";
      setState(s => ({ ...s, isLoading: false, error: message }));
      throw err;
    }
  }, [checkSession]);

  const signOut = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      await amplifySignOut();
    } finally {
      setState({
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        idToken: null,
        email: null,
        error: null,
      });
    }
  }, []);

  return { ...state, signIn, signOut };
}
