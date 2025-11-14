import { useLoaderData, Link, Form, redirect } from "react-router";
import { userManagementAPI } from "../services/api";
import { Button } from "../components/Button";
import { handleAPIError } from "../utils/auth";
import { requireAdmin } from "../utils/auth";

export async function loader({ request }: { request: Request }) {
  requireAdmin(request);
  
  try {
    const response = await userManagementAPI.getAllRoles(request);
    const roles = response.data;
    return { roles };
  } catch (error) {
    handleAPIError(error, request);
    return { roles: [] };
  }
}

export async function action({ request }: { request: Request }) {
  requireAdmin(request);
  
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "delete") {
    const id = formData.get("id") as string;
    try {
      await userManagementAPI.deleteRole(Number(id), request);
      return redirect("/admin/roles");
    } catch (error) {
      handleAPIError(error, request);
      return { error: "Failed to delete role" };
    }
  }

  return null;
}

export default function AdminRolesPage() {
  const { roles } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="mt-2 text-gray-600">Manage system roles</p>
        </div>
        <Button to="/admin/roles/new">Create New Role</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No roles found. Create your first role!
                </td>
              </tr>
            ) : (
              roles.map((role: any) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {role.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{role.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{role.description || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {role.createdAt ? new Date(role.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/roles/${role.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      to={`/admin/roles/${role.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </Link>
                    <Form method="post" className="inline">
                      <input type="hidden" name="action" value="delete" />
                      <input type="hidden" name="id" value={role.id} />
                      <button
                        type="submit"
                        className="text-red-600 hover:text-red-900"
                        onClick={(e) => {
                          if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Delete
                      </button>
                    </Form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

