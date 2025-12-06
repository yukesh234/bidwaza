import { createContext, useContext, useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import api from "../API/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [balance,setbalance] = useState(null)
  const [cartRefreshTrigger, setCartRefreshTrigger] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.post("/getCurrentUser");
      
      if (response.data.user) {
        
        setUser(response.data.user);
        setIsAuthenticated(true);
        setbalance(response.data.balance[0])
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userdata) => {
    try {
      setLoading(true);
      const response = await api.post("/register", {
        firstname: userdata.firstName,
        lastName: userdata.lastName,
        email: userdata.email,
        password: userdata.password,
        interests: userdata.interests,
      });
      if (response.data.success) {
        await checkAuth();
      }
      return { success: true, message: response.data.message || "Registered successfully" };
    } catch (err) {
      console.error("Registration failed:", err);
      return { success: false, message: err.response?.data?.message || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post("/login", { email, password });
      if (response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: response.data.success, message: response.data.message || "Login successful", user: response.data.user };
      }
      return { success: false, message: "Login failed" };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: err.response?.data?.message || "Login failed. Check credentials." };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await api.post("/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      toast.success("Logged out successfully");
    }
  };

  const sendVerificationCode = async (email) => {
    setLoading(true);
    try {
      const response = await api.post("/sendverificationCode", { email });
      return { success: response.data.success, message: response.data.message };
    } catch (error) {
      console.error("Error sending verification code:", error);
      return { success: false, message: error.response?.data?.message || "Failed to send verification code" };
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (email, code) => {
    setLoading(true);
    try {
      const response = await api.post("/verifyCode", { email, code });
      return { success: response.data.success, message: response.data.message };
    } catch (error) {
      console.error("Error verifying code:", error);
      return { success: false, message: error.response?.data?.message || "Failed to verify code" };
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async (email) => {
    setLoading(true);
    try {
      const response = await api.post("/resendCode", { email });
      return { success: response.data.success, message: response.data.message };
    } catch (error) {
      console.error("Error resending code:", error);
      return { success: false, message: error.response?.data?.message || "Failed to resend code" };
    } finally {
      setLoading(false);
    }
  };



  const value = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    balance,
    register,
    login,
    logout,
    sendVerificationCode,
    verifyCode,
    resendCode
  }), [user, isAuthenticated, loading,]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
