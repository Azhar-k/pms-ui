import { Form, useLoaderData, redirect } from "react-router";
import { rateTypeAPI, roomTypeAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader({ request }: { request: Request }) {
  try {
    const roomTypes = await roomTypeAPI.getAll(request);
    return { roomTypes };
  } catch (error) {
    return { roomTypes: [] };
  }
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const data = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    roomTypeRates: [] as any[],
  };

  // Collect room type rates
  const roomTypeIds = formData.getAll("roomTypeId");
  const rates = formData.getAll("rate");

  roomTypeIds.forEach((roomTypeId, index) => {
    if (roomTypeId && rates[index]) {
      data.roomTypeRates.push({
        roomTypeId: Number(roomTypeId),
        rate: Number(rates[index]),
      });
    }
  });

  try {
    await rateTypeAPI.create(data, request);
    return redirect("/rate-types");
  } catch (error) {
    return { error: "Failed to create rate type" };
  }
}

export default function NewRateTypePage() {
  const { roomTypes } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Rate Type</h1>
        <p className="mt-2 text-gray-600">Create a new rate type with room type rates</p>
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
              required
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Room Type Rates
            </label>
            <div className="space-y-3">
              {roomTypes.map((roomType: any, index: number) => (
                <div key={roomType.id} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600">{roomType.name}</label>
                  </div>
                  <div className="w-32">
                    <input
                      type="hidden"
                      name="roomTypeId"
                      value={roomType.id}
                    />
                    <input
                      type="number"
                      name="rate"
                      step="0.01"
                      placeholder="0.00"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit">Create Rate Type</Button>
            <Button to="/rate-types" variant="secondary">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

