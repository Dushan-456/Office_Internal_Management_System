import React, { createContext, useState, useContext } from "react";
import API from "../services/api";
const AuthContext = createContext(null);

// Create the provider component
export const AuthProvider = ({ children }) => {
   // Initialize state from localStorage to check for an existing session
   const [user, setUser] = useState(() => {
      try {
         const storedUser = localStorage.getItem("user");
         return storedUser ? JSON.parse(storedUser) : null;
      } catch (error) {
         console.error("Failed to parse user from localStorage", error);
         return null;
      }
   });

   const login = (userData) => {
      // Store user data in both component state and browser's localStorage
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
   };

   /**
    * logout function: Clears the user state, localStorage, and the server-side cookie.
    */
   const logout = async () => {
      try {
         await API.post("/users/logout");
      } catch (error) {
         console.error("Logout failed:", error);
      } finally {
         setUser(null);
         localStorage.removeItem("user");
      }
   };

   // The value object contains the state and functions to be shared
   const value = {
      user,
      isAuthenticated: !!user, // A handy boolean to check if a user is logged in
      login,
      logout,
   };

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Create a custom hook for easy access to the context
export const useAuth = () => {
   const context = useContext(AuthContext);
   if (context === undefined) {
      throw new Error("useAuth must be used within an AuthProvider");
   }
   return context;
};
