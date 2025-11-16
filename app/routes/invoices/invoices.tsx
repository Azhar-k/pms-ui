import { useLoaderData, Link, useSearchParams } from "react-router";
import { invoiceAPI, type PaginatedResponse } from "../../services/api";
import { FilterForm } from "../../components/FilterForm";
import { FilterField } from "../../components/FilterField";
import { DataTable } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import { useTableSort } from "../../hooks/useTableSort";
import { formatDisplayDate } from "../../utils/dateFormat";
import { handleAPIError } from "../../utils/auth";

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
    const invoicesResponse = await invoiceAPI.getAll(searchParams, request);

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
    handleAPIError(error, request);
    return { 
      invoicesData: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true }
    };
  }
}

export default function InvoicesPage() {
  const { invoicesData } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const invoices = invoicesData.content;
  const currentPage = invoicesData.number;
  const totalPages = invoicesData.totalPages;
  const totalElements = invoicesData.totalElements;
  const pageSize = invoicesData.size;

  const { handleSort, sortBy, sortDir } = useTableSort({ defaultSortDir: "desc" });

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    PARTIALLY_PAID: "bg-blue-100 text-blue-800",
    OVERDUE: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    REFUNDED: "bg-orange-100 text-orange-800",
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
      <FilterForm clearUrl="/invoices">
        <FilterField
          label="Search"
          name="searchTerm"
          type="text"
          defaultValue={searchParams.get("searchTerm") || ""}
          placeholder="Invoice number, notes..."
        />
        <FilterField
          label="Status"
          name="status"
          type="select"
          defaultValue={searchParams.get("status") || ""}
          options={[
            { value: "", label: "All Statuses" },
            { value: "PENDING", label: "Pending" },
            { value: "PAID", label: "Paid" },
            { value: "PARTIALLY_PAID", label: "Partially Paid" },
            { value: "OVERDUE", label: "Overdue" },
            { value: "CANCELLED", label: "Cancelled" },
            { value: "REFUNDED", label: "Refunded" },
          ]}
        />
        <FilterField
          label="Issued Date From"
          name="issuedDateFrom"
          type="date"
          defaultValue={searchParams.get("issuedDateFrom") || ""}
        />
        <FilterField
          label="Issued Date To"
          name="issuedDateTo"
          type="date"
          defaultValue={searchParams.get("issuedDateTo") || ""}
        />
        <FilterField
          label="Due Date From"
          name="dueDateFrom"
          type="date"
          defaultValue={searchParams.get("dueDateFrom") || ""}
        />
        <FilterField
          label="Due Date To"
          name="dueDateTo"
          type="date"
          defaultValue={searchParams.get("dueDateTo") || ""}
        />
        <FilterField
          label="Payment Method"
          name="paymentMethod"
          type="text"
          defaultValue={searchParams.get("paymentMethod") || ""}
          placeholder="Filter by payment method"
        />
      </FilterForm>

      <DataTable
        data={invoices}
        columns={[
          {
            key: "invoiceNumber",
            header: "Invoice #",
            render: (invoice: any) => (
              <div className="text-sm font-medium text-gray-900">
                {invoice.invoiceNumber || `#${invoice.id}`}
              </div>
            ),
          },
          {
            key: "booking",
            header: "Booking",
            render: (invoice: any) => (
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
            ),
          },
          {
            key: "issuedDate",
            header: "Issue Date",
            sortable: true,
            render: (invoice: any) => (
              <div className="text-sm text-gray-900">
                {formatDisplayDate(invoice.issuedDate)}
              </div>
            ),
          },
          {
            key: "dueDate",
            header: "Due Date",
            sortable: true,
            render: (invoice: any) => (
              <div className="text-sm text-gray-900">
                {formatDisplayDate(invoice.dueDate)}
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            render: (invoice: any) => (
              <StatusBadge status={invoice.status} colorMap={statusColors} />
            ),
          },
          {
            key: "totalAmount",
            header: "Total Amount",
            sortable: true,
            render: (invoice: any) => (
              <div className="text-sm font-medium text-gray-900">
                ₹{invoice.totalAmount?.toFixed(2) || "0.00"}
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (invoice: any) => (
              <Link
                to={`/invoices/${invoice.id}`}
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
            ? "No invoices found. Try adjusting your filters."
            : "No invoices found."
        }
        onSort={handleSort}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  );
}
