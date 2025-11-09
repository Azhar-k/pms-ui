import { Link, useLocation, Outlet } from "react-router";

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

