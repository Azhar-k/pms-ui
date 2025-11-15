# Code Reusability Analysis: Table and Filter Components

## Executive Summary

After analyzing the codebase, **YES, it is highly feasible and recommended** to extract generic table and filter components. There are significant patterns of code duplication across multiple screens that can be abstracted into reusable components.

## Screens Analyzed

The following screens all follow similar patterns:
- `bookings.tsx`
- `guests.tsx`
- `rooms.tsx`
- `invoices.tsx`
- `admin.users.tsx`
- `admin.audit-logs.tsx`

## Common Patterns Identified

### 1. Filter Form Patterns

**Structure (100% consistent across all screens):**
- Form wrapper: `<Form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">`
- Filter container: `<div className="bg-white rounded-lg shadow p-4 mb-6">`
- Apply/Clear buttons: Same styling and layout
- Hidden inputs: Preserve `sortBy` and `sortDir` parameters
- Page size selector: Identical options (5, 10, 20, 50)

**Filter Field Types:**
- Text inputs (searchTerm, email, username, etc.)
- Select dropdowns (status, roomTypeId, etc.)
- Date inputs (using DateInput component)
- Number inputs

**Code Duplication:**
- ~50-80 lines of filter form code duplicated per screen
- Total duplication: ~300-480 lines across 6 screens

### 2. Table Patterns

**Structure (100% consistent):**
- Table wrapper: `<div className="bg-white rounded-lg shadow overflow-hidden">`
- Table: `<table className="min-w-full divide-y divide-gray-200">`
- Header: `<thead className="bg-gray-50">`
- Body: `<tbody className="bg-white divide-y divide-gray-200">`
- Row hover: `className="hover:bg-gray-50"`

**Common Features:**
- Sortable columns with icons
- Status badges with color coding
- Action links (View, Edit)
- Empty state messages
- Pagination integration

**Code Duplication:**
- `handleSort` function: Identical logic (~15 lines) × 6 screens = 90 lines
- `getSortIcon` function: Identical logic (~8 lines) × 6 screens = 48 lines
- Table structure: ~100-150 lines × 6 screens = 600-900 lines
- Total duplication: ~738-1038 lines

### 3. Status Badge Patterns

**Pattern:**
- `getStatusColor` function with color mapping
- Badge rendering: `<span className={...}>`
- Different status values per screen, but same rendering pattern

**Code Duplication:**
- ~10-15 lines per screen × 6 screens = 60-90 lines

## Proposed Generic Components

### 1. `FilterForm` Component

**Purpose:** Generic filter form wrapper with consistent styling and behavior

**Props:**
```typescript
interface FilterFormProps {
  children: React.ReactNode;
  clearUrl: string; // Base URL for clear button
  className?: string;
}
```

**Features:**
- Consistent form layout and styling
- Apply/Clear buttons
- Hidden inputs for sort parameters
- Page size selector (optional)
- Preserves URL search params

**Estimated Code Reduction:** ~40-60 lines per screen

### 2. `FilterField` Component

**Purpose:** Reusable filter input fields with consistent styling

**Props:**
```typescript
interface FilterFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'number' | 'select' | 'date';
  placeholder?: string;
  defaultValue?: string;
  options?: Array<{ value: string; label: string }>; // For select
  className?: string;
}
```

**Features:**
- Consistent input styling
- Label handling
- Type-specific rendering
- Default value handling

**Estimated Code Reduction:** ~5-10 lines per field

### 3. `DataTable` Component

**Purpose:** Generic data table with sorting, pagination, and empty states

**Props:**
```typescript
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
  sortDir?: 'asc' | 'desc' | 'ASC' | 'DESC';
}
```

**Features:**
- Sortable columns
- Empty state handling
- Pagination integration
- Consistent styling
- Type-safe column definitions

**Estimated Code Reduction:** ~80-120 lines per screen

### 4. `SortableHeader` Component

**Purpose:** Reusable sortable table header cell

**Props:**
```typescript
interface SortableHeaderProps {
  field: string;
  label: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc' | 'ASC' | 'DESC';
  onSort: (field: string) => void;
  align?: 'left' | 'right' | 'center';
}
```

**Features:**
- Sort icon display
- Click handling
- Hover effects
- Consistent styling

**Estimated Code Reduction:** ~3-5 lines per sortable column

### 5. `StatusBadge` Component

**Purpose:** Reusable status badge with color mapping

**Props:**
```typescript
interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>; // Custom color mapping
  defaultColor?: string;
}
```

**Features:**
- Consistent badge styling
- Customizable color mapping
- Default color fallback

**Estimated Code Reduction:** ~5-10 lines per screen

### 6. `useTableSort` Hook

**Purpose:** Custom hook for table sorting logic

**Returns:**
```typescript
{
  handleSort: (field: string) => void;
  getSortIcon: (field: string) => string;
}
```

**Features:**
- Centralized sort logic
- URL parameter management
- Navigation handling

**Estimated Code Reduction:** ~20-25 lines per screen

## Benefits of Extraction

### Code Reduction
- **Current duplication:** ~1,100-1,600 lines
- **After extraction:** ~200-300 lines (component definitions)
- **Net reduction:** ~900-1,300 lines (60-80% reduction)

### Maintainability
- Single source of truth for styling
- Easier to update UI/UX across all screens
- Consistent behavior across the application

### Developer Experience
- Faster development of new list screens
- Less boilerplate code
- Type safety with TypeScript

### Testing
- Test components once, use everywhere
- Easier to maintain test coverage

## Implementation Priority

### Phase 1 (High Impact, Low Risk)
1. `useTableSort` hook - Pure logic, no UI changes
2. `SortableHeader` component - Small, isolated
3. `StatusBadge` component - Simple, reusable

### Phase 2 (High Impact, Medium Risk)
4. `FilterForm` component - More complex, but high value
5. `FilterField` component - Multiple field types

### Phase 3 (High Impact, Higher Risk)
6. `DataTable` component - Most complex, but highest value

## Migration Strategy

1. **Create components in parallel** - Don't break existing code
2. **Migrate one screen at a time** - Start with simplest (guests.tsx)
3. **Test thoroughly** - Ensure behavior matches exactly
4. **Refactor remaining screens** - Once pattern is proven

## Estimated Effort

- **Component creation:** 4-6 hours
- **Migration per screen:** 30-60 minutes
- **Testing:** 2-3 hours
- **Total:** 8-12 hours

## Conclusion

Extracting generic table and filter components is **highly recommended** and will significantly improve code maintainability, reduce duplication, and speed up future development. The patterns are consistent enough to make this a safe and valuable refactoring.

