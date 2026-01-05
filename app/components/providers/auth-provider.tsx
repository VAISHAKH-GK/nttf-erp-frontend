"use client";
import type React from "react";
import {
  useState,
  createContext,
  useContext,
  useLayoutEffect,
  useEffect,
} from "react";
import api from "@/lib/api";

type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type AuthContextType = {
  authToken: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setAuthToken(null);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { email, password });

      setAuthToken(res.data.authToken);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await fetchUser();
      } catch (error) {
        // Not authenticated
      }
    };

    checkAuth();
  }, []);

  useLayoutEffect(() => {
    const authInterceptor = api.interceptors.request.use((config: any) => {
      config.headers.Authorization =
        !config._retry && authToken
          ? `Bearer ${authToken}`
          : config.headers.Authorization;
      return config;
    });

    return () => {
      api.interceptors.request.eject(authInterceptor);
    };
  }, [authToken]);

  useLayoutEffect(() => {
    const refreshInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          !originalRequest._retry &&
          error.response?.status === 401 &&
          error.response?.data?.error === "Unauthorized"
        ) {
          try {
            const response = await api.get("/auth/refresh");

            setAuthToken(response.data.authToken);

            originalRequest.headers.Authorization = `Bearer ${response.data.authToken}`;
            originalRequest._retry = true;

            return api(originalRequest);
          } catch {
            setAuthToken(null);
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(refreshInterceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ authToken, login, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return authContext;
};
