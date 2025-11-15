import { useLoaderData, useSearchParams } from "react-router";
import { userManagementAPI, type PaginatedResponse } from "../services/api";
import { FilterForm } from "../components/FilterForm";
import { FilterField } from "../components/FilterField";
import { DataTable } from "../components/DataTable";
import { useTableSort } from "../hooks/useTableSort";
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
  const [searchParams] = useSearchParams();

  const auditLogs = auditLogsData.content;
  const currentPage = auditLogsData.number;
  const totalPages = auditLogsData.totalPages;
  const totalElements = auditLogsData.totalElements;
  const pageSize = auditLogsData.size;

  const { handleSort, sortBy, sortDir } = useTableSort({ defaultSortDir: "DESC" });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-2 text-gray-600">View system audit logs</p>
      </div>

      {/* Filters */}
      <FilterForm clearUrl="/admin/audit-logs">
        <FilterField
          label="User ID"
          name="userId"
          type="number"
          defaultValue={searchParams.get("userId") || ""}
          placeholder="Filter by user ID"
        />
        <FilterField
          label="Action"
          name="action"
          type="text"
          defaultValue={searchParams.get("action") || ""}
          placeholder="Filter by action"
        />
        <FilterField
          label="Start Date"
          name="startDate"
          type="date"
          defaultValue={searchParams.get("startDate") || ""}
        />
        <FilterField
          label="End Date"
          name="endDate"
          type="date"
          defaultValue={searchParams.get("endDate") || ""}
        />
      </FilterForm>

      <DataTable
        data={auditLogs}
        columns={[
          {
            key: "id",
            header: "ID",
            render: (log: any) => (
              <div className="text-sm text-gray-900">{log.id}</div>
            ),
          },
          {
            key: "userId",
            header: "User ID",
            render: (log: any) => (
              <div className="text-sm text-gray-900">{log.userId || "-"}</div>
            ),
          },
          {
            key: "action",
            header: "Action",
            sortable: true,
            render: (log: any) => (
              <div className="text-sm font-medium text-gray-900">{log.action}</div>
            ),
          },
          {
            key: "details",
            header: "Details",
            render: (log: any) => (
              <div className="text-sm text-gray-900 max-w-md truncate">{log.details || "-"}</div>
            ),
          },
          {
            key: "ipAddress",
            header: "IP Address",
            render: (log: any) => (
              <div className="text-sm text-gray-900">{log.ipAddress || "-"}</div>
            ),
          },
          {
            key: "timestamp",
            header: "Timestamp",
            sortable: true,
            render: (log: any) => (
              <div className="text-sm text-gray-900">
                {log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}
              </div>
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
            ? "No audit logs found. Try adjusting your filters."
            : "No audit logs found."
        }
        onSort={handleSort}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  );
}

