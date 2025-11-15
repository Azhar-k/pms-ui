import { useLoaderData, Link, useSearchParams } from "react-router";
import { reservationAPI, type PaginatedResponse } from "../services/api";
import { Button } from "../components/Button";
import { FilterForm } from "../components/FilterForm";
import { FilterField } from "../components/FilterField";
import { DataTable } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { useTableSort } from "../hooks/useTableSort";
import { formatDisplayDate } from "../utils/dateFormat";
import { handleAPIError } from "../utils/auth";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const searchParams = {
    page: parseInt(url.searchParams.get("page") || "0"),
    size: parseInt(url.searchParams.get("size") || "10"),
    sortBy: url.searchParams.get("sortBy") || undefined,
    sortDir: url.searchParams.get("sortDir") || "desc",
    reservationNumber: url.searchParams.get("reservationNumber") || undefined,
    guestId: url.searchParams.get("guestId") ? parseInt(url.searchParams.get("guestId")!) : undefined,
    roomId: url.searchParams.get("roomId") ? parseInt(url.searchParams.get("roomId")!) : undefined,
    rateTypeId: url.searchParams.get("rateTypeId") ? parseInt(url.searchParams.get("rateTypeId")!) : undefined,
    status: url.searchParams.get("status") || undefined,
    checkInDateFrom: url.searchParams.get("checkInDateFrom") || undefined,
    checkInDateTo: url.searchParams.get("checkInDateTo") || undefined,
    checkOutDateFrom: url.searchParams.get("checkOutDateFrom") || undefined,
    checkOutDateTo: url.searchParams.get("checkOutDateTo") || undefined,
    minNumberOfGuests: url.searchParams.get("minNumberOfGuests") ? parseInt(url.searchParams.get("minNumberOfGuests")!) : undefined,
    maxNumberOfGuests: url.searchParams.get("maxNumberOfGuests") ? parseInt(url.searchParams.get("maxNumberOfGuests")!) : undefined,
    paymentStatus: url.searchParams.get("paymentStatus") || undefined,
    searchTerm: url.searchParams.get("searchTerm") || undefined,
  };

  try {
    const reservationsResponse = await reservationAPI.getAll(searchParams, request);

    // Handle both paginated response and array response for backward compatibility
    const reservationsData: PaginatedResponse<any> = Array.isArray(reservationsResponse) 
      ? { 
          content: reservationsResponse, 
          totalElements: reservationsResponse.length, 
          totalPages: 1, 
          size: reservationsResponse.length, 
          number: 0, 
          first: true, 
          last: true 
        }
      : reservationsResponse;

    return { reservationsData };
  } catch (error) {
    handleAPIError(error, request);
    return { 
      reservationsData: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true }
    };
  }
}

export default function BookingsPage() {
  const { reservationsData } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const reservations = reservationsData.content;
  const currentPage = reservationsData.number;
  const totalPages = reservationsData.totalPages;
  const totalElements = reservationsData.totalElements;
  const pageSize = reservationsData.size;

  const { handleSort, sortBy, sortDir } = useTableSort({ defaultSortDir: "desc" });

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    CHECKED_IN: "bg-green-100 text-green-800",
    CHECKED_OUT: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
    NO_SHOW: "bg-orange-100 text-orange-800",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-2 text-gray-600">Manage hotel bookings</p>
        </div>
        <Button to="/bookings/new">Create New Booking</Button>
      </div>

      {/* Filters */}
      <FilterForm clearUrl="/bookings">
        <FilterField
          label="Search"
          name="searchTerm"
          type="text"
          defaultValue={searchParams.get("searchTerm") || ""}
          placeholder="Reservation number, special requests..."
        />
        <FilterField
          label="Status"
          name="status"
          type="select"
          defaultValue={searchParams.get("status") || ""}
          options={[
            { value: "", label: "All Statuses" },
            { value: "PENDING", label: "Pending" },
            { value: "CONFIRMED", label: "Confirmed" },
            { value: "CHECKED_IN", label: "Checked In" },
            { value: "CHECKED_OUT", label: "Checked Out" },
            { value: "CANCELLED", label: "Cancelled" },
            { value: "NO_SHOW", label: "No Show" },
          ]}
        />
        <FilterField
          label="Check-in From"
          name="checkInDateFrom"
          type="date"
          defaultValue={searchParams.get("checkInDateFrom") || ""}
        />
        <FilterField
          label="Check-in To"
          name="checkInDateTo"
          type="date"
          defaultValue={searchParams.get("checkInDateTo") || ""}
        />
        <FilterField
          label="Check-out From"
          name="checkOutDateFrom"
          type="date"
          defaultValue={searchParams.get("checkOutDateFrom") || ""}
        />
        <FilterField
          label="Check-out To"
          name="checkOutDateTo"
          type="date"
          defaultValue={searchParams.get("checkOutDateTo") || ""}
        />
        <FilterField
          label="Payment Status"
          name="paymentStatus"
          type="text"
          defaultValue={searchParams.get("paymentStatus") || ""}
          placeholder="Filter by payment status"
        />
      </FilterForm>

      <DataTable
        data={reservations}
        columns={[
          {
            key: "bookingNumber",
            header: "Booking #",
            render: (reservation: any) => (
              <div className="text-sm font-medium text-gray-900">
                {reservation.reservationNumber || `#${reservation.id}`}
              </div>
            ),
          },
          {
            key: "guest",
            header: "Guest",
            render: (reservation: any) => (
              <div className="text-sm text-gray-900">
                {reservation.guest
                  ? `${reservation.guest.firstName} ${reservation.guest.lastName}`
                  : `Guest #${reservation.guestId}`}
              </div>
            ),
          },
          {
            key: "room",
            header: "Room",
            render: (reservation: any) => (
              <div className="text-sm text-gray-900">
                {reservation.room
                  ? `Room ${reservation.room.roomNumber}`
                  : `Room #${reservation.roomId}`}
              </div>
            ),
          },
          {
            key: "dates",
            header: "Dates",
            sortable: true,
            sortField: "checkInDate",
            render: (reservation: any) => (
              <>
                <div className="text-sm text-gray-900">{formatDisplayDate(reservation.checkInDate)}</div>
                <div className="text-sm text-gray-500">to {formatDisplayDate(reservation.checkOutDate)}</div>
              </>
            ),
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            render: (reservation: any) => (
              <StatusBadge status={reservation.status} colorMap={statusColors} />
            ),
          },
          {
            key: "totalAmount",
            header: "Total Amount",
            sortable: true,
            render: (reservation: any) => (
              <div className="text-sm text-gray-900">
                ₹{reservation.totalAmount?.toFixed(2) || "0.00"}
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (reservation: any) => (
              <Link
                to={`/bookings/${reservation.id}`}
                className="text-blue-600 hover:text-blue-900"
              >
                View
              </Link>
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
            ? "No bookings found. Try adjusting your filters."
            : "No bookings found. Create your first booking!"
        }
        onSort={handleSort}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  );
}
