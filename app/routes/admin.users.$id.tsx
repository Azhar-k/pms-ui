import { useLoaderData, Link, Form, redirect } from "react-router";
import { userManagementAPI } from "../services/api";
import { Button } from "../components/Button";
import { handleAPIError } from "../utils/auth";
import { requireAdmin } from "../utils/auth";

export async function loader({ params, request }: { params: { id: string }; request: Request }) {
  requireAdmin(request);
  
  try {
    const response = await userManagementAPI.getUserById(Number(params.id), request);
    const user = response.data;
    const rolesResponse = await userManagementAPI.getAllRoles(request);
    const allRoles = rolesResponse.data;
    return { user, allRoles };
  } catch (error) {
    handleAPIError(error, request);
    throw new Response("User not found", { status: 404 });
  }
}

export async function action({ params, request }: { params: { id: string }; request: Request }) {
  requireAdmin(request);
  
  const formData = await request.formData();
  const actionType = formData.get("action");

  try {
    if (actionType === "updateStatus") {
      const status = formData.get("status") as string;
      await userManagementAPI.updateUserStatus(Number(params.id), status, request);
    } else if (actionType === "assignRole") {
      const roleName = formData.get("roleName") as string;
      await userManagementAPI.assignRole(Number(params.id), roleName, request);
    } else if (actionType === "removeRole") {
      const roleName = formData.get("roleName") as string;
      await userManagementAPI.removeRole(Number(params.id), roleName, request);
    } else if (actionType === "delete") {
      await userManagementAPI.deleteUser(Number(params.id), request);
      return redirect("/admin/users");
    } else if (actionType === "resetPassword") {
      const newPassword = formData.get("newPassword") as string;
      await userManagementAPI.resetPassword(Number(params.id), newPassword, request);
    }
    return redirect(`/admin/users/${params.id}`);
  } catch (error) {
    handleAPIError(error, request);
    return { error: "Failed to perform action" };
  }
}

export default function AdminUserDetailPage() {
  const { user, allRoles } = useLoaderData<typeof loader>();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      LOCKED: "bg-yellow-100 text-yellow-800",
      DELETED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const availableRoles = allRoles.filter((role: any) => !user.roles?.includes(role.name));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{user.username}</h1>
          <p className="mt-2 text-gray-600">User profile and information</p>
        </div>
        <div className="flex gap-3">
          <Button to={`/admin/users/${user.id}/edit`}>Edit</Button>
          <Button to="/admin/users" variant="secondary">
            Back to Users
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* User Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">User Information</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Username</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.phone || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      user.status
                    )}`}
                  >
                    {user.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Updated At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "-"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Roles Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Roles</h2>
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role: string) => (
                    <div key={role} className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {role}
                      </span>
                      <Form method="post" className="inline">
                        <input type="hidden" name="action" value="removeRole" />
                        <input type="hidden" name="roleName" value={role} />
                        <button
                          type="submit"
                          className="text-red-600 hover:text-red-800 text-sm"
                          onClick={(e) => {
                            if (!confirm(`Remove role "${role}" from this user?`)) {
                              e.preventDefault();
                            }
                          }}
                        >
                          ×
                        </button>
                      </Form>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No roles assigned</span>
                )}
              </div>
            </div>
            {availableRoles.length > 0 && (
              <Form method="post" className="flex gap-2">
                <input type="hidden" name="action" value="assignRole" />
                <select
                  name="roleName"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a role to assign</option>
                  {availableRoles.map((role: any) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Assign Role
                </button>
              </Form>
            )}
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Update Status</h2>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="action" value="updateStatus" />
              <select
                name="status"
                defaultValue={user.status}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="LOCKED">Locked</option>
                <option value="DELETED">Deleted</option>
              </select>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Status
              </button>
            </Form>
          </div>

          {/* Reset Password */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reset Password</h2>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="action" value="resetPassword" />
              <input
                type="password"
                name="newPassword"
                placeholder="New password"
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                onClick={(e) => {
                  if (!confirm("Are you sure you want to reset this user's password?")) {
                    e.preventDefault();
                  }
                }}
              >
                Reset Password
              </button>
            </Form>
          </div>

          {/* Delete User */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h2>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="action" value="delete" />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={(e) => {
                  if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
                    e.preventDefault();
                  }
                }}
              >
                Delete User
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

