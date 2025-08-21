import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserById, updateUser, deleteUser } from "../utils/api.js";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserById(id);
        setFormData(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    setFormData(prev => ({ 
      ...prev, 
      [e.target.name]: e.target.value 
    }));
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await updateUser(id, formData);
      navigate("/admin/users");
    } catch (err) {
      console.error("Error updating user:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(id);
        navigate("/admin/users");
      } catch (err) {
        console.error("Error deleting user:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading user...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white">Edit User Profile</h1>
                <p className="text-blue-100 mt-1">Update user information and settings</p>
              </div>
              
              {/* Back Button */}
              <button
                onClick={() => navigate("/admin/users")}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-white backdrop-blur-sm border border-white/30 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Users
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(formData).map((field) => {
                if (field.toLowerCase().includes("password")) return null;
                
                return (
                  <div key={field} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type="text"
                      name={field}
                      value={formData[field] || ""}
                      onChange={handleChange}
                      disabled={field === "id"}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm transition-colors ${
                        field === "id" 
                          ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed" 
                          : "bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3 sm:justify-between border-t border-gray-200">
            <button
              onClick={() => navigate("/admin/users")}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-500/20"
              >
                Delete User
              </button>
              
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;