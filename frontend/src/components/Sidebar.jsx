import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Cpu,
  Layers,
  FileBarChart,
  FileText,
  UserCog,
  Wrench,
  ShieldCheck,
  Bell,
} from "lucide-react";

export default function Sidebar() {
  const { isAdmin } = useAuth();

  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotificationCount(res.data.notificationCount || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const adminLinks = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      to: "/production",
      icon: ClipboardList,
      label: "Production Log",
    },
    {
      to: "/production/add",
      icon: ClipboardList,
      label: "New Entry",
    },
    {
      to: "/reports",
      icon: FileBarChart,
      label: "Reports",
    },
    {
      to: "/pdir",
      icon: ShieldCheck,
      label: "PDIR",
    },
    {
      to: "/challans",
      icon: FileText,
      label: "Challans",
    },
    {
      to: "/gage-management",
      icon: Wrench,
      label: "Gage Management",
    },
    {
      to: "/notifications",
      icon: Bell,
      label: "Notifications",
      notification: true,
    },
    {
      to: "/machines",
      icon: Cpu,
      label: "Machines",
    },
    {
      to: "/operators",
      icon: Users,
      label: "Operators",
    },
    {
      to: "/components",
      icon: Layers,
      label: "Components",
    },
    {
      to: "/users",
      icon: UserCog,
      label: "Users",
    },
  ];

  const operatorLinks = [
    {
      to: "/production/add",
      icon: ClipboardList,
      label: "New Entry",
    },
  ];

  const links = isAdmin ? adminLinks : operatorLinks;

  return (
    <div className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-teal-700">
          Precision Portal
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/production"}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <div className="relative mr-3">
              <link.icon className="w-5 h-5" />

              {link.notification && notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </div>

            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}