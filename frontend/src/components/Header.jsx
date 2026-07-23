import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, Menu } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-10">
      <div className="flex items-center md:hidden">
        <button className="text-gray-500 hover:text-gray-700">
          <Menu className="w-6 h-6" />
        </button>
        <span className="ml-4 font-semibold text-teal-700">
          Precision ERP
        </span>
      </div>

      <div className="hidden md:flex items-center text-sm text-gray-500">
        <span className="font-medium text-gray-700">
          Precision Components ERP
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center text-sm">
          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 mr-3">
            <User className="w-4 h-4" />
          </div>

          <div className="hidden md:block">
            <p className="font-medium text-gray-700">
              {user?.fullName || "User"}
            </p>

            <p className="text-xs text-gray-500 capitalize">
              {user?.role || "Guest"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}