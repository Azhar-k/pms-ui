import { DateInput } from "./DateInput";

interface FilterFieldOption {
  value: string;
  label: string;
}

interface FilterFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "number" | "select" | "date" | "datetime-local";
  placeholder?: string;
  defaultValue?: string;
  options?: FilterFieldOption[];
  className?: string;
  id?: string;
}

/**
 * Reusable filter input field component with consistent styling
 */
export function FilterField({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  options,
  className = "",
  id,
}: FilterFieldProps) {
  const fieldId = id || name;
  const baseInputClasses =
    "w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  if (type === "date") {
    return (
      <DateInput
        label={label}
        id={fieldId}
        name={name}
        defaultValue={defaultValue}
        className={className}
      />
    );
  }

  if (type === "select") {
    return (
      <div>
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
        <select
          id={fieldId}
          name={name}
          defaultValue={defaultValue || ""}
          className={`${baseInputClasses} ${className}`}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <input
        type={type}
        id={fieldId}
        name={name}
        defaultValue={defaultValue || ""}
        placeholder={placeholder}
        className={`${baseInputClasses} ${className}`}
      />
    </div>
  );
}

