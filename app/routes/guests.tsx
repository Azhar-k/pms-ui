import { useLoaderData, Link } from "react-router";
import { guestAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader() {
  try {
    const guests = await guestAPI.getAll();
    return { guests };
  } catch (error) {
    return { guests: [] };
  }
}

export default function GuestsPage() {
  const { guests } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guests</h1>
          <p className="mt-2 text-gray-600">Manage hotel guests</p>
        </div>
        <Button to="/guests/new">Add New Guest</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {guests.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No guests found. Register your first guest!
                </td>
              </tr>
            ) : (
              guests.map((guest: any) => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {guest.firstName} {guest.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{guest.email || "N/A"}</div>
                    <div className="text-sm text-gray-500">{guest.phoneNumber || ""}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {guest.city && guest.state
                        ? `${guest.city}, ${guest.state}`
                        : guest.city || guest.state || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">{guest.country || ""}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/guests/${guest.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      to={`/guests/${guest.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
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

