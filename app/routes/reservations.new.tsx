import { Form, useLoaderData, redirect, useSearchParams } from "react-router";
import { guestAPI, roomAPI, rateTypeAPI } from "../services/api";
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
    return { error: "Failed to create reservation" };
  }
}

export default function NewReservationPage() {
  const { guests, rooms, rateTypes } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const preSelectedGuestId = searchParams.get("guestId");
  const preSelectedRoomId = searchParams.get("roomId");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Reservation</h1>
        <p className="mt-2 text-gray-600">Book a room for a guest</p>
      </div>

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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a room</option>
              {rooms.map((room: any) => (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber} - {room.roomType?.name || `Type ${room.roomTypeId}`} - $
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit">Create Reservation</Button>
            <Button to="/reservations" variant="secondary">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

