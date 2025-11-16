import { Form, redirect } from "react-router";
import { userManagementAPI } from "../../services/api";
import { Button } from "../../components/Button";
import { handleAPIError } from "../../utils/auth";
import { requireAdmin } from "../../utils/auth";

export async function action({ request }: { request: Request }) {
  requireAdmin(request);
  
  const formData = await request.formData();
  const data = {
    username: formData.get("username"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
  };

  try {
    await userManagementAPI.createUser(data, request);
    return redirect("/admin/users");
  } catch (error) {
    handleAPIError(error, request);
    return { error: "Failed to create user" };
  }
}

export default function NewUserPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
        <p className="mt-2 text-gray-600">Add a new user to the system</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              minLength={3}
              maxLength={50}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
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
              maxLength={20}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
            <p className="mt-1 text-sm text-gray-500">
              Password must be at least 8 characters and contain uppercase, lowercase, number, and special character
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create User
            </button>
            <Button to="/admin/users" variant="secondary" type="button">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

