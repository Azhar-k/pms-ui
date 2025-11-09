import { useLoaderData, Link, useNavigate, useRevalidator, useSearchParams, Form } from "react-router";
import { roomAPI, roomTypeAPI, type PaginatedResponse } from "../services/api";
import { Button } from "../components/Button";
import { RoomKanbanBoard } from "../components/RoomKanbanBoard";
import { Pagination } from "../components/Pagination";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const searchParams = {
    page: parseInt(url.searchParams.get("page") || "0"),
    size: parseInt(url.searchParams.get("size") || "10"),
    sortBy: url.searchParams.get("sortBy") || undefined,
    sortDir: url.searchParams.get("sortDir") || "asc",
    roomNumber: url.searchParams.get("roomNumber") || undefined,
    roomTypeId: url.searchParams.get("roomTypeId") ? parseInt(url.searchParams.get("roomTypeId")!) : undefined,
    status: url.searchParams.get("status") || undefined,
    minMaxOccupancy: url.searchParams.get("minMaxOccupancy") ? parseInt(url.searchParams.get("minMaxOccupancy")!) : undefined,
    maxMaxOccupancy: url.searchParams.get("maxMaxOccupancy") ? parseInt(url.searchParams.get("maxMaxOccupancy")!) : undefined,
    floor: url.searchParams.get("floor") ? parseInt(url.searchParams.get("floor")!) : undefined,
    hasBalcony: url.searchParams.get("hasBalcony") === "true" ? true : url.searchParams.get("hasBalcony") === "false" ? false : undefined,
    hasView: url.searchParams.get("hasView") === "true" ? true : url.searchParams.get("hasView") === "false" ? false : undefined,
    searchTerm: url.searchParams.get("searchTerm") || undefined,
  };

  try {
    const [roomsResponse, roomTypes] = await Promise.all([
      roomAPI.getAll(searchParams),
      roomTypeAPI.getAll().catch(() => []),
    ]);

    // Handle both paginated response and array response for backward compatibility
    const roomsData: PaginatedResponse<any> = Array.isArray(roomsResponse) 
      ? { 
          content: roomsResponse, 
          totalElements: roomsResponse.length, 
          totalPages: 1, 
          size: roomsResponse.length, 
          number: 0, 
          first: true, 
          last: true 
        }
      : roomsResponse;

    return { roomsData, roomTypes };
  } catch (error) {
    return { 
      roomsData: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true },
      roomTypes: []
    };
  }
}

export default function RoomsPage() {
  const { roomsData, roomTypes } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [searchParams] = useSearchParams();

  const rooms = roomsData.content;
  const currentPage = roomsData.number;
  const totalPages = roomsData.totalPages;
  const totalElements = roomsData.totalElements;
  const pageSize = roomsData.size;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      READY: "bg-green-100 text-green-800",
      MAINTENANCE: "bg-yellow-100 text-yellow-800",
      CLEANING: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleRoomUpdate = () => {
    revalidator.revalidate();
  };

  const handleSort = (sortBy: string) => {
    const params = new URLSearchParams(searchParams);
    const currentSortBy = params.get("sortBy");
    const currentSortDir = params.get("sortDir") || "asc";
    
    if (currentSortBy === sortBy) {
      params.set("sortDir", currentSortDir === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", sortBy);
      params.set("sortDir", "asc");
    }
    params.set("page", "0"); // Reset to first page on sort
    navigate(`?${params.toString()}`);
  };

  const getSortIcon = (field: string) => {
    const sortBy = searchParams.get("sortBy");
    const sortDir = searchParams.get("sortDir") || "asc";
    if (sortBy !== field) return "⇅";
    return sortDir === "asc" ? "↑" : "↓";
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <Form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                name="searchTerm"
                defaultValue={searchParams.get("searchTerm") || ""}
                placeholder="Room number, description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
              <select
                name="roomTypeId"
                defaultValue={searchParams.get("roomTypeId") || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {roomTypes.map((rt: any) => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                defaultValue={searchParams.get("status") || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="READY">Ready</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="CLEANING">Cleaning</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Size</label>
              <select
                name="size"
                defaultValue={searchParams.get("size") || "10"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <div className="md:col-span-4 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <Link
                to="/rooms"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear
              </Link>
            </div>
            {/* Preserve other params */}
            {searchParams.get("sortBy") && <input type="hidden" name="sortBy" value={searchParams.get("sortBy")!} />}
            {searchParams.get("sortDir") && <input type="hidden" name="sortDir" value={searchParams.get("sortDir")!} />}
          </Form>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("roomNumber")}
              >
                <div className="flex items-center gap-1">
                  Room Number {getSortIcon("roomNumber")}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-1">
                  Status {getSortIcon("status")}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("maxOccupancy")}
              >
                <div className="flex items-center gap-1">
                  Max Occupancy {getSortIcon("maxOccupancy")}
                </div>
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
                  No rooms found. {searchParams.toString() ? "Try adjusting your filters." : "Create your first room!"}
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
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
          />
        )}
      </div>
      </div>
    </div>
  );
}
