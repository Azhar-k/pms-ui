import { useLoaderData, Link, useNavigate, useSearchParams, Form } from "react-router";
import { reservationAPI, type PaginatedResponse } from "../services/api";
import { Button } from "../components/Button";
import { Pagination } from "../components/Pagination";
import { DateInput } from "../components/DateInput";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const reservations = reservationsData.content;
  const currentPage = reservationsData.number;
  const totalPages = reservationsData.totalPages;
  const totalElements = reservationsData.totalElements;
  const pageSize = reservationsData.size;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      CHECKED_IN: "bg-green-100 text-green-800",
      CHECKED_OUT: "bg-gray-100 text-gray-800",
      CANCELLED: "bg-red-100 text-red-800",
      NO_SHOW: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };


  const handleSort = (sortBy: string) => {
    const params = new URLSearchParams(searchParams);
    const currentSortBy = params.get("sortBy");
    const currentSortDir = params.get("sortDir") || "desc";
    
    if (currentSortBy === sortBy) {
      params.set("sortDir", currentSortDir === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", sortBy);
      params.set("sortDir", "desc");
    }
    params.set("page", "0"); // Reset to first page on sort
    navigate(`?${params.toString()}`);
  };

  const getSortIcon = (field: string) => {
    const sortBy = searchParams.get("sortBy");
    const sortDir = searchParams.get("sortDir") || "desc";
    if (sortBy !== field) return "⇅";
    return sortDir === "asc" ? "↑" : "↓";
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
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <Form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              name="searchTerm"
              defaultValue={searchParams.get("searchTerm") || ""}
              placeholder="Reservation number, special requests..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={searchParams.get("status") || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
          <DateInput
            label="Check-in From"
            id="checkInDateFrom"
            name="checkInDateFrom"
            defaultValue={searchParams.get("checkInDateFrom") || ""}
          />
          <DateInput
            label="Check-in To"
            id="checkInDateTo"
            name="checkInDateTo"
            defaultValue={searchParams.get("checkInDateTo") || ""}
          />
          <DateInput
            label="Check-out From"
            id="checkOutDateFrom"
            name="checkOutDateFrom"
            defaultValue={searchParams.get("checkOutDateFrom") || ""}
          />
          <DateInput
            label="Check-out To"
            id="checkOutDateTo"
            name="checkOutDateTo"
            defaultValue={searchParams.get("checkOutDateTo") || ""}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <input
              type="text"
              name="paymentStatus"
              defaultValue={searchParams.get("paymentStatus") || ""}
              placeholder="Filter by payment status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              to="/bookings"
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booking #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guest
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("checkInDate")}
              >
                <div className="flex items-center gap-1">
                  Dates {getSortIcon("checkInDate")}
                </div>
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
                onClick={() => handleSort("totalAmount")}
              >
                <div className="flex items-center gap-1">
                  Total Amount {getSortIcon("totalAmount")}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No bookings found. {searchParams.toString() ? "Try adjusting your filters." : "Create your first booking!"}
                </td>
              </tr>
            ) : (
              reservations.map((reservation: any) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {reservation.reservationNumber || `#${reservation.id}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {reservation.guest
                        ? `${reservation.guest.firstName} ${reservation.guest.lastName}`
                        : `Guest #${reservation.guestId}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {reservation.room
                        ? `Room ${reservation.room.roomNumber}`
                        : `Room #${reservation.roomId}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDisplayDate(reservation.checkInDate)}</div>
                    <div className="text-sm text-gray-500">to {formatDisplayDate(reservation.checkOutDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        reservation.status
                      )}`}
                    >
                      {reservation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{reservation.totalAmount?.toFixed(2) || "0.00"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/bookings/${reservation.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
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
  );
}
