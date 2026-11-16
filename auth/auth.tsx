import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthManager } from "./manager";
import type { SessionContext } from "./types";

const saveLocalMock = async () => {
  try {
    const rawUser = {
      uid: "usr_abraham_123",
      email: "abrahamborja95@gmail.com",
      displayName: "Abraham Borja",
    };
    localStorage.setItem("sesion", JSON.stringify(rawUser));
    console.log("Abraham hizo saveLocal:", rawUser);
    return rawUser;
  } catch (err) {
    console.error("Login error:", err);
    return null;
  }
};

export interface AuthContextValue {
  session: SessionContext | null;
  actions: {
    loginWithGoogle: () => Promise<SessionContext | null>;
    logout: () => Promise<void>;
    logSession: () => Promise<void>;
    getSession: () => SessionContext | null;
  };
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ value?: any; children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<SessionContext | null>(null);

  // Inicializa el AuthManager escuchando el observador real de Firebase
  useEffect(() => {
    AuthManager.initialize((newSession) => {
      console.log("AuthManager emitió sesión:", newSession);
      setSession(newSession);
    }, "firebase");

    return () => {
      AuthManager.stop();
    };
  }, []);

  const actions = {
    // Login real con Firebase y Google
    loginWithGoogle: async () => {
      try {
        return await AuthManager.loginWithGoogle();
      } catch (err) {
        console.error("Error al iniciar sesión con Google:", err);
        return null;
      }
    },
    // Logout real
    logout: async () => {
      localStorage.removeItem("sesion");
      await AuthManager.logout();
    },
    // Mock local solicitado para pruebas
    logSession: async () => {
      const user = await saveLocalMock();
      if (user) {
        await AuthManager.simulateMockLogin(user);
      }
      console.log("hora", Date.now());
    },
    getSession: () => {
      return session;
    },
  };

  return (
    <AuthContext.Provider value={{ session, actions }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return {
    session: context.session,
    loginWithGoogle: context.actions.loginWithGoogle,
    logout: context.actions.logout,
    logSession: context.actions.logSession,
    getSession: context.actions.getSession,
  };
};
