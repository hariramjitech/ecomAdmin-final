import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, role }) => {
  const storedRole = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  // if (!storedRole || !token) return <Navigate to="/login" />;

    if (!token || !storedRole) {
    localStorage.clear(); // cleanup safeguard
    return <Navigate to="/login" replace />;
  }

  // If role is mismatched, send them to their own dashboard instead of login
  if (role && storedRole !== role) {
    return storedRole === "ADMIN" ? (
      <Navigate to="/admin" />
    ) : (
      <Navigate to="/user" />
    );
  }

  return children;
};

export default PrivateRoute;
