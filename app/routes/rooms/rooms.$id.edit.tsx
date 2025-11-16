import { Form, useLoaderData, redirect } from "react-router";
import { roomAPI, roomTypeAPI } from "../../services/api";
import { Button } from "../../components/Button";

export async function loader({ params, request }: { params: { id: string }; request: Request }) {
  try {
    const [room, roomTypes] = await Promise.all([
      roomAPI.getById(Number(params.id), request),
      roomTypeAPI.getAll(request),
    ]);
    return { room, roomTypes };
  } catch (error) {
    throw new Response("Room not found", { status: 404 });
  }
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const formData = await request.formData();
  const data = {
    roomNumber: formData.get("roomNumber"),
    roomTypeId: Number(formData.get("roomTypeId")),
    status: formData.get("status") || "READY",
    maxOccupancy: formData.get("maxOccupancy") ? Number(formData.get("maxOccupancy")) : undefined,
    amenities: formData.get("amenities") || undefined,
    description: formData.get("description") || undefined,
    floor: formData.get("floor") ? Number(formData.get("floor")) : undefined,
    hasBalcony: formData.get("hasBalcony") === "true",
    hasView: formData.get("hasView") === "true",
  };

  try {
    await roomAPI.update(Number(params.id), data, request);
    return redirect(`/rooms/${params.id}`);
  } catch (error) {
    return { error: "Failed to update room" };
  }
}

export default function EditRoomPage() {
  const { room, roomTypes } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Room</h1>
        <p className="mt-2 text-gray-600">Update room information</p>
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
              defaultValue={room.roomNumber}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="roomTypeId" className="block text-sm font-medium text-gray-700">
              Room Type *
            </label>
            <select
              id="roomTypeId"
              name="roomTypeId"
              defaultValue={room.roomTypeId}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {roomTypes.map((type: any) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={room.status}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="READY">Ready</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="CLEANING">Cleaning</option>
            </select>
          </div>

          <div>
            <label htmlFor="maxOccupancy" className="block text-sm font-medium text-gray-700">
              Max Occupancy
            </label>
            <input
              type="number"
              id="maxOccupancy"
              name="maxOccupancy"
              defaultValue={room.maxOccupancy}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
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
              defaultValue={room.floor}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasBalcony"
                name="hasBalcony"
                value="true"
                defaultChecked={room.hasBalcony}
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
                defaultChecked={room.hasView}
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
              defaultValue={room.amenities}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
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
              defaultValue={room.description}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit">Update Room</Button>
            <Button to={`/rooms/${room.id}`} variant="secondary">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

