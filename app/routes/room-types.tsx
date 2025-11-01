import { useLoaderData, Link } from "react-router";
import { roomTypeAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader() {
  try {
    const roomTypes = await roomTypeAPI.getAll();
    return { roomTypes };
  } catch (error) {
    return { roomTypes: [] };
  }
}

export default function RoomTypesPage() {
  const { roomTypes } = useLoaderData<typeof loader>();

  return (
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
  );
}

