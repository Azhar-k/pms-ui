import { useLoaderData, Link } from "react-router";
import { roomAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader({ params }: { params: { id: string } }) {
  try {
    const room = await roomAPI.getById(Number(params.id));
    return { room };
  } catch (error) {
    throw new Response("Room not found", { status: 404 });
  }
}

export default function RoomDetailPage() {
  const { room } = useLoaderData<typeof loader>();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      READY: "bg-green-100 text-green-800",
      MAINTENANCE: "bg-yellow-100 text-yellow-800",
      CLEANING: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Room {room.roomNumber}</h1>
          <p className="mt-2 text-gray-600">Room details and information</p>
        </div>
        <div className="flex gap-3">
          <Button to={`/rooms/${room.id}/edit`}>Edit</Button>
          <Button to="/rooms" variant="secondary">
            Back to Rooms
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Room Information</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Room Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{room.roomNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Room Type</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {room.roomType?.name || `Type ${room.roomTypeId}`}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    room.status
                  )}`}
                >
                  {room.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Max Occupancy</dt>
              <dd className="mt-1 text-sm text-gray-900">{room.maxOccupancy || "N/A"}</dd>
            </div>
            {room.floor && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Floor</dt>
                <dd className="mt-1 text-sm text-gray-900">{room.floor}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Has Balcony</dt>
              <dd className="mt-1 text-sm text-gray-900">{room.hasBalcony ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Has View</dt>
              <dd className="mt-1 text-sm text-gray-900">{room.hasView ? "Yes" : "No"}</dd>
            </div>
          </dl>

          {room.description && (
            <div className="mt-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{room.description}</dd>
            </div>
          )}

          {room.amenities && (
            <div className="mt-6">
              <dt className="text-sm font-medium text-gray-500">Amenities</dt>
              <dd className="mt-1 text-sm text-gray-900">{room.amenities}</dd>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to={`/reservations/new?roomId=${room.id}`}
              className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Create Reservation
            </Link>
            <Button to="/rooms" variant="secondary" className="w-full">
              Back to Rooms
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

