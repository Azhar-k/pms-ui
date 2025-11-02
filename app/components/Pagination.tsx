import { Link, useSearchParams } from "react-router";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}

export function Pagination({ currentPage, totalPages, totalElements, pageSize }: PaginationProps) {
  const [searchParams] = useSearchParams();

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    return `?${params.toString()}`;
  };

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  if (totalPages <= 1) return null;

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        {currentPage > 0 && (
          <Link
            to={createPageUrl(currentPage - 1)}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous
          </Link>
        )}
        {currentPage < totalPages - 1 && (
          <Link
            to={createPageUrl(currentPage + 1)}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Next
          </Link>
        )}
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalElements}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {currentPage > 0 && (
              <Link
                to={createPageUrl(currentPage - 1)}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
              if (
                page === 0 ||
                page === totalPages - 1 ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <Link
                    key={page}
                    to={createPageUrl(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page + 1}
                  </Link>
                );
              } else if (
                page === currentPage - 3 ||
                page === currentPage + 3
              ) {
                return (
                  <span
                    key={page}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }
              return null;
            })}
            {currentPage < totalPages - 1 && (
              <Link
                to={createPageUrl(currentPage + 1)}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}

