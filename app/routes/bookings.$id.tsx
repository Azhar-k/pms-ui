import { useLoaderData, Link, Form, redirect, useActionData } from "react-router";
import { reservationAPI, invoiceAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader({ params }: { params: { id: string } }) {
  try {
    const reservation = await reservationAPI.getById(Number(params.id));
    return { reservation };
  } catch (error) {
    throw new Response("Booking not found", { status: 404 });
  }
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const formData = await request.formData();
  const actionType = formData.get("action");

  try {
    if (actionType === "checkIn") {
      await reservationAPI.checkIn(Number(params.id));
    } else if (actionType === "checkOut") {
      await reservationAPI.checkOut(Number(params.id));
    } else if (actionType === "cancel") {
      await reservationAPI.cancel(Number(params.id));
    } else if (actionType === "generateInvoice") {
      const invoice = await invoiceAPI.generate(Number(params.id));
      // Redirect to the newly created invoice
      return redirect(`/invoices/${invoice.id}`);
    }
    return redirect(`/bookings/${params.id}`);
  } catch (error) {
    console.error("Error in booking action:", error);
    return { error: error instanceof Error ? error.message : "Action failed" };
  }
}

export default function BookingDetailPage() {
  const { reservation } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      CHECKED_IN: "bg-green-100 text-green-800",
      CHECKED_OUT: "bg-gray-100 text-gray-800",
      CANCELLED: "bg-red-100 text-red-800",
      NO_SHOW: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const canCheckIn = reservation.status === "CONFIRMED" || reservation.status === "PENDING";
  const canCheckOut = reservation.status === "CHECKED_IN";
  const canCancel = reservation.status !== "CHECKED_OUT" && reservation.status !== "CANCELLED";
  const canEdit = reservation.status !== "CHECKED_OUT";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Booking {reservation.reservationNumber || `#${reservation.id}`}
          </h1>
          <p className="mt-2 text-gray-600">Booking details and actions</p>
        </div>
        <Button to="/bookings" variant="secondary">
          Back to Bookings
        </Button>
      </div>

      {actionData?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Error:</p>
          <p className="text-sm">{actionData.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Information</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Booking Number</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {reservation.reservationNumber || `#${reservation.id}`}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    reservation.status
                  )}`}
                >
                  {reservation.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Guest</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {reservation.guest ? (
                  <Link
                    to={`/guests/${reservation.guestId}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    {reservation.guest.firstName} {reservation.guest.lastName}
                  </Link>
                ) : (
                  `Guest #${reservation.guestId}`
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Room</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {reservation.room ? (
                  <Link
                    to={`/rooms/${reservation.roomId}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Room {reservation.room.roomNumber}
                  </Link>
                ) : (
                  `Room #${reservation.roomId}`
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Check-in Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(reservation.checkInDate)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Check-out Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(reservation.checkOutDate)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Number of Guests</dt>
              <dd className="mt-1 text-sm text-gray-900">{reservation.numberOfGuests}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                ₹{reservation.totalAmount?.toFixed(2) || "0.00"}
              </dd>
            </div>
            {reservation.actualCheckInTime && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Actual Check-in Time</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDateTime(reservation.actualCheckInTime)}
                </dd>
              </div>
            )}
            {reservation.actualCheckOutTime && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Actual Check-out Time</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDateTime(reservation.actualCheckOutTime)}
                </dd>
              </div>
            )}
          </dl>

          {reservation.specialRequests && (
            <div className="mt-6">
              <dt className="text-sm font-medium text-gray-500">Special Requests</dt>
              <dd className="mt-1 text-sm text-gray-900">{reservation.specialRequests}</dd>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
          <div className="space-y-3">
            {canEdit && (
              <Link
                to={`/bookings/${reservation.id}/edit`}
                className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Edit Booking
              </Link>
            )}
            {canCheckIn && (
              <Form method="post">
                <input type="hidden" name="action" value="checkIn" />
                <Button type="submit" variant="success" className="w-full">
                  Check In
                </Button>
              </Form>
            )}
            {canCheckOut && (
              <Form method="post">
                <input type="hidden" name="action" value="checkOut" />
                <Button type="submit" variant="primary" className="w-full">
                  Check Out
                </Button>
              </Form>
            )}
            {canCancel && (
              <Form method="post">
                <input type="hidden" name="action" value="cancel" />
                <Button type="submit" variant="danger" className="w-full">
                  Cancel Booking
                </Button>
              </Form>
            )}
            <Form method="post">
              <input type="hidden" name="action" value="generateInvoice" />
              <button
                type="submit"
                className="w-full px-4 py-2 rounded-lg font-medium transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Invoice
              </button>
            </Form>
            <Link
              to={`/invoices?reservationId=${reservation.id}`}
              className="block w-full px-4 py-2 text-center text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              View Invoices
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

