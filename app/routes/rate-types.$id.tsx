import { useLoaderData, Link, Form, redirect } from "react-router";
import { rateTypeAPI, roomTypeAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader({ params }: { params: { id: string } }) {
  try {
    const [rateType, roomTypes] = await Promise.all([
      rateTypeAPI.getById(Number(params.id)),
      roomTypeAPI.getAll(),
    ]);
    return { rateType, roomTypes };
  } catch (error) {
    throw new Response("Rate type not found", { status: 404 });
  }
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "addRate") {
    const data = {
      roomTypeId: Number(formData.get("roomTypeId")),
      rate: Number(formData.get("rate")),
    };
    await rateTypeAPI.addRoomTypeRate(Number(params.id), data);
  } else if (actionType === "removeRate") {
    const roomTypeId = formData.get("roomTypeId");
    if (roomTypeId) {
      await rateTypeAPI.removeRoomTypeRate(Number(params.id), Number(roomTypeId));
    }
  }

  return redirect(`/rate-types/${params.id}`);
}

export default function RateTypeDetailPage() {
  const { rateType, roomTypes } = useLoaderData<typeof loader>();
  const existingRoomTypeIds = new Set(
    (rateType.roomTypeRates || []).map((r: any) => r.roomTypeId)
  );
  const availableRoomTypes = roomTypes.filter((rt: any) => !existingRoomTypeIds.has(rt.id));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{rateType.name}</h1>
          <p className="mt-2 text-gray-600">Rate type details and room type rates</p>
        </div>
        <div className="flex gap-3">
          <Button to={`/rate-types/${rateType.id}/edit`}>Edit</Button>
          <Button to="/rate-types" variant="secondary">
            Back to Rate Types
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rate Type Information</h2>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{rateType.name}</dd>
            </div>
            {rateType.description && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{rateType.description}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Type Rates</h3>
            {rateType.roomTypeRates && rateType.roomTypeRates.length > 0 ? (
              <div className="space-y-3">
                {rateType.roomTypeRates.map((rate: any) => (
                  <div
                    key={rate.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <span className="font-medium text-gray-900">
                        {rate.roomTypeName || `Type ${rate.roomTypeId}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-gray-900">
                        ₹{rate.rate?.toFixed(2) || "0.00"}
                      </span>
                      <Form method="post">
                        <input type="hidden" name="action" value="removeRate" />
                        <input type="hidden" name="roomTypeId" value={rate.roomTypeId} />
                        <button
                          type="submit"
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </Form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No room type rates defined.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add Room Type Rate</h2>
          {availableRoomTypes.length > 0 ? (
            <Form method="post" className="space-y-4">
              <input type="hidden" name="action" value="addRate" />
              <div>
                <label htmlFor="roomTypeId" className="block text-sm font-medium text-gray-700">
                  Room Type
                </label>
                <select
                  id="roomTypeId"
                  name="roomTypeId"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="">Select a room type</option>
                  {availableRoomTypes.map((type: any) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="rate" className="block text-sm font-medium text-gray-700">
                  Rate
                </label>
                <input
                  type="number"
                  id="rate"
                  name="rate"
                  step="0.01"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <Button type="submit" className="w-full">
                Add Rate
              </Button>
            </Form>
          ) : (
            <p className="text-sm text-gray-500">All room types have rates defined.</p>
          )}
        </div>
      </div>
    </div>
  );
}

