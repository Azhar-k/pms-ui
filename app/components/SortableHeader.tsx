interface SortableHeaderProps {
  field: string;
  label: string;
  sortBy?: string;
  sortDir?: "asc" | "desc" | "ASC" | "DESC";
  onSort: (field: string) => void;
  align?: "left" | "right" | "center";
  className?: string;
}

/**
 * Reusable sortable table header cell component
 */
export function SortableHeader({
  field,
  label,
  sortBy,
  sortDir,
  onSort,
  align = "left",
  className = "",
}: SortableHeaderProps) {
  const getSortIcon = (): string => {
    if (sortBy !== field) return "⇅";
    
    const isAscending = sortDir?.toUpperCase() === "ASC" || sortDir === "asc";
    return isAscending ? "↑" : "↓";
  };

  const alignClass = {
    left: "text-left",
    right: "text-right",
    center: "text-center",
  }[align];

  return (
    <th
      className={`px-6 py-3 ${alignClass} text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label} {getSortIcon()}
      </div>
    </th>
  );
}

