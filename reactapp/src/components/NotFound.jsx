import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const storedRole = localStorage.getItem("role");
  
  // Determine the home route based on role
  const homeRoute = storedRole === "ADMIN" ? "/admin/products" : 
                   storedRole === "USER" ? "/user/products" : 
                   "/login";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 text-center px-4">
      <h1 className="text-8xl font-extrabold text-red-600 drop-shadow-lg">404</h1>
      <p className="text-2xl md:text-3xl font-semibold text-gray-800 mt-4">
        Oops! The page you're looking for doesn’t exist.
      </p>
      <p className="text-lg text-gray-600 mt-2 max-w-md">
        It seems you’ve wandered off the path. Let’s get you back on track!
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Link
          to="/login"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
        >
          Go to Login
        </Link>
        <Link
          to={homeRoute}
          className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-200"
        >
          Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;