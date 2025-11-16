import { Form, redirect, useActionData } from "react-router";
import { guestAPI } from "../../services/api";
import { Button } from "../../components/Button";
import { parseAPIError } from "../../utils/auth";

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const data = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email") || undefined,
    phoneNumber: formData.get("phoneNumber") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    country: formData.get("country") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    identificationType: formData.get("identificationType") || undefined,
    identificationNumber: formData.get("identificationNumber") || undefined,
  };

  try {
    await guestAPI.create(data, request);
    return redirect("/guests");
  } catch (error) {
    const { status, message } = parseAPIError(error);
    
    // Provide user-friendly error messages based on status code
    if (status === 409) {
      return { error: message || "A guest with this email already exists. Please use a different email." };
    } else if (status === 400) {
      return { error: message || "Validation failed. Please check your input and try again." };
    } else {
      return { error: message || "Failed to create guest. Please try again." };
    }
  }
}

export default function NewGuestPage() {
  const actionData = useActionData<typeof action>();
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Register New Guest</h1>
        <p className="mt-2 text-gray-600">Add a new guest to the system</p>
      </div>

      {actionData?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Error:</p>
          <p className="text-sm">{actionData.error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <Form method="post" className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              type="text"
              id="country"
              name="country"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="identificationType" className="block text-sm font-medium text-gray-700">
                ID Type
              </label>
              <select
                id="identificationType"
                name="identificationType"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">Select ID type</option>
                <option value="PASSPORT">Passport</option>
                <option value="DRIVER_LICENSE">Driver's License</option>
                <option value="NATIONAL_ID">National ID</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="identificationNumber" className="block text-sm font-medium text-gray-700">
                ID Number
              </label>
              <input
                type="text"
                id="identificationNumber"
                name="identificationNumber"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit">Register Guest</Button>
            <Button to="/guests" variant="secondary">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

