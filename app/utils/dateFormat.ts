/**
 * Formats a date to dd/mm/yyyy format
 */
export function formatDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  
  const d = typeof date === "string" ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(d.getTime())) return "N/A";
  
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formats a date-time to dd/mm/yyyy HH:mm format
 */
export function formatDisplayDateTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  
  const d = typeof date === "string" ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(d.getTime())) return "N/A";
  
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

