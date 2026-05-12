// AuthContext — provides global authentication state via useAuth hook.
// Wrap the app in <AuthProvider> to make auth available everywhere.

import { createContext, useContext, type ReactNode } from "react";
import { useAuth, type UseAuthReturn } from "../hooks/useAuth";

const AuthContext = createContext<UseAuthReturn | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): UseAuthReturn => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
};

export default AuthContext;
