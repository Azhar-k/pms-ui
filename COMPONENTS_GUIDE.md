# Generic Table and Filter Components Guide

## Overview

This guide documents the newly created generic components for tables and filters that can be reused across all list screens in the hotel management system.

## Components Created

### 1. `useTableSort` Hook
**Location:** `app/hooks/useTableSort.ts`

Custom hook that handles table sorting logic, managing URL parameters and providing sort handlers.

**Usage:**
```typescript
const { handleSort, getSortIcon, sortBy, sortDir } = useTableSort({ 
  defaultSortDir: "asc" // or "desc", "ASC", "DESC"
});
```

**Returns:**
- `handleSort(field: string)` - Function to handle column sorting
- `getSortIcon(field: string)` - Function to get sort icon for a field
- `sortBy` - Current sort field
- `sortDir` - Current sort direction

---

### 2. `SortableHeader` Component
**Location:** `app/components/SortableHeader.tsx`

Reusable sortable table header cell component.

**Props:**
```typescript
interface SortableHeaderProps {
  field: string;           // Field name for sorting
  label: string;           // Display label
  sortBy?: string;        // Current sort field
  sortDir?: "asc" | "desc" | "ASC" | "DESC";
  onSort: (field: string) => void;
  align?: "left" | "right" | "center";
  className?: string;
}
```

**Usage:**
```typescript
<SortableHeader
  field="lastName"
  label="Name"
  sortBy={sortBy}
  sortDir={sortDir}
  onSort={handleSort}
/>
```

---

### 3. `StatusBadge` Component
**Location:** `app/components/StatusBadge.tsx`

Reusable status badge component with customizable color mapping.

**Props:**
```typescript
interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;  // Custom color mapping
  defaultColor?: string;              // Default color class
  className?: string;
}
```

**Usage:**
```typescript
const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  CHECKED_IN: "bg-green-100 text-green-800",
};

<StatusBadge 
  status={booking.status} 
  colorMap={statusColors}
/>
```

---

### 4. `FilterField` Component
**Location:** `app/components/FilterField.tsx`

Reusable filter input field component with consistent styling.

**Props:**
```typescript
interface FilterFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "number" | "select" | "date" | "datetime-local";
  placeholder?: string;
  defaultValue?: string;
  options?: Array<{ value: string; label: string }>;  // For select type
  className?: string;
  id?: string;
}
```

**Usage:**
```typescript
// Text input
<FilterField
  label="Search"
  name="searchTerm"
  type="text"
  placeholder="Search guests..."
  defaultValue={searchParams.get("searchTerm") || ""}
/>

// Select dropdown
<FilterField
  label="Status"
  name="status"
  type="select"
  defaultValue={searchParams.get("status") || ""}
  options={[
    { value: "", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
  ]}
/>

// Date input
<FilterField
  label="Check-in Date"
  name="checkInDate"
  type="date"
  defaultValue={searchParams.get("checkInDate") || ""}
/>
```

---

### 5. `FilterForm` Component
**Location:** `app/components/FilterForm.tsx`

Generic filter form wrapper with consistent styling and behavior.

**Props:**
```typescript
interface FilterFormProps {
  children: React.ReactNode;    // Filter fields
  clearUrl: string;             // Base URL for clear button
  showPageSize?: boolean;       // Show page size selector (default: true)
  className?: string;
}
```

**Usage:**
```typescript
<FilterForm clearUrl="/guests">
  <FilterField label="Search" name="searchTerm" type="text" />
  <FilterField label="Email" name="email" type="email" />
  <FilterField label="City" name="city" type="text" />
</FilterForm>
```

**Features:**
- Automatically includes Apply/Clear buttons
- Preserves sort parameters
- Includes page size selector (optional)
- Consistent styling

---

### 6. `DataTable` Component
**Location:** `app/components/DataTable.tsx`

Generic data table component with sorting, pagination, and empty states.

**Props:**
```typescript
interface DataTableProps<T> {
  data: T[];                    // Array of data items
  columns: ColumnDef<T>[];      // Column definitions
  pagination?: {                // Optional pagination
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
  };
  emptyMessage?: string;        // Message when no data
  onSort?: (field: string) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc" | "ASC" | "DESC";
  className?: string;
}

interface ColumnDef<T> {
  key: string;                  // Unique key
  header: string;               // Column header
  sortable?: boolean;           // Is column sortable?
  sortField?: string;           // Field name for sorting (if different from key)
  align?: "left" | "right" | "center";
  render: (item: T) => ReactNode;  // Render function for cell content
}
```

**Usage:**
```typescript
<DataTable
  data={guests}
  columns={[
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortField: "lastName",
      render: (guest) => (
        <div className="text-sm font-medium text-gray-900">
          {guest.firstName} {guest.lastName}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (guest) => <div>{guest.email}</div>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (guest) => (
        <Link to={`/guests/${guest.id}`}>View</Link>
      ),
    },
  ]}
  pagination={{
    currentPage,
    totalPages,
    totalElements,
    pageSize,
  }}
  emptyMessage="No guests found."
  onSort={handleSort}
  sortBy={sortBy}
  sortDir={sortDir}
/>
```

---

## Migration Example: Before & After

### Before (Original `guests.tsx`)
- **Lines of code:** ~245 lines
- **Duplicated logic:** Sorting, filtering, table structure
- **Maintenance:** Changes require updating multiple files

### After (Refactored `guests.tsx`)
- **Lines of code:** ~180 lines (26% reduction)
- **Reusable components:** All logic abstracted
- **Maintenance:** Single source of truth

**Key Improvements:**
1. Removed duplicate `handleSort` and `getSortIcon` functions
2. Replaced manual filter form with `FilterForm` and `FilterField`
3. Replaced manual table markup with `DataTable` component
4. Cleaner, more maintainable code

---

## Migration Checklist

When migrating a screen to use the new components:

1. ✅ Import new components and hooks
2. ✅ Replace `handleSort`/`getSortIcon` with `useTableSort` hook
3. ✅ Replace filter form with `FilterForm` and `FilterField` components
4. ✅ Replace table markup with `DataTable` component
5. ✅ Define column definitions for `DataTable`
6. ✅ Test sorting, filtering, and pagination
7. ✅ Verify empty states work correctly

---

## Benefits

### Code Reduction
- **Before:** ~1,100-1,600 lines of duplicated code
- **After:** ~200-300 lines of reusable components
- **Net reduction:** ~900-1,300 lines (60-80% reduction)

### Maintainability
- Single source of truth for styling
- Easier to update UI/UX across all screens
- Consistent behavior across the application

### Developer Experience
- Faster development of new list screens
- Less boilerplate code
- Type safety with TypeScript

---

## Next Steps

1. **Migrate remaining screens:**
   - `bookings.tsx`
   - `rooms.tsx`
   - `invoices.tsx`
   - `admin.users.tsx`
   - `admin.audit-logs.tsx`

2. **Consider enhancements:**
   - Add column resizing
   - Add column visibility toggles
   - Add export functionality
   - Add bulk actions

3. **Testing:**
   - Add unit tests for components
   - Add integration tests for migrated screens

