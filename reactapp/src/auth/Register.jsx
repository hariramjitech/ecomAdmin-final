import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, registerAdmin } from "../utils/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false); // toggle admin registration
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Validate password format before sending
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&]).{8,}$/;
      if (!passwordRegex.test(password)) {
        setError(
          "Password must be at least 8 chars, include uppercase, lowercase, number & special char."
        );
        return;
      }

      if (isAdmin) {
        if (adminPass !== "123") {
          setError("Invalid admin pass.");
          return;
        }
        await registerAdmin(name, email, password);
      } else {
        await registerUser(name, email, password);
      }

      navigate("/"); // redirect to login after registration
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data); // show backend validation message
      } else {
        setError("Registration failed. Try again.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleRegister}
        className="bg-white p-6 rounded-lg shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isAdmin ? "Admin Registration" : "User Registration"}
        </h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
          required
        />

        {/* Admin pass only shown if isAdmin is true */}
        {isAdmin && (
          <input
            type="password"
            placeholder="Admin Pass"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            className="w-full p-2 mb-3 border rounded"
            required
          />
        )}

        <button
          type="submit"
          className={`w-full py-2 rounded text-white ${
            isAdmin ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {isAdmin ? "Register as Admin" : "Register"}
        </button>

        <div className="text-center mt-3 text-sm">
          {!isAdmin && (
            <button
              type="button"
              className="text-red-500 hover:underline mb-2"
              onClick={() => setIsAdmin(true)}
            >
              Register as Admin
            </button>
          )}
          <p>
            Already have an account?{" "}
            <Link to="/" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
