import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Public routes
  route("login", "routes/login/login.tsx"),
  route("logout", "routes/logout/logout.tsx"),
  
  // Protected routes - require authentication
  layout("components/ProtectedLayout.tsx", [
    index("routes/home/home.tsx"),
    route("rooms", "routes/rooms/rooms.tsx"),
    route("rooms/new", "routes/rooms/rooms.new.tsx"),
    route("rooms/:id", "routes/rooms/rooms.$id.tsx"),
    route("rooms/:id/edit", "routes/rooms/rooms.$id.edit.tsx"),
    route("room-types", "routes/room-types/room-types.tsx"),
    route("room-types/new", "routes/room-types/room-types.new.tsx"),
    route("room-types/:id", "routes/room-types/room-types.$id.tsx"),
    route("room-types/:id/edit", "routes/room-types/room-types.$id.edit.tsx"),
    route("rate-types", "routes/rate-types/rate-types.tsx"),
    route("rate-types/new", "routes/rate-types/rate-types.new.tsx"),
    route("rate-types/:id", "routes/rate-types/rate-types.$id.tsx"),
    route("rate-types/:id/edit", "routes/rate-types/rate-types.$id.edit.tsx"),
    route("guests", "routes/guests/guests.tsx"),
    route("guests/new", "routes/guests/guests.new.tsx"),
    route("guests/:id", "routes/guests/guests.$id.tsx"),
    route("guests/:id/edit", "routes/guests/guests.$id.edit.tsx"),
    route("bookings", "routes/bookings/bookings.tsx"),
    route("bookings/new", "routes/bookings/bookings.new.tsx"),
    route("bookings/:id/edit", "routes/bookings/bookings.$id.edit.tsx"),
    route("bookings/:id", "routes/bookings/bookings.$id.tsx"),
    route("front-desk", "routes/front-desk/front-desk.tsx"),
    route("invoices", "routes/invoices/invoices.tsx"),
    route("invoices/:id", "routes/invoices/invoices.$id.tsx"),
    route("profile", "routes/profile/profile.tsx"),
    // Admin routes
    route("admin/users", "routes/admin/admin.users.tsx"),
    route("admin/users/new", "routes/admin/admin.users.new.tsx"),
    route("admin/users/:id", "routes/admin/admin.users.$id.tsx"),
    route("admin/users/:id/edit", "routes/admin/admin.users.$id.edit.tsx"),
    route("admin/roles", "routes/admin/admin.roles.tsx"),
    route("admin/roles/new", "routes/admin/admin.roles.new.tsx"),
    route("admin/roles/:id", "routes/admin/admin.roles.$id.tsx"),
    route("admin/roles/:id/edit", "routes/admin/admin.roles.$id.edit.tsx"),
    route("admin/audit-logs", "routes/admin/admin.audit-logs.tsx"),
  ]),
] satisfies RouteConfig;
