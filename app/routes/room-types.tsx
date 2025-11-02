import { useLoaderData, Link } from "react-router";
import { roomTypeAPI, rateTypeAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader() {
  try {
    const [roomTypes, rateTypes] = await Promise.all([
      roomTypeAPI.getAll().catch(() => []),
      rateTypeAPI.getAll().catch(() => []),
    ]);
    return { roomTypes, rateTypes };
  } catch (error) {
    return { roomTypes: [], rateTypes: [] };
  }
}

export default function RoomTypesPage() {
  const { roomTypes, rateTypes } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8">
      {/* Room Types Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Room Types</h1>
            <p className="mt-2 text-gray-600">Manage hotel room types</p>
          </div>
          <Button to="/room-types/new">Add New Room Type</Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roomTypes.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No room types found. Create your first room type!
          </div>
        ) : (
          roomTypes.map((type: any) => (
            <div key={type.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                  <p className="text-sm text-gray-500">
                    ₹{type.basePricePerNight?.toFixed(2) || "0.00"} / night
                  </p>
                </div>
              </div>

              {type.description && (
                <p className="text-sm text-gray-600 mb-4">{type.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Max Occupancy:</span>{" "}
                  <span className="font-medium">{type.maxOccupancy}</span>
                </div>
                {type.defaultRoomSize && (
                  <div>
                    <span className="text-gray-500">Size:</span>{" "}
                    <span className="font-medium">{type.defaultRoomSize} sq ft</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {type.hasBalcony && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    Balcony
                  </span>
                )}
                {type.hasView && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    View
                  </span>
                )}
                {type.hasMinibar && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                    Minibar
                  </span>
                )}
                {type.hasSafe && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                    Safe
                  </span>
                )}
                {type.hasAirConditioning && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                    A/C
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/room-types/${type.id}`}
                  className="flex-1 text-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  View
                </Link>
                <Link
                  to={`/room-types/${type.id}/edit`}
                  className="flex-1 text-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {/* Rate Types Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rate Types</h1>
            <p className="mt-2 text-gray-600">Manage rate types and room type rates</p>
          </div>
          <Button to="/rate-types/new">Add New Rate Type</Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {rateTypes.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No rate types found. Create your first rate type!
            </div>
          ) : (
            rateTypes.map((rateType: any) => (
              <div key={rateType.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{rateType.name}</h3>
                    {rateType.description && (
                      <p className="text-sm text-gray-500 mt-1">{rateType.description}</p>
                    )}
                  </div>
                </div>

                {rateType.roomTypeRates && rateType.roomTypeRates.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Room Type Rates:</h4>
                    <div className="space-y-2">
                      {rateType.roomTypeRates.map((rate: any) => (
                        <div
                          key={rate.id}
                          className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                        >
                          <span className="text-gray-700">{rate.roomTypeName || `Type ${rate.roomTypeId}`}</span>
                          <span className="font-medium text-gray-900">
                            ₹{rate.rate?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link
                    to={`/rate-types/${rateType.id}`}
                    className="flex-1 text-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    View
                  </Link>
                  <Link
                    to={`/rate-types/${rateType.id}/edit`}
                    className="flex-1 text-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

