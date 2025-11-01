import { useLoaderData, Link } from "react-router";
import { rateTypeAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader() {
  try {
    const rateTypes = await rateTypeAPI.getAll();
    return { rateTypes };
  } catch (error) {
    return { rateTypes: [] };
  }
}

export default function RateTypesPage() {
  const { rateTypes } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rate Types</h1>
          <p className="mt-2 text-gray-600">Manage rate types and room type rates</p>
        </div>
        <Button to="/rate-types/new">Add New Rate Type</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {rateTypes.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No rate types found. Create your first rate type!
          </div>
        ) : (
          rateTypes.map((rateType: any) => (
            <div key={rateType.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{rateType.name}</h3>
                  {rateType.description && (
                    <p className="text-sm text-gray-500 mt-1">{rateType.description}</p>
                  )}
                </div>
              </div>

              {rateType.roomTypeRates && rateType.roomTypeRates.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Room Type Rates:</h4>
                  <div className="space-y-2">
                    {rateType.roomTypeRates.map((rate: any) => (
                      <div
                        key={rate.id}
                        className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                      >
                        <span className="text-gray-700">{rate.roomTypeName || `Type ${rate.roomTypeId}`}</span>
                        <span className="font-medium text-gray-900">
                          ${rate.rate?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  to={`/rate-types/${rateType.id}`}
                  className="flex-1 text-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  View
                </Link>
                <Link
                  to={`/rate-types/${rateType.id}/edit`}
                  className="flex-1 text-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

