import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import RoomsPage, { loader } from "../../rooms/rooms";
import { roomAPI, roomTypeAPI } from "../../../services/api";

// Mock the API
vi.mock("../../../services/api", () => ({
  roomAPI: {
    getAll: vi.fn(),
  },
  roomTypeAPI: {
    getAll: vi.fn(),
  },
}));

// Mock the Button component
vi.mock("../../../components/Button", () => ({
  Button: ({ to, children, ...props }: any) => {
    if (to) {
      return <a href={to}>{children}</a>;
    }
    return <button {...props}>{children}</button>;
  },
}));

// Mock the RoomKanbanBoard component
vi.mock("../../../components/RoomKanbanBoard", () => ({
  RoomKanbanBoard: ({ rooms }: any) => (
    <div data-testid="room-kanban-board">
      {rooms.length} rooms
    </div>
  ),
}));

// Mock the FilterForm and FilterField components
vi.mock("../../../components/FilterForm", () => ({
  FilterForm: ({ children, clearUrl }: any) => (
    <form data-testid="filter-form" action={clearUrl}>
      {children}
    </form>
  ),
}));

vi.mock("../../../components/FilterField", () => ({
  FilterField: ({ label, name, type, defaultValue, options }: any) => (
    <div>
      <label htmlFor={name}>{label}</label>
      {type === "select" ? (
        <select id={name} name={name} defaultValue={defaultValue}>
          {options?.map((opt: any) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input type={type} id={name} name={name} defaultValue={defaultValue} />
      )}
    </div>
  ),
}));

// Mock the DataTable component
vi.mock("../../../components/DataTable", () => ({
  DataTable: ({ data, columns, emptyMessage }: any) => {
    if (data.length === 0) {
      return <div>{emptyMessage}</div>;
    }
    return (
      <table>
        <thead>
          <tr>
            {columns.map((col: any) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item: any, idx: number) => (
            <tr key={item.id || idx}>
              {columns.map((col: any) => (
                <td key={col.key}>{col.render ? col.render(item) : item[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

// Mock the StatusBadge component
vi.mock("../../../components/StatusBadge", () => ({
  StatusBadge: ({ status }: any) => <span data-testid="status-badge">{status}</span>,
}));

// Mock handleAPIError
vi.mock("../../../utils/auth", () => ({
  handleAPIError: vi.fn(),
}));

const mockRooms = [
  {
    id: 1,
    roomNumber: "101",
    roomType: { id: 1, name: "Deluxe" },
    roomTypeId: 1,
    status: "READY",
    maxOccupancy: 2,
    floor: 1,
  },
  {
    id: 2,
    roomNumber: "102",
    roomType: { id: 2, name: "Standard" },
    roomTypeId: 2,
    status: "MAINTENANCE",
    maxOccupancy: 1,
    floor: 1,
  },
];

const mockRoomTypes = [
  { id: 1, name: "Deluxe" },
  { id: 2, name: "Standard" },
];

const mockPaginatedResponse = {
  content: mockRooms,
  totalElements: 2,
  totalPages: 1,
  size: 10,
  number: 0,
  first: true,
  last: true,
};

describe("RoomsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/rooms"]) => {
    return createMemoryRouter(
      [
        {
          path: "/rooms",
          element: <RoomsPage />,
          loader: loader,
        },
      ],
      {
        initialEntries,
      }
    );
  };

  describe("Loader", () => {
    it("should load rooms successfully", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);

      const request = new Request("http://localhost/rooms");
      const result = await loader({ request });

      expect(result.roomsData.content).toHaveLength(2);
      expect(result.roomTypes).toHaveLength(2);
      expect(roomAPI.getAll).toHaveBeenCalled();
      expect(roomTypeAPI.getAll).toHaveBeenCalled();
    });

    it("should handle search parameters", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);

      const request = new Request("http://localhost/rooms?page=1&size=20&status=READY&roomTypeId=1");
      const result = await loader({ request });

      expect(roomAPI.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          size: 20,
          status: "READY",
          roomTypeId: 1,
        }),
        expect.any(Request)
      );
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(roomAPI.getAll).mockRejectedValue(new Error("API Error"));
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue([]);

      const request = new Request("http://localhost/rooms");
      const result = await loader({ request });

      expect(result.roomsData.content).toEqual([]);
      expect(result.roomsData.totalElements).toBe(0);
    });

    it("should handle array response for backward compatibility", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue(mockRooms);
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);

      const request = new Request("http://localhost/rooms");
      const result = await loader({ request });

      expect(result.roomsData.content).toHaveLength(2);
      expect(result.roomsData.totalElements).toBe(2);
    });
  });

  describe("Rendering", () => {
    it("should render rooms page with title and description", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Rooms")).toBeInTheDocument();
        expect(screen.getByText("Manage hotel rooms")).toBeInTheDocument();
      });
    });

    it("should render 'Add New Room' button", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const addButton = screen.getByText("Add New Room");
        expect(addButton).toBeInTheDocument();
        expect(addButton.closest("a")).toHaveAttribute("href", "/rooms/new");
      });
    });

    it("should render Room Status Board", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Room Status Board")).toBeInTheDocument();
        expect(screen.getByTestId("room-kanban-board")).toBeInTheDocument();
      });
    });

    it("should render filter form", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-form")).toBeInTheDocument();
        expect(screen.getByLabelText("Search")).toBeInTheDocument();
        expect(screen.getByLabelText("Room Type")).toBeInTheDocument();
        expect(screen.getByLabelText("Status")).toBeInTheDocument();
      });
    });

    it("should render rooms table", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const table = screen.getByRole("table");
        const withinTable = within(table);
        
        expect(withinTable.getByText("Room Number")).toBeInTheDocument();
        expect(withinTable.getByText("Type")).toBeInTheDocument();
        expect(withinTable.getByText("Status")).toBeInTheDocument();
        expect(withinTable.getByText("Max Occupancy")).toBeInTheDocument();
        expect(withinTable.getByText("Actions")).toBeInTheDocument();
      });
    });

    it("should render room data in table", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const table = screen.getByRole("table");
        const withinTable = within(table);
        
        expect(withinTable.getByText("101")).toBeInTheDocument();
        expect(withinTable.getByText("Deluxe")).toBeInTheDocument();
        expect(withinTable.getByText("READY")).toBeInTheDocument();
      });
    });

    it("should render empty state when no rooms", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
      });
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText(/No rooms found. Create your first room!/)).toBeInTheDocument();
      });
    });

    it("should render View and Edit links for each room", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const viewLinks = screen.getAllByText("View");
        const editLinks = screen.getAllByText("Edit");

        expect(viewLinks).toHaveLength(2);
        expect(editLinks).toHaveLength(2);

        expect(viewLinks[0].closest("a")).toHaveAttribute("href", "/rooms/1");
        expect(editLinks[0].closest("a")).toHaveAttribute("href", "/rooms/1/edit");
      });
    });
  });
});

