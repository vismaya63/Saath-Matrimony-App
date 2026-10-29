
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, clearToken, getToken, saveToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const data = await api("/api/me");
    setUser(data);
    return data;
  }

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!getToken()) {
        setLoading(false);
        return;
      }

      try {
        const data = await api("/api/me");
        if (active) setUser(data);
      } catch {
        clearToken();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  async function login(email, password) {
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    saveToken(data.token);
    const account = await refreshUser();
    return account;
  }

  async function register(email, password) {
    const data = await api("/api/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    saveToken(data.token);
    const account = await refreshUser();
    return account;
  }

  async function logout() {
    try {
      await api("/api/logout", { method: "POST" });
    } catch {
      // Clear the local session even if the server request fails.
    }

    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
