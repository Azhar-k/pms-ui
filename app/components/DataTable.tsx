import type { ReactNode } from "react";
import { Pagination } from "./Pagination";
import { SortableHeader } from "./SortableHeader";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  sortField?: string;
  align?: "left" | "right" | "center";
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
  };
  emptyMessage?: string;
  onSort?: (field: string) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc" | "ASC" | "DESC";
  className?: string;
}

/**
 * Generic data table component with sorting, pagination, and empty states
 */
export function DataTable<T>({
  data,
  columns,
  pagination,
  emptyMessage = "No items found.",
  onSort,
  sortBy,
  sortDir,
  className = "",
}: DataTableProps<T>) {
  const hasFilters = false; // Could be enhanced to detect if filters are active

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => {
              if (column.sortable && onSort) {
                return (
                  <SortableHeader
                    key={column.key}
                    field={column.sortField || column.key}
                    label={column.header}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={onSort}
                    align={column.align}
                  />
                );
              }
              return (
                <th
                  key={column.key}
                  className={`px-6 py-3 ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                      ? "text-center"
                      : "text-left"
                  } text-xs font-medium text-gray-500 uppercase tracking-wider`}
                >
                  {column.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-4 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 ${
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                        ? "text-center"
                        : ""
                    } whitespace-nowrap`}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalElements={pagination.totalElements}
          pageSize={pagination.pageSize}
        />
      )}
    </div>
  );
}

