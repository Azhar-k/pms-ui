import { Form, Link, useSearchParams } from "react-router";

interface FilterFormProps {
  children: React.ReactNode;
  clearUrl: string;
  showPageSize?: boolean;
  className?: string;
}

/**
 * Generic filter form wrapper with consistent styling and behavior
 */
export function FilterForm({
  children,
  clearUrl,
  showPageSize = true,
  className = "",
}: FilterFormProps) {
  const [searchParams] = useSearchParams();

  return (
    <div className={`bg-white rounded-lg shadow p-4 mb-6 ${className}`}>
      <Form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {children}
        
        {showPageSize && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Size
            </label>
            <select
              name="size"
              defaultValue={searchParams.get("size") || "10"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        )}

        <div className="md:col-span-4 flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
          <Link
            to={clearUrl}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Clear
          </Link>
        </div>

        {/* Preserve sort parameters */}
        {searchParams.get("sortBy") && (
          <input type="hidden" name="sortBy" value={searchParams.get("sortBy")!} />
        )}
        {searchParams.get("sortDir") && (
          <input type="hidden" name="sortDir" value={searchParams.get("sortDir")!} />
        )}
      </Form>
    </div>
  );
}

