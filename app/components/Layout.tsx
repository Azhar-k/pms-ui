import { Link, useLocation, Outlet } from "react-router";
import { tokenStorage } from "../services/auth";
import { useEffect, useState, useRef } from "react";
import type { UserResponse } from "../services/auth";

function LogoutButton({ isExpanded }: { isExpanded: boolean }) {
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

  if (showConfirm && isExpanded) {
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
      onClick={() => isExpanded ? setShowConfirm(true) : handleLogout()}
      className={`${isExpanded ? 'w-full' : 'w-10 h-10'} flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors`}
      title={!isExpanded ? "Logout" : undefined}
    >
      <span className={isExpanded ? "mr-2" : ""}>🚪</span>
      {isExpanded && <span>Logout</span>}
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartExpanded = useRef<boolean>(false);

  useEffect(() => {
    // Load user info from storage
    const userData = tokenStorage.getUser();
    setUser(userData);
  }, []);

  const hasMoved = useRef<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragStartX.current = e.clientX;
    dragStartExpanded.current = isExpanded;
    e.preventDefault();
  };

  const handleDragHandleClick = (e: React.MouseEvent) => {
    // Only toggle on click if there was no drag movement
    if (!hasMoved.current) {
      setIsExpanded(!isExpanded);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStartX.current;
      
      // Track if mouse has moved significantly
      if (Math.abs(deltaX) > 5) {
        hasMoved.current = true;
      }
      
      // If dragged more than 50px, toggle state
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0 && !dragStartExpanded.current) {
          setIsExpanded(true);
          setIsDragging(false);
        } else if (deltaX < 0 && dragStartExpanded.current) {
          setIsExpanded(false);
          setIsDragging(false);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const sidebarWidth = isExpanded ? 'w-64' : 'w-20';
  const contentPadding = isExpanded ? 'pl-64' : 'pl-20';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 ${sidebarWidth} bg-white shadow-lg z-10 transition-all duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full relative">
          {/* Drag Handle */}
          <div
            onMouseDown={handleMouseDown}
            onClick={handleDragHandleClick}
            className="absolute right-0 top-0 bottom-0 w-2 cursor-pointer hover:bg-blue-300 bg-transparent transition-colors z-20 group"
            title={isExpanded ? "Click or drag left to collapse" : "Click or drag right to expand"}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-colors" />
          </div>

          {/* Expand Arrow Button - Only visible when collapsed */}
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="absolute right-0 top-20 -mr-3 w-6 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg shadow-md flex items-center justify-center transition-colors z-30"
              title="Expand menu"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* Collapse Arrow Button - Only visible when expanded */}
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute right-0 top-20 -mr-3 w-6 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg shadow-md flex items-center justify-center transition-colors z-30"
              title="Collapse menu"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Logo */}
          <div className={`flex items-center justify-center h-16 px-4 bg-blue-600 text-white transition-all duration-300 ${
            isExpanded ? '' : 'px-2'
          }`}>
            {isExpanded ? (
              <h1 className="text-xl font-bold">Hotel PMS</h1>
            ) : (
              <h1 className="text-xl font-bold">H</h1>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              // Highlight both /room-types and /rate-types as active since they show the same combined page
              const isActive = location.pathname === item.href || 
                (item.href === "/room-types" && location.pathname.startsWith("/rate-types")) ||
                (item.href === "/front-desk" && location.pathname.startsWith("/front-desk"));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${isExpanded ? 'justify-start' : 'justify-center'}`}
                  title={!isExpanded ? item.name : undefined}
                >
                  <span className={`text-lg ${isExpanded ? 'mr-3' : ''}`}>{item.icon}</span>
                  {isExpanded && (
                    <span className="whitespace-nowrap">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info and Logout */}
          <div className={`border-t border-gray-200 p-4 transition-all duration-300 ${isExpanded ? '' : 'px-2'}`}>
            {user && isExpanded && (
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-900 truncate">{user.username}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
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
            <div className={isExpanded ? '' : 'flex justify-center'}>
              <LogoutButton isExpanded={isExpanded} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${contentPadding} transition-all duration-300 ease-in-out`}>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

