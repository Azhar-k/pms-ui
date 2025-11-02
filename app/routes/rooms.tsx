import { useLoaderData, Link, useNavigate, useRevalidator } from "react-router";
import { roomAPI } from "../services/api";
import { Button } from "../components/Button";
import { Form } from "react-router";
import { RoomKanbanBoard } from "../components/RoomKanbanBoard";

export async function loader() {
  try {
    const rooms = await roomAPI.getAll();
    return { rooms };
  } catch (error) {
    return { rooms: [] };
  }
}

export default function RoomsPage() {
  const { rooms } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      READY: "bg-green-100 text-green-800",
      MAINTENANCE: "bg-yellow-100 text-yellow-800",
      CLEANING: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleRoomUpdate = () => {
    // Revalidate the loader data to refresh rooms
    revalidator.revalidate();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
          <p className="mt-2 text-gray-600">Manage hotel rooms</p>
        </div>
        <Button to="/rooms/new">Add New Room</Button>
      </div>

      <div className="space-y-6">
        {/* Kanban Board */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Room Status Board</h2>
          <RoomKanbanBoard rooms={rooms} onRoomUpdate={handleRoomUpdate} />
        </div>

        {/* Table View */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Occupancy
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No rooms found. Create your first room!
                </td>
              </tr>
            ) : (
              rooms.map((room: any) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{room.roomNumber}</div>
                    {room.floor && (
                      <div className="text-sm text-gray-500">Floor {room.floor}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {room.roomType?.name || `Type ${room.roomTypeId}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        room.status
                      )}`}
                    >
                      {room.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {room.maxOccupancy || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/rooms/${room.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      to={`/rooms/${room.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

