import { useLoaderData, Form, redirect } from "react-router";
import { userManagementAPI } from "../services/api";
import { Button } from "../components/Button";
import { handleAPIError } from "../utils/auth";
import { requireAdmin } from "../utils/auth";

export async function loader({ params, request }: { params: { id: string }; request: Request }) {
  requireAdmin(request);
  
  try {
    const response = await userManagementAPI.getUserById(Number(params.id), request);
    const user = response.data;
    return { user };
  } catch (error) {
    handleAPIError(error, request);
    throw new Response("User not found", { status: 404 });
  }
}

export async function action({ params, request }: { params: { id: string }; request: Request }) {
  requireAdmin(request);
  
  const formData = await request.formData();
  const data = {
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
  };

  try {
    await userManagementAPI.updateUser(Number(params.id), data, request);
    return redirect(`/admin/users/${params.id}`);
  } catch (error) {
    handleAPIError(error, request);
    return { error: "Failed to update user" };
  }
}

export default function EditUserPage() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
        <p className="mt-2 text-gray-600">Update user information</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={user.username}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-gray-500">Username cannot be changed</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={user.email || ""}
              maxLength={100}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              defaultValue={user.phone || ""}
              maxLength={20}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Update User
            </button>
            <Button to={`/admin/users/${user.id}`} variant="secondary" type="button">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

