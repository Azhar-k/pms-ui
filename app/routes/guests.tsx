import { useLoaderData, Link, useSearchParams } from "react-router";
import { guestAPI, type PaginatedResponse } from "../services/api";
import { Button } from "../components/Button";
import { FilterForm } from "../components/FilterForm";
import { FilterField } from "../components/FilterField";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { useTableSort } from "../hooks/useTableSort";
import { handleAPIError } from "../utils/auth";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const searchParams = {
    page: parseInt(url.searchParams.get("page") || "0"),
    size: parseInt(url.searchParams.get("size") || "10"),
    sortBy: url.searchParams.get("sortBy") || undefined,
    sortDir: url.searchParams.get("sortDir") || "asc",
    firstName: url.searchParams.get("firstName") || undefined,
    lastName: url.searchParams.get("lastName") || undefined,
    email: url.searchParams.get("email") || undefined,
    phoneNumber: url.searchParams.get("phoneNumber") || undefined,
    city: url.searchParams.get("city") || undefined,
    state: url.searchParams.get("state") || undefined,
    country: url.searchParams.get("country") || undefined,
    identificationType: url.searchParams.get("identificationType") || undefined,
    searchTerm: url.searchParams.get("searchTerm") || undefined,
  };

  try {
    const guestsResponse = await guestAPI.getAll(searchParams, request);

    // Handle both paginated response and array response for backward compatibility
    const guestsData: PaginatedResponse<any> = Array.isArray(guestsResponse) 
      ? { 
          content: guestsResponse, 
          totalElements: guestsResponse.length, 
          totalPages: 1, 
          size: guestsResponse.length, 
          number: 0, 
          first: true, 
          last: true 
        }
      : guestsResponse;

    return { guestsData };
  } catch (error) {
    handleAPIError(error, request);
    return { 
      guestsData: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true }
    };
  }
}

export default function GuestsPage() {
  const { guestsData } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const guests = guestsData.content;
  const currentPage = guestsData.number;
  const totalPages = guestsData.totalPages;
  const totalElements = guestsData.totalElements;
  const pageSize = guestsData.size;

  const { handleSort, sortBy, sortDir } = useTableSort({ defaultSortDir: "asc" });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guests</h1>
          <p className="mt-2 text-gray-600">Manage hotel guests</p>
        </div>
        <Button to="/guests/new">Add New Guest</Button>
      </div>

      {/* Filters */}
      <FilterForm clearUrl="/guests">
        <FilterField
          label="Search"
          name="searchTerm"
          type="text"
          defaultValue={searchParams.get("searchTerm") || ""}
          placeholder="Name, email, phone, address..."
        />
        <FilterField
          label="Email"
          name="email"
          type="email"
          defaultValue={searchParams.get("email") || ""}
          placeholder="Filter by email"
        />
        <FilterField
          label="City"
          name="city"
          type="text"
          defaultValue={searchParams.get("city") || ""}
          placeholder="Filter by city"
        />
      </FilterForm>

      <DataTable
        data={guests}
        columns={[
          {
            key: "name",
            header: "Name",
            sortable: true,
            sortField: "lastName",
            render: (guest: any) => (
              <div className="text-sm font-medium text-gray-900">
                {guest.firstName} {guest.lastName}
              </div>
            ),
          },
          {
            key: "contact",
            header: "Contact",
            sortable: true,
            sortField: "email",
            render: (guest: any) => (
              <>
                <div className="text-sm text-gray-900">{guest.email || "N/A"}</div>
                <div className="text-sm text-gray-500">{guest.phoneNumber || ""}</div>
              </>
            ),
          },
          {
            key: "location",
            header: "Location",
            render: (guest: any) => (
              <>
                <div className="text-sm text-gray-900">
                  {guest.city && guest.state
                    ? `${guest.city}, ${guest.state}`
                    : guest.city || guest.state || "N/A"}
                </div>
                <div className="text-sm text-gray-500">{guest.country || ""}</div>
              </>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (guest: any) => (
              <>
                <Link
                  to={`/guests/${guest.id}`}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  View
                </Link>
                <Link
                  to={`/guests/${guest.id}/edit`}
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
            ? "No guests found. Try adjusting your filters."
            : "No guests found. Register your first guest!"
        }
        onSort={handleSort}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  );
}
