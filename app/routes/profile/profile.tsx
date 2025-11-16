import { useLoaderData, Form, redirect, useActionData } from "react-router";
import { useState, useEffect } from "react";
import { authAPI } from "../../services/auth";
import { Button } from "../../components/Button";
import { handleAPIError, requireAuth } from "../../utils/auth";

export async function loader({ request }: { request: Request }) {
  requireAuth(request);
  
  try {
    const user = await authAPI.getCurrentUser(request);
    return { user };
  } catch (error) {
    handleAPIError(error, request);
    throw new Response("Failed to load user profile", { status: 500 });
  }
}

export async function action({ request }: { request: Request }) {
  requireAuth(request);
  
  const formData = await request.formData();
  const actionType = formData.get("action");

  try {
    if (actionType === "updateProfile") {
      const email = formData.get("email") as string;
      const phone = formData.get("phone") as string;
      
      await authAPI.updateCurrentUser(
        {
          email: email || undefined,
          phone: phone || undefined,
        },
        request
      );
      
      return { success: true, message: "Profile updated successfully" };
    } else if (actionType === "changePassword") {
      const currentPassword = formData.get("currentPassword") as string;
      const newPassword = formData.get("newPassword") as string;
      
      await authAPI.changePassword(currentPassword, newPassword, request);
      
      return { success: true, message: "Password changed successfully" };
    }
    
    return { success: false, error: "Invalid action" };
  } catch (error) {
    handleAPIError(error, request);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return { success: false, error: errorMessage };
  }
}

export default function ProfilePage() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Hide password form after successful password change
  useEffect(() => {
    if (actionData?.success && actionData.message === "Password changed successfully") {
      setShowPasswordForm(false);
    }
  }, [actionData]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      LOCKED: "bg-yellow-100 text-yellow-800",
      DELETED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">View and manage your account information</p>
      </div>

      {/* Success/Error Messages */}
      {actionData?.success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {actionData.message}
        </div>
      )}
      {actionData?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {actionData.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">User Information</h2>
          <dl className="grid grid-cols-1 gap-4">
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
              <dt className="text-sm font-medium text-gray-500">Roles</dt>
              <dd className="mt-1">
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
                    <span className="text-sm text-gray-500">No roles</span>
                  )}
                </div>
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

        {/* Update Profile Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Update Profile</h2>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="action" value="updateProfile" />
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
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Update Profile
            </button>
          </Form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
            <button
              type="button"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showPasswordForm ? "Cancel" : "Change Password"}
            </button>
          </div>
          
          {showPasswordForm && (
            <Form method="post" className="space-y-4 max-w-md">
              <input type="hidden" name="action" value="changePassword" />
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password *
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password *
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  required
                  minLength={8}
                  pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Password must be at least 8 characters and contain uppercase, lowercase, number, and special character (@$!%*?&)
                </p>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Change Password
              </button>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}

