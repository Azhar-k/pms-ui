import { Form, useLoaderData, redirect, useSearchParams, useActionData } from "react-router";
import { guestAPI, roomAPI, rateTypeAPI, reservationAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader() {
  try {
    const [guests, rooms, rateTypes] = await Promise.all([
      guestAPI.getAll(),
      roomAPI.getAvailable(),
      rateTypeAPI.getAll(),
    ]);
    return { guests, rooms, rateTypes };
  } catch (error) {
    console.error("Error loading reservation form data:", error);
    return { guests: [], rooms: [], rateTypes: [] };
  }
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const data = {
    guestId: Number(formData.get("guestId")),
    roomId: Number(formData.get("roomId")),
    rateTypeId: Number(formData.get("rateTypeId")),
    checkInDate: formData.get("checkInDate"),
    checkOutDate: formData.get("checkOutDate"),
    numberOfGuests: Number(formData.get("numberOfGuests")),
    specialRequests: formData.get("specialRequests") || undefined,
  };

  try {
    await reservationAPI.create(data);
    return redirect("/reservations");
  } catch (error) {
    console.error("Error creating reservation:", error);
    return { error: error instanceof Error ? error.message : "Failed to create reservation" };
  }
}

export default function NewReservationPage() {
  const { guests, rooms, rateTypes } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const preSelectedGuestId = searchParams.get("guestId");
  const preSelectedRoomId = searchParams.get("roomId");
  const actionData = useActionData<typeof action>();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Reservation</h1>
        <p className="mt-2 text-gray-600">Book a room for a guest</p>
      </div>

      {actionData?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Error creating reservation:</p>
          <p className="text-sm">{actionData.error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="guestId" className="block text-sm font-medium text-gray-700">
              Guest *
            </label>
            <select
              id="guestId"
              name="guestId"
              defaultValue={preSelectedGuestId || ""}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select a guest</option>
              {guests.map((guest: any) => (
                <option key={guest.id} value={guest.id}>
                  {guest.firstName} {guest.lastName} {guest.email ? `(${guest.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
              Room *
            </label>
            <select
              id="roomId"
              name="roomId"
              defaultValue={preSelectedRoomId || ""}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select a room</option>
              {rooms.map((room: any) => (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber} - {room.roomType?.name || `Type ${room.roomTypeId}`} - ₹
                  {room.pricePerNight?.toFixed(2) || "0.00"}/night
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rateTypeId" className="block text-sm font-medium text-gray-700">
              Rate Type *
            </label>
            <select
              id="rateTypeId"
              name="rateTypeId"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select a rate type</option>
              {rateTypes.map((rateType: any) => (
                <option key={rateType.id} value={rateType.id}>
                  {rateType.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700">
                Check-in Date *
              </label>
              <input
                type="date"
                id="checkInDate"
                name="checkInDate"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700">
                Check-out Date *
              </label>
              <input
                type="date"
                id="checkOutDate"
                name="checkOutDate"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="numberOfGuests" className="block text-sm font-medium text-gray-700">
              Number of Guests *
            </label>
            <input
              type="number"
              id="numberOfGuests"
              name="numberOfGuests"
              min="1"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700">
              Special Requests
            </label>
            <textarea
              id="specialRequests"
              name="specialRequests"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Reservation
            </button>
            <Button to="/reservations" variant="secondary">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

