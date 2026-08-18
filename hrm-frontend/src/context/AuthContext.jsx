import { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function restoreSession() {
            const token = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");

            if (!token) {
                if (!cancelled) setLoading(false);
                return;
            }

            // Optimistic restore so UI can paint quickly
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (!cancelled) setUser(parsedUser);
                } catch {
                    localStorage.removeItem("user");
                }
            }

            try {
                const response = await api.get("/auth/me");
                if (!cancelled) {
                    setUser(response.data);
                    localStorage.setItem("user", JSON.stringify(response.data));
                }
            } catch (error) {
                console.error("Session validation failed:", error);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        restoreSession();
        return () => {
            cancelled = true;
        };
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post("/auth/login", { email, password });
            const { token, user } = response.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            setUser(user);
            return { success: true, user };
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const updateUser = (nextUser) => {
        setUser(nextUser);
        localStorage.setItem("user", JSON.stringify(nextUser));
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        window.location.href = "/login";
    };

    const value = {
        user,
        loading,
        login,
        updateUser,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
