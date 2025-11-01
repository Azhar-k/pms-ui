import { useLoaderData, Link } from "react-router";
import { roomTypeAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader({ params }: { params: { id: string } }) {
  try {
    const roomType = await roomTypeAPI.getById(Number(params.id));
    return { roomType };
  } catch (error) {
    throw new Response("Room type not found", { status: 404 });
  }
}

export default function RoomTypeDetailPage() {
  const { roomType } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{roomType.name}</h1>
          <p className="mt-2 text-gray-600">Room type details</p>
        </div>
        <div className="flex gap-3">
          <Button to={`/room-types/${roomType.id}/edit`}>Edit</Button>
          <Button to="/room-types" variant="secondary">
            Back to Room Types
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Room Type Information</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{roomType.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Base Price per Night</dt>
            <dd className="mt-1 text-sm text-gray-900">
              ₹{roomType.basePricePerNight?.toFixed(2) || "0.00"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Max Occupancy</dt>
            <dd className="mt-1 text-sm text-gray-900">{roomType.maxOccupancy}</dd>
          </div>
          {roomType.defaultRoomSize && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Default Room Size</dt>
              <dd className="mt-1 text-sm text-gray-900">{roomType.defaultRoomSize} sq ft</dd>
            </div>
          )}
          {roomType.bedType && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Bed Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{roomType.bedType}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6">
          <dt className="text-sm font-medium text-gray-500 mb-2">Features</dt>
          <div className="flex flex-wrap gap-2">
            {roomType.hasBalcony && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Balcony</span>
            )}
            {roomType.hasView && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">View</span>
            )}
            {roomType.hasMinibar && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                Minibar
              </span>
            )}
            {roomType.hasSafe && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Safe</span>
            )}
            {roomType.hasAirConditioning && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">A/C</span>
            )}
          </div>
        </div>

        {roomType.description && (
          <div className="mt-6">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900">{roomType.description}</dd>
          </div>
        )}

        {roomType.amenities && (
          <div className="mt-6">
            <dt className="text-sm font-medium text-gray-500">Amenities</dt>
            <dd className="mt-1 text-sm text-gray-900">{roomType.amenities}</dd>
          </div>
        )}

        <div className="mt-6">
          <Link
            to={`/rooms?roomTypeId=${roomType.id}`}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            View Rooms of This Type →
          </Link>
        </div>
      </div>
    </div>
  );
}

