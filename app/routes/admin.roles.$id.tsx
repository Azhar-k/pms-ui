import { useLoaderData, Link } from "react-router";
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

export default function AdminRoleDetailPage() {
  const { role } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{role.name}</h1>
          <p className="mt-2 text-gray-600">Role details</p>
        </div>
        <div className="flex gap-3">
          <Button to={`/admin/roles/${role.id}/edit`}>Edit</Button>
          <Button to="/admin/roles" variant="secondary">
            Back to Roles
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Role Information</h2>
        <dl className="grid grid-cols-1 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">ID</dt>
            <dd className="mt-1 text-sm text-gray-900">{role.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{role.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900">{role.description || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created At</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {role.createdAt ? new Date(role.createdAt).toLocaleString() : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Updated At</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {role.updatedAt ? new Date(role.updatedAt).toLocaleString() : "-"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

