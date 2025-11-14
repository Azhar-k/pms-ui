import { useLoaderData, Form, redirect } from "react-router";
import { userManagementAPI } from "../services/api";
import { Button } from "../components/Button";
import { handleAPIError } from "../utils/auth";
import { requireAdmin } from "../utils/auth";

export async function loader({ params, request }: { params: { id: string }; request: Request }) {
  requireAdmin(request);
  
  try {
    const response = await userManagementAPI.getRoleById(Number(params.id), request);
    const role = response.data;
    return { role };
  } catch (error) {
    handleAPIError(error, request);
    throw new Response("Role not found", { status: 404 });
  }
}

export async function action({ params, request }: { params: { id: string }; request: Request }) {
  requireAdmin(request);
  
  const formData = await request.formData();
  const data = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  };

  try {
    await userManagementAPI.updateRole(Number(params.id), data, request);
    return redirect(`/admin/roles/${params.id}`);
  } catch (error) {
    handleAPIError(error, request);
    return { error: "Failed to update role" };
  }
}

export default function EditRolePage() {
  const { role } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Role</h1>
        <p className="mt-2 text-gray-600">Update role information</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Role Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={role.name}
              required
              minLength={2}
              maxLength={50}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={role.description || ""}
              maxLength={255}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Update Role
            </button>
            <Button to={`/admin/roles/${role.id}`} variant="secondary" type="button">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

