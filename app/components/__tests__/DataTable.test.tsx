import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "../DataTable";
import type { ColumnDef } from "../DataTable";

// Mock Pagination and SortableHeader
vi.mock("../Pagination", () => ({
  Pagination: ({ currentPage, totalPages, totalElements, pageSize }: any) => {
    if (totalPages <= 1) return null;
    return (
      <div data-testid="pagination">
        Page {currentPage + 1} of {totalPages} (Total: {totalElements}, Size: {pageSize})
      </div>
    );
  },
}));

vi.mock("../SortableHeader", () => ({
  SortableHeader: ({ label, onSort, field }: any) => (
    <th onClick={() => onSort(field)} data-testid={`sortable-${field}`}>
      {label} ⇅
    </th>
  ),
}));

interface TestItem {
  id: number;
  name: string;
  status: string;
  amount: number;
}

describe("DataTable", () => {
  const mockData: TestItem[] = [
    { id: 1, name: "Item 1", status: "Active", amount: 100 },
    { id: 2, name: "Item 2", status: "Inactive", amount: 200 },
  ];

  const columns: ColumnDef<TestItem>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortField: "name",
      render: (item) => item.name,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => item.status,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (item) => `$${item.amount}`,
    },
  ];

  describe("Rendering", () => {
    it("should render table with headers", () => {
      render(<DataTable data={mockData} columns={columns} />);
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Amount")).toBeInTheDocument();
    });

    it("should render data rows", () => {
      render(<DataTable data={mockData} columns={columns} />);
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Inactive")).toBeInTheDocument();
      expect(screen.getByText("$100")).toBeInTheDocument();
      expect(screen.getByText("$200")).toBeInTheDocument();
    });

    it("should render empty message when no data", () => {
      render(<DataTable data={[]} columns={columns} />);
      expect(screen.getByText("No items found.")).toBeInTheDocument();
    });

    it("should render custom empty message", () => {
      render(
        <DataTable
          data={[]}
          columns={columns}
          emptyMessage="No records available"
        />
      );
      expect(screen.getByText("No records available")).toBeInTheDocument();
    });

    it("should render sortable headers when sortable is true and onSort provided", () => {
      const handleSort = vi.fn();
      render(
        <DataTable
          data={mockData}
          columns={columns}
          onSort={handleSort}
          sortBy="name"
          sortDir="asc"
        />
      );
      expect(screen.getByTestId("sortable-name")).toBeInTheDocument();
    });

    it("should render non-sortable headers when sortable is false", () => {
      render(<DataTable data={mockData} columns={columns} />);
      const statusHeader = screen.getByText("Status").closest("th");
      expect(statusHeader).toBeInTheDocument();
      expect(statusHeader?.textContent).toBe("Status");
    });

    it("should apply right alignment", () => {
      render(<DataTable data={mockData} columns={columns} />);
      const amountHeader = screen.getByText("Amount").closest("th");
      expect(amountHeader).toHaveClass("text-right");
    });

    it("should apply center alignment", () => {
      const centerColumns: ColumnDef<TestItem>[] = [
        {
          key: "status",
          header: "Status",
          align: "center",
          render: (item) => item.status,
        },
      ];
      render(<DataTable data={mockData} columns={centerColumns} />);
      const statusHeader = screen.getByText("Status").closest("th");
      expect(statusHeader).toHaveClass("text-center");
    });

    it("should apply custom className", () => {
      render(
        <DataTable
          data={mockData}
          columns={columns}
          className="custom-table"
        />
      );
      const tableContainer = screen.getByText("Item 1").closest("div");
      expect(tableContainer).toHaveClass("custom-table");
    });
  });

  describe("Pagination", () => {
    it("should render pagination when totalPages > 1", () => {
      render(
        <DataTable
          data={mockData}
          columns={columns}
          pagination={{
            currentPage: 0,
            totalPages: 3,
            totalElements: 25,
            pageSize: 10,
          }}
        />
      );
      expect(screen.getByTestId("pagination")).toBeInTheDocument();
    });

    it("should not render pagination when totalPages <= 1", () => {
      render(
        <DataTable
          data={mockData}
          columns={columns}
          pagination={{
            currentPage: 0,
            totalPages: 1,
            totalElements: 2,
            pageSize: 10,
          }}
        />
      );
      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });

    it("should not render pagination when pagination prop is not provided", () => {
      render(<DataTable data={mockData} columns={columns} />);
      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });
  });

  describe("Sorting", () => {
    it("should call onSort when sortable header is clicked", async () => {
      const handleSort = vi.fn();
      render(
        <DataTable
          data={mockData}
          columns={columns}
          onSort={handleSort}
          sortBy="name"
          sortDir="asc"
        />
      );

      const sortableHeader = screen.getByTestId("sortable-name");
      await userEvent.click(sortableHeader);

      expect(handleSort).toHaveBeenCalledWith("name");
    });

    it("should use sortField when provided", async () => {
      const handleSort = vi.fn();
      const customColumns: ColumnDef<TestItem>[] = [
        {
          key: "displayName",
          header: "Display Name",
          sortable: true,
          sortField: "name", // Different from key
          render: (item) => item.name,
        },
      ];
      render(
        <DataTable
          data={mockData}
          columns={customColumns}
          onSort={handleSort}
        />
      );

      const sortableHeader = screen.getByTestId("sortable-name");
      await userEvent.click(sortableHeader);

      expect(handleSort).toHaveBeenCalledWith("name");
    });
  });
});

