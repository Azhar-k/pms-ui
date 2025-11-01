import { Form, useLoaderData, redirect } from "react-router";
import { roomAPI, roomTypeAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader() {
  try {
    const roomTypes = await roomTypeAPI.getAll();
    return { roomTypes };
  } catch (error) {
    return { roomTypes: [] };
  }
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const data = {
    roomNumber: formData.get("roomNumber"),
    roomTypeId: Number(formData.get("roomTypeId")),
    pricePerNight: Number(formData.get("pricePerNight")),
    status: formData.get("status") || "AVAILABLE",
    maxOccupancy: formData.get("maxOccupancy") ? Number(formData.get("maxOccupancy")) : undefined,
    amenities: formData.get("amenities") || undefined,
    description: formData.get("description") || undefined,
    floor: formData.get("floor") ? Number(formData.get("floor")) : undefined,
    hasBalcony: formData.get("hasBalcony") === "true",
    hasView: formData.get("hasView") === "true",
  };

  try {
    await roomAPI.create(data);
    return redirect("/rooms");
  } catch (error) {
    return { error: "Failed to create room" };
  }
}

export default function NewRoomPage() {
  const { roomTypes } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Room</h1>
        <p className="mt-2 text-gray-600">Create a new room in the hotel</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700">
              Room Number *
            </label>
            <input
              type="text"
              id="roomNumber"
              name="roomNumber"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="roomTypeId" className="block text-sm font-medium text-gray-700">
              Room Type *
            </label>
            <select
              id="roomTypeId"
              name="roomTypeId"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a room type</option>
              {roomTypes.map((type: any) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pricePerNight" className="block text-sm font-medium text-gray-700">
                Price per Night *
              </label>
              <input
                type="number"
                id="pricePerNight"
                name="pricePerNight"
                step="0.01"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="CLEANING">Cleaning</option>
                <option value="RESERVED">Reserved</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="maxOccupancy" className="block text-sm font-medium text-gray-700">
              Max Occupancy
            </label>
            <input
              type="number"
              id="maxOccupancy"
              name="maxOccupancy"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
              Floor
            </label>
            <input
              type="number"
              id="floor"
              name="floor"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasBalcony"
                name="hasBalcony"
                value="true"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasBalcony" className="ml-2 text-sm text-gray-700">
                Has Balcony
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasView"
                name="hasView"
                value="true"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasView" className="ml-2 text-sm text-gray-700">
                Has View
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="amenities" className="block text-sm font-medium text-gray-700">
              Amenities
            </label>
            <textarea
              id="amenities"
              name="amenities"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit">Create Room</Button>
            <Button to="/rooms" variant="secondary">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

