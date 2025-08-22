// components/Profile.jsx
import React, { useEffect, useState } from "react";
import { getUserById } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("User not logged in");
        setLoading(false);
        return;
      }

      try {
        const response = await getUserById(userId);
        setUser(response.data);
      } catch (err) {
        setError("Failed to fetch user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);
  
const handleLogout = () => {
  localStorage.clear();
  console.log("After logout:", { ...localStorage }); // check what's left
  navigate("/login");
};


  if (loading) {
    return <div className="text-center mt-10">Loading profile...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Profile</h2>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Logout
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md">{user.name}</div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md">{user.email}</div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md capitalize">{user.role.toLowerCase()}</div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md">{user.id}</div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700">Created At</label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md">
                {new Date(user.createdAt).toLocaleString()}
              </div>
            </div>
            {user.lastLogin && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">Last Login</label>
                <div className="mt-1 p-2 bg-gray-50 rounded-md">
                  {new Date(user.lastLogin).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}