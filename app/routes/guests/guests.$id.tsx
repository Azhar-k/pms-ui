import { useLoaderData, Link } from "react-router";
import { guestAPI } from "../../services/api";
import { Button } from "../../components/Button";

export async function loader({ params, request }: { params: { id: string }; request: Request }) {
  try {
    const guest = await guestAPI.getById(Number(params.id), request);
    return { guest };
  } catch (error) {
    throw new Response("Guest not found", { status: 404 });
  }
}

export default function GuestDetailPage() {
  const { guest } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {guest.firstName} {guest.lastName}
          </h1>
          <p className="mt-2 text-gray-600">Guest profile and information</p>
        </div>
        <div className="flex gap-3">
          <Button to={`/guests/${guest.id}/edit`}>Edit</Button>
          <Button to="/guests" variant="secondary">
            Back to Guests
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Guest Information</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">First Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{guest.firstName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{guest.lastName}</dd>
            </div>
            {guest.email && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{guest.email}</dd>
              </div>
            )}
            {guest.phoneNumber && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{guest.phoneNumber}</dd>
              </div>
            )}
            {guest.address && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{guest.address}</dd>
              </div>
            )}
            {guest.city && (
              <div>
                <dt className="text-sm font-medium text-gray-500">City</dt>
                <dd className="mt-1 text-sm text-gray-900">{guest.city}</dd>
              </div>
            )}
            {guest.state && (
              <div>
                <dt className="text-sm font-medium text-gray-500">State</dt>
                <dd className="mt-1 text-sm text-gray-900">{guest.state}</dd>
              </div>
            )}
            {guest.postalCode && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Postal Code</dt>
                <dd className="mt-1 text-sm text-gray-900">{guest.postalCode}</dd>
              </div>
            )}
            {guest.country && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Country</dt>
                <dd className="mt-1 text-sm text-gray-900">{guest.country}</dd>
              </div>
            )}
            {guest.identificationType && (
              <div>
                <dt className="text-sm font-medium text-gray-500">ID Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{guest.identificationType}</dd>
              </div>
            )}
            {guest.identificationNumber && (
              <div>
                <dt className="text-sm font-medium text-gray-500">ID Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{guest.identificationNumber}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to={`/bookings/new?guestId=${guest.id}`}
              className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Create Booking
            </Link>
            <Link
              to={`/bookings?guestId=${guest.id}`}
              className="block w-full px-4 py-2 text-center text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              View Bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

