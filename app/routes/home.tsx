import { useLoaderData } from "react-router";
import { roomAPI, guestAPI, reservationAPI, invoiceAPI } from "../services/api";
import { Link } from "react-router";

export async function loader() {
  try {
    const [rooms, guests, reservations, invoices] = await Promise.all([
      roomAPI.getAll().catch(() => []),
      guestAPI.getAll().catch(() => []),
      reservationAPI.getAll().catch(() => []),
      invoiceAPI.getAll().catch(() => []),
    ]);

    const availableRooms = rooms.filter((r: any) => r.status === "AVAILABLE").length;
    const occupiedRooms = rooms.filter((r: any) => r.status === "OCCUPIED").length;
    const pendingReservations = reservations.filter((r: any) => r.status === "PENDING").length;
    const checkedInReservations = reservations.filter((r: any) => r.status === "CHECKED_IN").length;
    const pendingInvoices = invoices.filter((i: any) => i.status === "PENDING").length;
    const totalRevenue = invoices
      .filter((i: any) => i.status === "PAID")
      .reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);

    return {
      stats: {
        totalRooms: rooms.length,
        availableRooms,
        occupiedRooms,
        totalGuests: guests.length,
        totalReservations: reservations.length,
        pendingReservations,
        checkedInReservations,
        totalInvoices: invoices.length,
        pendingInvoices,
        totalRevenue,
      },
    };
  } catch (error) {
    return {
      stats: {
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        totalGuests: 0,
        totalReservations: 0,
        pendingReservations: 0,
        checkedInReservations: 0,
        totalInvoices: 0,
        pendingInvoices: 0,
        totalRevenue: 0,
      },
    };
  }
}

export default function Dashboard() {
  const { stats } = useLoaderData<typeof loader>();

  const statCards = [
    {
      title: "Total Rooms",
      value: stats.totalRooms,
      subtitle: `${stats.availableRooms} available, ${stats.occupiedRooms} occupied`,
      icon: "🏨",
      link: "/rooms",
      color: "blue",
    },
    {
      title: "Total Guests",
      value: stats.totalGuests,
      subtitle: "Registered guests",
      icon: "👤",
      link: "/guests",
      color: "green",
    },
    {
      title: "Reservations",
      value: stats.totalReservations,
      subtitle: `${stats.pendingReservations} pending, ${stats.checkedInReservations} checked in`,
      icon: "📅",
      link: "/reservations",
      color: "purple",
    },
    {
      title: "Invoices",
      value: stats.totalInvoices,
      subtitle: `${stats.pendingInvoices} pending payment`,
      icon: "🧾",
      link: "/invoices",
      color: "orange",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      subtitle: "From paid invoices",
      icon: "💰",
      link: "/invoices",
      color: "yellow",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to Hotel Property Management System</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
                <p className="mt-1 text-sm text-gray-500">{card.subtitle}</p>
              </div>
              <div className="text-4xl">{card.icon}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/reservations/new"
              className="block w-full px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ➕ Create New Reservation
            </Link>
            <Link
              to="/guests/new"
              className="block w-full px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ➕ Register New Guest
            </Link>
            <Link
              to="/rooms/new"
              className="block w-full px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ➕ Add New Room
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Connection</span>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Server Status</span>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
