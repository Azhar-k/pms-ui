import { useNavigate, useSearchParams } from "react-router";

interface UseTableSortOptions {
  defaultSortDir?: "asc" | "desc" | "ASC" | "DESC";
}

/**
 * Custom hook for handling table sorting logic
 * Manages URL parameters for sorting and provides sort handlers
 */
export function useTableSort(options: UseTableSortOptions = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { defaultSortDir = "asc" } = options;

  const handleSort = (sortBy: string) => {
    const params = new URLSearchParams(searchParams);
    const currentSortBy = params.get("sortBy");
    const currentSortDir = params.get("sortDir") || defaultSortDir;
    
    if (currentSortBy === sortBy) {
      // Toggle sort direction
      const newSortDir = 
        currentSortDir.toUpperCase() === "ASC" || currentSortDir === "asc"
          ? (defaultSortDir === "ASC" ? "DESC" : "desc")
          : (defaultSortDir === "ASC" ? "ASC" : "asc");
      params.set("sortDir", newSortDir);
    } else {
      // Set new sort field
      params.set("sortBy", sortBy);
      params.set("sortDir", defaultSortDir);
    }
    params.set("page", "0"); // Reset to first page on sort
    navigate(`?${params.toString()}`);
  };

  const getSortIcon = (field: string): string => {
    const sortBy = searchParams.get("sortBy");
    const sortDir = searchParams.get("sortDir") || defaultSortDir;
    
    if (sortBy !== field) return "⇅";
    
    const isAscending = sortDir.toUpperCase() === "ASC" || sortDir === "asc";
    return isAscending ? "↑" : "↓";
  };

  return {
    handleSort,
    getSortIcon,
    sortBy: searchParams.get("sortBy") || undefined,
    sortDir: (searchParams.get("sortDir") || defaultSortDir) as "asc" | "desc" | "ASC" | "DESC",
  };
}

