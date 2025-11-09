import { useLoaderData, Link, useNavigate, useSearchParams, Form } from "react-router";
import { invoiceAPI, type PaginatedResponse } from "../services/api";
import { Button } from "../components/Button";
import { Pagination } from "../components/Pagination";
import { formatDisplayDate } from "../utils/dateFormat";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const searchParams = {
    page: parseInt(url.searchParams.get("page") || "0"),
    size: parseInt(url.searchParams.get("size") || "10"),
    sortBy: url.searchParams.get("sortBy") || undefined,
    sortDir: url.searchParams.get("sortDir") || "desc",
    invoiceNumber: url.searchParams.get("invoiceNumber") || undefined,
    reservationId: url.searchParams.get("reservationId") ? parseInt(url.searchParams.get("reservationId")!) : undefined,
    status: url.searchParams.get("status") || undefined,
    issuedDateFrom: url.searchParams.get("issuedDateFrom") || undefined,
    issuedDateTo: url.searchParams.get("issuedDateTo") || undefined,
    paidDateFrom: url.searchParams.get("paidDateFrom") || undefined,
    paidDateTo: url.searchParams.get("paidDateTo") || undefined,
    dueDateFrom: url.searchParams.get("dueDateFrom") || undefined,
    dueDateTo: url.searchParams.get("dueDateTo") || undefined,
    paymentMethod: url.searchParams.get("paymentMethod") || undefined,
    searchTerm: url.searchParams.get("searchTerm") || undefined,
  };

  try {
    const invoicesResponse = await invoiceAPI.getAll(searchParams);

    // Handle both paginated response and array response for backward compatibility
    const invoicesData: PaginatedResponse<any> = Array.isArray(invoicesResponse) 
      ? { 
          content: invoicesResponse, 
          totalElements: invoicesResponse.length, 
          totalPages: 1, 
          size: invoicesResponse.length, 
          number: 0, 
          first: true, 
          last: true 
        }
      : invoicesResponse;

    return { invoicesData };
  } catch (error) {
    return { 
      invoicesData: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true }
    };
  }
}

export default function InvoicesPage() {
  const { invoicesData } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const invoices = invoicesData.content;
  const currentPage = invoicesData.number;
  const totalPages = invoicesData.totalPages;
  const totalElements = invoicesData.totalElements;
  const pageSize = invoicesData.size;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PAID: "bg-green-100 text-green-800",
      PARTIALLY_PAID: "bg-blue-100 text-blue-800",
      OVERDUE: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      REFUNDED: "bg-orange-100 text-orange-800",
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
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-2 text-gray-600">Manage hotel invoices</p>
        </div>
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
              placeholder="Invoice number, notes..."
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
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issued Date From</label>
            <input
              type="datetime-local"
              name="issuedDateFrom"
              defaultValue={searchParams.get("issuedDateFrom") || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issued Date To</label>
            <input
              type="datetime-local"
              name="issuedDateTo"
              defaultValue={searchParams.get("issuedDateTo") || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date From</label>
            <input
              type="datetime-local"
              name="dueDateFrom"
              defaultValue={searchParams.get("dueDateFrom") || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date To</label>
            <input
              type="datetime-local"
              name="dueDateTo"
              defaultValue={searchParams.get("dueDateTo") || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <input
              type="text"
              name="paymentMethod"
              defaultValue={searchParams.get("paymentMethod") || ""}
              placeholder="Filter by payment method"
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
              to="/invoices"
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
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booking
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("issuedDate")}
              >
                <div className="flex items-center gap-1">
                  Issue Date {getSortIcon("issuedDate")}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("dueDate")}
              >
                <div className="flex items-center gap-1">
                  Due Date {getSortIcon("dueDate")}
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
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No invoices found. {searchParams.toString() ? "Try adjusting your filters." : ""}
                </td>
              </tr>
            ) : (
              invoices.map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber || `#${invoice.id}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {invoice.reservation ? (
                        <Link
                          to={`/bookings/${invoice.reservationId}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Booking #{invoice.reservation.id}
                        </Link>
                      ) : (
                        `Booking #${invoice.reservationId}`
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDisplayDate(invoice.issuedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDisplayDate(invoice.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{invoice.totalAmount?.toFixed(2) || "0.00"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/invoices/${invoice.id}`}
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
