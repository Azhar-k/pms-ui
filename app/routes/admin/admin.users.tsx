import { useLoaderData, Link, useSearchParams } from "react-router";
import { userManagementAPI, type PaginatedResponse } from "../../services/api";
import { Button } from "../../components/Button";
import { FilterForm } from "../../components/FilterForm";
import { FilterField } from "../../components/FilterField";
import { DataTable } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import { useTableSort } from "../../hooks/useTableSort";
import { handleAPIError } from "../../utils/auth";
import { requireAdmin } from "../../utils/auth";

export async function loader({ request }: { request: Request }) {
  requireAdmin(request);
  
  const url = new URL(request.url);
  const searchParams = {
    page: parseInt(url.searchParams.get("page") || "0"),
    size: parseInt(url.searchParams.get("size") || "10"),
    sortBy: url.searchParams.get("sortBy") || undefined,
    sortDir: url.searchParams.get("sortDir")?.toUpperCase() || "ASC",
    username: url.searchParams.get("username") || undefined,
    email: url.searchParams.get("email") || undefined,
    status: url.searchParams.get("status") || undefined,
  };

  try {
    const response = await userManagementAPI.getAllUsers(searchParams, request);
    const usersData: PaginatedResponse<any> = response.data;
    return { usersData };
  } catch (error) {
    handleAPIError(error, request);
    return { 
      usersData: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true }
    };
  }
}

export default function AdminUsersPage() {
  const { usersData } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const users = usersData.content;
  const currentPage = usersData.number;
  const totalPages = usersData.totalPages;
  const totalElements = usersData.totalElements;
  const pageSize = usersData.size;

  const { handleSort, sortBy, sortDir } = useTableSort({ defaultSortDir: "ASC" });

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    LOCKED: "bg-yellow-100 text-yellow-800",
    DELETED: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">Manage system users</p>
        </div>
        <Button to="/admin/users/new">Create New User</Button>
      </div>

      {/* Filters */}
      <FilterForm clearUrl="/admin/users">
        <FilterField
          label="Username"
          name="username"
          type="text"
          defaultValue={searchParams.get("username") || ""}
          placeholder="Filter by username"
        />
        <FilterField
          label="Email"
          name="email"
          type="text"
          defaultValue={searchParams.get("email") || ""}
          placeholder="Filter by email"
        />
        <FilterField
          label="Status"
          name="status"
          type="select"
          defaultValue={searchParams.get("status") || ""}
          options={[
            { value: "", label: "All Statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
            { value: "LOCKED", label: "Locked" },
            { value: "DELETED", label: "Deleted" },
          ]}
        />
      </FilterForm>

      <DataTable
        data={users}
        columns={[
          {
            key: "id",
            header: "ID",
            sortable: true,
            render: (user: any) => (
              <div className="text-sm text-gray-900">{user.id}</div>
            ),
          },
          {
            key: "username",
            header: "Username",
            sortable: true,
            render: (user: any) => (
              <div className="text-sm font-medium text-gray-900">{user.username}</div>
            ),
          },
          {
            key: "email",
            header: "Email",
            sortable: true,
            render: (user: any) => (
              <div className="text-sm text-gray-900">{user.email}</div>
            ),
          },
          {
            key: "phone",
            header: "Phone",
            render: (user: any) => (
              <div className="text-sm text-gray-900">{user.phone || "-"}</div>
            ),
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            render: (user: any) => (
              <StatusBadge status={user.status} colorMap={statusColors} />
            ),
          },
          {
            key: "roles",
            header: "Roles",
            render: (user: any) => (
              <div className="flex flex-wrap gap-1">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role: string) => (
                    <span
                      key={role}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">No roles</span>
                )}
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (user: any) => (
              <>
                <Link
                  to={`/admin/users/${user.id}`}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  View
                </Link>
                <Link
                  to={`/admin/users/${user.id}/edit`}
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
            ? "No users found. Try adjusting your filters."
            : "No users found. Create your first user!"
        }
        onSort={handleSort}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  );
}

