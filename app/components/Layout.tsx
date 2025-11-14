import { Link, useLocation, Outlet } from "react-router";
import { tokenStorage } from "../services/auth";
import { useEffect, useState } from "react";
import type { UserResponse } from "../services/auth";

function LogoutButton() {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    setShowConfirm(false);
    // Submit the form to trigger the logout action
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout';
    document.body.appendChild(form);
    form.submit();
  };

  if (showConfirm) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-gray-600 mb-2">Are you sure?</div>
        <div className="flex gap-2">
          <button
            onClick={handleLogout}
            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Yes, Logout
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
    >
      <span className="mr-2">🚪</span>
      Logout
    </button>
  );
}

const navigation = [
  { name: "Front Desk", href: "/front-desk", icon: "🖥️" },
  { name: "Dashboard", href: "/", icon: "📊" },
  { name: "Bookings", href: "/bookings", icon: "📅" },
  { name: "Rooms", href: "/rooms", icon: "🏨" },
  { name: "Room Types", href: "/room-types", icon: "🛏️" },
  { name: "Guests", href: "/guests", icon: "👤" },
  { name: "Invoices", href: "/invoices", icon: "🧾" },
];

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    // Load user info from storage
    const userData = tokenStorage.getUser();
    setUser(userData);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-10">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-blue-600 text-white">
            <h1 className="text-xl font-bold">Hotel PMS</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              // Highlight both /room-types and /rate-types as active since they show the same combined page
              const isActive = location.pathname === item.href || 
                (item.href === "/room-types" && location.pathname.startsWith("/rate-types")) ||
                (item.href === "/front-desk" && location.pathname.startsWith("/front-desk"));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info and Logout */}
          <div className="border-t border-gray-200 p-4">
            {user && (
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-900">{user.username}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
                {user.roles && user.roles.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

