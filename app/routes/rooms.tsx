import { useLoaderData, Link, useRevalidator, useSearchParams } from "react-router";
import { roomAPI, roomTypeAPI, type PaginatedResponse } from "../services/api";
import { Button } from "../components/Button";
import { RoomKanbanBoard } from "../components/RoomKanbanBoard";
import { FilterForm } from "../components/FilterForm";
import { FilterField } from "../components/FilterField";
import { DataTable } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { useTableSort } from "../hooks/useTableSort";
import { handleAPIError } from "../utils/auth";

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
      roomAPI.getAll(searchParams, request),
      roomTypeAPI.getAll(request).catch(() => []),
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
    handleAPIError(error, request);
    return { 
      roomsData: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true },
      roomTypes: []
    };
  }
}

export default function RoomsPage() {
  const { roomsData, roomTypes } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [searchParams] = useSearchParams();

  const rooms = roomsData.content;
  const currentPage = roomsData.number;
  const totalPages = roomsData.totalPages;
  const totalElements = roomsData.totalElements;
  const pageSize = roomsData.size;

  const { handleSort, sortBy, sortDir } = useTableSort({ defaultSortDir: "asc" });

  const statusColors: Record<string, string> = {
    READY: "bg-green-100 text-green-800",
    MAINTENANCE: "bg-yellow-100 text-yellow-800",
    CLEANING: "bg-blue-100 text-blue-800",
  };

  const handleRoomUpdate = () => {
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

        {/* Filters */}
        <FilterForm clearUrl="/rooms">
          <FilterField
            label="Search"
            name="searchTerm"
            type="text"
            defaultValue={searchParams.get("searchTerm") || ""}
            placeholder="Room number, description..."
          />
          <FilterField
            label="Room Type"
            name="roomTypeId"
            type="select"
            defaultValue={searchParams.get("roomTypeId") || ""}
            options={[
              { value: "", label: "All Types" },
              ...roomTypes.map((rt: any) => ({
                value: String(rt.id),
                label: rt.name,
              })),
            ]}
          />
          <FilterField
            label="Status"
            name="status"
            type="select"
            defaultValue={searchParams.get("status") || ""}
            options={[
              { value: "", label: "All Statuses" },
              { value: "READY", label: "Ready" },
              { value: "MAINTENANCE", label: "Maintenance" },
              { value: "CLEANING", label: "Cleaning" },
            ]}
          />
        </FilterForm>

        {/* Table View */}
        <DataTable
          data={rooms}
          columns={[
            {
              key: "roomNumber",
              header: "Room Number",
              sortable: true,
              render: (room: any) => (
                <>
                  <div className="text-sm font-medium text-gray-900">{room.roomNumber}</div>
                  {room.floor && (
                    <div className="text-sm text-gray-500">Floor {room.floor}</div>
                  )}
                </>
              ),
            },
            {
              key: "type",
              header: "Type",
              render: (room: any) => (
                <div className="text-sm text-gray-900">
                  {room.roomType?.name || `Type ${room.roomTypeId}`}
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              sortable: true,
              render: (room: any) => (
                <StatusBadge status={room.status} colorMap={statusColors} />
              ),
            },
            {
              key: "maxOccupancy",
              header: "Max Occupancy",
              sortable: true,
              render: (room: any) => (
                <div className="text-sm text-gray-900">{room.maxOccupancy || "N/A"}</div>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              align: "right",
              render: (room: any) => (
                <>
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
                </>
              ),
            },
          ]}
          pagination={{
            currentPage,
            totalPages,
            totalElements,
            pageSize,
          }}
          emptyMessage={
            searchParams.toString()
              ? "No rooms found. Try adjusting your filters."
              : "No rooms found. Create your first room!"
          }
          onSort={handleSort}
          sortBy={sortBy}
          sortDir={sortDir}
        />
      </div>
    </div>
  );
}
