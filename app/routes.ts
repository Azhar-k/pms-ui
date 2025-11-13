import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Public routes
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  
  // Protected routes - require authentication
  layout("components/ProtectedLayout.tsx", [
    index("routes/home.tsx"),
    route("rooms", "routes/rooms.tsx"),
    route("rooms/new", "routes/rooms.new.tsx"),
    route("rooms/:id", "routes/rooms.$id.tsx"),
    route("rooms/:id/edit", "routes/rooms.$id.edit.tsx"),
    route("room-types", "routes/room-types.tsx"),
    route("room-types/new", "routes/room-types.new.tsx"),
    route("room-types/:id", "routes/room-types.$id.tsx"),
    route("room-types/:id/edit", "routes/room-types.$id.edit.tsx"),
    route("rate-types", "routes/rate-types.tsx"),
    route("rate-types/new", "routes/rate-types.new.tsx"),
    route("rate-types/:id", "routes/rate-types.$id.tsx"),
    route("rate-types/:id/edit", "routes/rate-types.$id.edit.tsx"),
    route("guests", "routes/guests.tsx"),
    route("guests/new", "routes/guests.new.tsx"),
    route("guests/:id", "routes/guests.$id.tsx"),
    route("guests/:id/edit", "routes/guests.$id.edit.tsx"),
    route("bookings", "routes/bookings.tsx"),
    route("bookings/new", "routes/bookings.new.tsx"),
    route("bookings/:id/edit", "routes/bookings.$id.edit.tsx"),
    route("bookings/:id", "routes/bookings.$id.tsx"),
    route("front-desk", "routes/front-desk.tsx"),
    route("invoices", "routes/invoices.tsx"),
    route("invoices/:id", "routes/invoices.$id.tsx"),
  ]),
] satisfies RouteConfig;
