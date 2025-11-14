import { useLoaderData, Link, useNavigate, useSearchParams, Form } from "react-router";
import { guestAPI, type PaginatedResponse } from "../services/api";
import { Button } from "../components/Button";
import { Pagination } from "../components/Pagination";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const guests = guestsData.content;
  const currentPage = guestsData.number;
  const totalPages = guestsData.totalPages;
  const totalElements = guestsData.totalElements;
  const pageSize = guestsData.size;

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
          <h1 className="text-3xl font-bold text-gray-900">Guests</h1>
          <p className="mt-2 text-gray-600">Manage hotel guests</p>
        </div>
        <Button to="/guests/new">Add New Guest</Button>
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
              placeholder="Name, email, phone, address..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              defaultValue={searchParams.get("email") || ""}
              placeholder="Filter by email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              defaultValue={searchParams.get("city") || ""}
              placeholder="Filter by city"
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
              to="/guests"
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
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("lastName")}
              >
                <div className="flex items-center gap-1">
                  Name {getSortIcon("lastName")}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center gap-1">
                  Contact {getSortIcon("email")}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {guests.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No guests found. {searchParams.toString() ? "Try adjusting your filters." : "Register your first guest!"}
                </td>
              </tr>
            ) : (
              guests.map((guest: any) => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {guest.firstName} {guest.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{guest.email || "N/A"}</div>
                    <div className="text-sm text-gray-500">{guest.phoneNumber || ""}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {guest.city && guest.state
                        ? `${guest.city}, ${guest.state}`
                        : guest.city || guest.state || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">{guest.country || ""}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
