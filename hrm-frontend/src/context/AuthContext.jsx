import { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

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
    const [token, setToken] = useState(null);

    // Initialize auth state from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setToken(storedToken);
                api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
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

            // Store in localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            // Set axios header
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

            // Update state
            setToken(token);
            setUser(user);

            return { success: true, user };
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const logout = () => {
        // Clear localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Clear axios header
        delete api.defaults.headers.common["Authorization"];

        // Clear state
        setToken(null);
        setUser(null);

        // Show message
        toast.success("Logged out successfully");

        // Force reload to clear any cached state
        window.location.href = "/login";
    };

    const value = {
        user,
        loading,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}