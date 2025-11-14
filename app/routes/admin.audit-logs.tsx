import { useLoaderData, useNavigate, useSearchParams, Form, Link } from "react-router";
import { userManagementAPI, type PaginatedResponse } from "../services/api";
import { Pagination } from "../components/Pagination";
import { DateInput } from "../components/DateInput";
import { handleAPIError } from "../utils/auth";
import { requireAdmin } from "../utils/auth";

export async function loader({ request }: { request: Request }) {
  requireAdmin(request);
  
  const url = new URL(request.url);
  
  // Convert date strings to date-time format (ISO 8601)
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");
  const startDate = startDateParam ? `${startDateParam}T00:00:00.000Z` : undefined;
  const endDate = endDateParam ? `${endDateParam}T23:59:59.999Z` : undefined;
  
  const searchParams = {
    page: parseInt(url.searchParams.get("page") || "0"),
    size: parseInt(url.searchParams.get("size") || "10"),
    sortBy: url.searchParams.get("sortBy") || "timestamp",
    sortDir: url.searchParams.get("sortDir")?.toUpperCase() || "DESC",
    userId: url.searchParams.get("userId") ? parseInt(url.searchParams.get("userId")!) : undefined,
    action: url.searchParams.get("action") || undefined,
    startDate,
    endDate,
  };

  try {
    const response = await userManagementAPI.getAuditLogs(searchParams, request);
    const auditLogsData: PaginatedResponse<any> = response.data;
    return { auditLogsData };
  } catch (error) {
    handleAPIError(error, request);
    return { 
      auditLogsData: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true }
    };
  }
}

export default function AdminAuditLogsPage() {
  const { auditLogsData } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const auditLogs = auditLogsData.content;
  const currentPage = auditLogsData.number;
  const totalPages = auditLogsData.totalPages;
  const totalElements = auditLogsData.totalElements;
  const pageSize = auditLogsData.size;

  const handleSort = (sortBy: string) => {
    const params = new URLSearchParams(searchParams);
    const currentSortBy = params.get("sortBy");
    const currentSortDir = params.get("sortDir") || "DESC";
    
    if (currentSortBy === sortBy) {
      params.set("sortDir", currentSortDir === "ASC" ? "DESC" : "ASC");
    } else {
      params.set("sortBy", sortBy);
      params.set("sortDir", "DESC");
    }
    params.set("page", "0");
    navigate(`?${params.toString()}`);
  };

  const getSortIcon = (field: string) => {
    const sortBy = searchParams.get("sortBy");
    const sortDir = searchParams.get("sortDir") || "DESC";
    if (sortBy !== field) return "⇅";
    return sortDir === "ASC" ? "↑" : "↓";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-2 text-gray-600">View system audit logs</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <Form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="number"
              name="userId"
              defaultValue={searchParams.get("userId") || ""}
              placeholder="Filter by user ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <input
              type="text"
              name="action"
              defaultValue={searchParams.get("action") || ""}
              placeholder="Filter by action"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <DateInput
            label="Start Date"
            id="startDate"
            name="startDate"
            defaultValue={searchParams.get("startDate") || ""}
          />
          <DateInput
            label="End Date"
            id="endDate"
            name="endDate"
            defaultValue={searchParams.get("endDate") || ""}
          />
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
              to="/admin/audit-logs"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Clear
            </Link>
          </div>
          {searchParams.get("sortBy") && <input type="hidden" name="sortBy" value={searchParams.get("sortBy")!} />}
          {searchParams.get("sortDir") && <input type="hidden" name="sortDir" value={searchParams.get("sortDir")!} />}
        </Form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User ID
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("action")}
              >
                <div className="flex items-center gap-1">
                  Action {getSortIcon("action")}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("timestamp")}
              >
                <div className="flex items-center gap-1">
                  Timestamp {getSortIcon("timestamp")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No audit logs found. {searchParams.toString() ? "Try adjusting your filters." : ""}
                </td>
              </tr>
            ) : (
              auditLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.userId || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.action}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-md truncate">{log.details || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.ipAddress || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}
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

