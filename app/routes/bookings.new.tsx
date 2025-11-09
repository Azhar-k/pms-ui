import { Form, useLoaderData, redirect, useSearchParams, useActionData } from "react-router";
import { guestAPI, roomAPI, rateTypeAPI, reservationAPI } from "../services/api";
import { Button } from "../components/Button";
import { useState, useEffect } from "react";

export async function loader() {
  try {
    const [guestsResponse, rateTypes] = await Promise.all([
      guestAPI.getAll(),
      rateTypeAPI.getAll(),
    ]);
    // Handle paginated response
    const guests = Array.isArray(guestsResponse) 
      ? guestsResponse 
      : guestsResponse.content || [];
    return { guests, rateTypes };
  } catch (error) {
    console.error("Error loading booking form data:", error);
    return { guests: [], rateTypes: [] };
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
    return redirect("/bookings");
  } catch (error) {
    console.error("Error creating booking:", error);
    return { error: error instanceof Error ? error.message : "Failed to create booking" };
  }
}

export default function NewBookingPage() {
  const { guests, rateTypes } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const preSelectedGuestId = searchParams.get("guestId");
  const preSelectedRoomId = searchParams.get("roomId");
  const actionData = useActionData<typeof action>();
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (checkInDate && checkOutDate) {
        // Validate that check-out is after check-in
        if (new Date(checkOutDate) <= new Date(checkInDate)) {
          setRooms([]);
          return;
        }
        
        setLoadingRooms(true);
        try {
          const availableRooms = await roomAPI.getAvailableForDateRange(checkInDate, checkOutDate);
          setRooms(availableRooms);
        } catch (error) {
          console.error("Error fetching available rooms:", error);
          setRooms([]);
        } finally {
          setLoadingRooms(false);
        }
      } else {
        // If dates are not selected, use default available rooms endpoint
        try {
          const availableRooms = await roomAPI.getAvailable();
          setRooms(availableRooms);
        } catch (error) {
          console.error("Error fetching available rooms:", error);
          setRooms([]);
        }
      }
    };

    fetchAvailableRooms();
  }, [checkInDate, checkOutDate]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Booking</h1>
        <p className="mt-2 text-gray-600">Book a room for a guest</p>
      </div>

      {actionData?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Error creating booking:</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700">
                Check-in Date *
              </label>
              <input
                type="date"
                id="checkInDate"
                name="checkInDate"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
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
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
              Room * {loadingRooms && <span className="text-sm text-gray-500">(Loading...)</span>}
            </label>
            <select
              id="roomId"
              name="roomId"
              defaultValue={preSelectedRoomId || ""}
              required
              disabled={loadingRooms}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a room {checkInDate && checkOutDate ? `(for ${checkInDate} to ${checkOutDate})` : ""}</option>
              {rooms.length === 0 && !loadingRooms && checkInDate && checkOutDate && (
                <option value="" disabled>No rooms available for selected dates</option>
              )}
              {rooms.map((room: any) => (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber} - {room.roomType?.name || `Type ${room.roomTypeId}`}
                </option>
              ))}
            </select>
            {checkInDate && checkOutDate && new Date(checkOutDate) <= new Date(checkInDate) && (
              <p className="mt-1 text-sm text-red-600">Check-out date must be after check-in date</p>
            )}
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
              Create Booking
            </button>
            <Button to="/bookings" variant="secondary">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

