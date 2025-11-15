interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
  defaultColor?: string;
  className?: string;
}

/**
 * Reusable status badge component with customizable color mapping
 */
export function StatusBadge({
  status,
  colorMap = {},
  defaultColor = "bg-gray-100 text-gray-800",
  className = "",
}: StatusBadgeProps) {
  const colorClass = colorMap[status] || defaultColor;

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass} ${className}`}
    >
      {status}
    </span>
  );
}

