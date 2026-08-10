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
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            } catch (error) {
                console.error("Error parsing stored user:", error);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post("/auth/login", { email, password });
            const { token, user } = response.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

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
        delete api.defaults.headers.common["Authorization"];
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
