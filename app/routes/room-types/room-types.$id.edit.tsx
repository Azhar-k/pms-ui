import { Form, useLoaderData, redirect } from "react-router";
import { roomTypeAPI } from "../../services/api";
import { Button } from "../../components/Button";

export async function loader({ params, request }: { params: { id: string }; request: Request }) {
  try {
    const roomType = await roomTypeAPI.getById(Number(params.id), request);
    return { roomType };
  } catch (error) {
    throw new Response("Room type not found", { status: 404 });
  }
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const formData = await request.formData();
  const data = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    basePricePerNight: Number(formData.get("basePricePerNight")),
    maxOccupancy: Number(formData.get("maxOccupancy")),
    amenities: formData.get("amenities") || undefined,
    defaultRoomSize: formData.get("defaultRoomSize")
      ? Number(formData.get("defaultRoomSize"))
      : undefined,
    hasBalcony: formData.get("hasBalcony") === "true",
    hasView: formData.get("hasView") === "true",
    hasMinibar: formData.get("hasMinibar") === "true",
    hasSafe: formData.get("hasSafe") === "true",
    hasAirConditioning: formData.get("hasAirConditioning") === "true",
    bedType: formData.get("bedType") || undefined,
  };

  try {
    await roomTypeAPI.update(Number(params.id), data, request);
    return redirect(`/room-types/${params.id}`);
  } catch (error) {
    return { error: "Failed to update room type" };
  }
}

export default function EditRoomTypePage() {
  const { roomType } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Room Type</h1>
        <p className="mt-2 text-gray-600">Update room type information</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={roomType.name}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="basePricePerNight" className="block text-sm font-medium text-gray-700">
              Base Price per Night *
            </label>
            <input
              type="number"
              id="basePricePerNight"
              name="basePricePerNight"
              step="0.01"
              defaultValue={roomType.basePricePerNight}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="maxOccupancy" className="block text-sm font-medium text-gray-700">
              Max Occupancy *
            </label>
            <input
              type="number"
              id="maxOccupancy"
              name="maxOccupancy"
              defaultValue={roomType.maxOccupancy}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="defaultRoomSize" className="block text-sm font-medium text-gray-700">
                Default Room Size (sq ft)
              </label>
              <input
                type="number"
                id="defaultRoomSize"
                name="defaultRoomSize"
                defaultValue={roomType.defaultRoomSize}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label htmlFor="bedType" className="block text-sm font-medium text-gray-700">
                Bed Type
              </label>
              <input
                type="text"
                id="bedType"
                name="bedType"
                defaultValue={roomType.bedType}
                placeholder="e.g., King, Queen, Twin"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hasBalcony"
                  value="true"
                  defaultChecked={roomType.hasBalcony}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Has Balcony</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hasView"
                  value="true"
                  defaultChecked={roomType.hasView}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Has View</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hasMinibar"
                  value="true"
                  defaultChecked={roomType.hasMinibar}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Has Minibar</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hasSafe"
                  value="true"
                  defaultChecked={roomType.hasSafe}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Has Safe</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hasAirConditioning"
                  value="true"
                  defaultChecked={roomType.hasAirConditioning}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Has Air Conditioning</span>
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
              defaultValue={roomType.amenities}
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
              defaultValue={roomType.description}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit">Update Room Type</Button>
            <Button to={`/room-types/${roomType.id}`} variant="secondary">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

