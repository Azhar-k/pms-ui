import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import Dashboard, { loader } from "../../home/home";
import { roomAPI, guestAPI, reservationAPI, invoiceAPI } from "../../../services/api";

// Mock the API
vi.mock("../../../services/api", () => ({
  roomAPI: {
    getAll: vi.fn(),
  },
  guestAPI: {
    getAll: vi.fn(),
  },
  reservationAPI: {
    getAll: vi.fn(),
  },
  invoiceAPI: {
    getAll: vi.fn(),
  },
}));

// Mock handleAPIError to allow testing error handling
vi.mock("../../../utils/auth", async () => {
  const actual = await vi.importActual("../../../utils/auth");
  return {
    ...actual,
    requireAuth: vi.fn(),
    handleAPIError: vi.fn((error, request) => {
      if (error instanceof Error && error.message === "API Error") {
        return; // Don't throw for this specific test
      }
      return (actual as any).handleAPIError(error, request);
    }),
  };
});

const mockRooms = [
  { id: 1, status: "READY" },
  { id: 2, status: "READY" },
  { id: 3, status: "MAINTENANCE" },
];

const mockGuests = [
  { id: 1, firstName: "John", lastName: "Doe" },
  { id: 2, firstName: "Jane", lastName: "Smith" },
];

const mockReservations = [
  { id: 1, status: "PENDING" },
  { id: 2, status: "CHECKED_IN" },
  { id: 3, status: "CONFIRMED" },
];

const mockInvoices = [
  { id: 1, status: "PENDING", totalAmount: 1000 },
  { id: 2, status: "PAID", totalAmount: 2000 },
  { id: 3, status: "PAID", totalAmount: 1500 },
];

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/"]) => {
    return createMemoryRouter(
      [
        {
          path: "/",
          element: <Dashboard />,
          loader: loader,
        },
      ],
      {
        initialEntries,
      }
    );
  };

  describe("Loader", () => {
    it("should load dashboard stats successfully", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue({ content: mockRooms });
      vi.mocked(guestAPI.getAll).mockResolvedValue({ content: mockGuests });
      vi.mocked(reservationAPI.getAll).mockResolvedValue({ content: mockReservations });
      vi.mocked(invoiceAPI.getAll).mockResolvedValue({ content: mockInvoices });

      const request = new Request("http://localhost/");
      const result = await loader({ request });

      expect(result.stats.totalRooms).toBe(3);
      expect(result.stats.readyRooms).toBe(2);
      expect(result.stats.maintenanceRooms).toBe(1);
      expect(result.stats.totalGuests).toBe(2);
      expect(result.stats.totalReservations).toBe(3);
      expect(result.stats.pendingReservations).toBe(1);
      expect(result.stats.checkedInReservations).toBe(1);
      expect(result.stats.totalInvoices).toBe(3);
      expect(result.stats.pendingInvoices).toBe(1);
      expect(result.stats.totalRevenue).toBe(3500);
    });

    it("should handle array response for backward compatibility", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue(mockRooms);
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockReservations);
      vi.mocked(invoiceAPI.getAll).mockResolvedValue(mockInvoices);

      const request = new Request("http://localhost/");
      const result = await loader({ request });

      expect(result.stats.totalRooms).toBe(3);
      expect(result.stats.totalGuests).toBe(2);
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(roomAPI.getAll).mockRejectedValue(new Error("API Error"));
      vi.mocked(guestAPI.getAll).mockRejectedValue(new Error("API Error"));
      vi.mocked(reservationAPI.getAll).mockRejectedValue(new Error("API Error"));
      vi.mocked(invoiceAPI.getAll).mockRejectedValue(new Error("API Error"));

      const request = new Request("http://localhost/");
      const result = await loader({ request });

      expect(result.stats.totalRooms).toBe(0);
      expect(result.stats.totalGuests).toBe(0);
      expect(result.stats.totalRevenue).toBe(0);
    });

    it("should handle partial API failures", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue({ content: mockRooms });
      vi.mocked(guestAPI.getAll).mockRejectedValue(new Error("API Error"));
      vi.mocked(reservationAPI.getAll).mockResolvedValue({ content: mockReservations });
      vi.mocked(invoiceAPI.getAll).mockResolvedValue({ content: mockInvoices });

      const request = new Request("http://localhost/");
      const result = await loader({ request });

      expect(result.stats.totalRooms).toBe(3);
      expect(result.stats.totalGuests).toBe(0);
    });
  });

  describe("Rendering", () => {
    it("should render dashboard with title and description", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue({ content: [] });
      vi.mocked(guestAPI.getAll).mockResolvedValue({ content: [] });
      vi.mocked(reservationAPI.getAll).mockResolvedValue({ content: [] });
      vi.mocked(invoiceAPI.getAll).mockResolvedValue({ content: [] });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Welcome to Hotel Property Management System")).toBeInTheDocument();
      });
    });

    it("should render all stat cards", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue({ content: mockRooms });
      vi.mocked(guestAPI.getAll).mockResolvedValue({ content: mockGuests });
      vi.mocked(reservationAPI.getAll).mockResolvedValue({ content: mockReservations });
      vi.mocked(invoiceAPI.getAll).mockResolvedValue({ content: mockInvoices });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Total Rooms")).toBeInTheDocument();
        expect(screen.getByText("Total Guests")).toBeInTheDocument();
        expect(screen.getByText("Bookings")).toBeInTheDocument();
        expect(screen.getByText("Invoices")).toBeInTheDocument();
        expect(screen.getByText("Total Revenue")).toBeInTheDocument();
      });
    });

    it("should render stat card values correctly", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue({ content: mockRooms });
      vi.mocked(guestAPI.getAll).mockResolvedValue({ content: mockGuests });
      vi.mocked(reservationAPI.getAll).mockResolvedValue({ content: mockReservations });
      vi.mocked(invoiceAPI.getAll).mockResolvedValue({ content: mockInvoices });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        // Check values within their specific card contexts
        const roomsCard = screen.getByText("Total Rooms").closest("a");
        expect(within(roomsCard!).getByText("3")).toBeInTheDocument();

        const guestsCard = screen.getByText("Total Guests").closest("a");
        expect(within(guestsCard!).getByText("2")).toBeInTheDocument();

        const revenueCard = screen.getByText("Total Revenue").closest("a");
        expect(within(revenueCard!).getByText("₹3500.00")).toBeInTheDocument();
      });
    });

    it("should render stat card links correctly", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue({ content: mockRooms });
      vi.mocked(guestAPI.getAll).mockResolvedValue({ content: mockGuests });
      vi.mocked(reservationAPI.getAll).mockResolvedValue({ content: mockReservations });
      vi.mocked(invoiceAPI.getAll).mockResolvedValue({ content: mockInvoices });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const roomsCard = screen.getByText("Total Rooms").closest("a");
        expect(roomsCard).toHaveAttribute("href", "/rooms");

        const guestsCard = screen.getByText("Total Guests").closest("a");
        expect(guestsCard).toHaveAttribute("href", "/guests");

        const bookingsCard = screen.getByText("Bookings").closest("a");
        expect(bookingsCard).toHaveAttribute("href", "/bookings");
      });
    });

    it("should render Quick Actions section", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue({ content: [] });
      vi.mocked(guestAPI.getAll).mockResolvedValue({ content: [] });
      vi.mocked(reservationAPI.getAll).mockResolvedValue({ content: [] });
      vi.mocked(invoiceAPI.getAll).mockResolvedValue({ content: [] });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Quick Actions")).toBeInTheDocument();
        expect(screen.getByText("➕ Create New Booking")).toBeInTheDocument();
        expect(screen.getByText("➕ Register New Guest")).toBeInTheDocument();
        expect(screen.getByText("➕ Add New Room")).toBeInTheDocument();
      });
    });

    it("should render Quick Actions links correctly", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue({ content: [] });
      vi.mocked(guestAPI.getAll).mockResolvedValue({ content: [] });
      vi.mocked(reservationAPI.getAll).mockResolvedValue({ content: [] });
      vi.mocked(invoiceAPI.getAll).mockResolvedValue({ content: [] });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const createBookingLink = screen.getByText("➕ Create New Booking").closest("a");
        expect(createBookingLink).toHaveAttribute("href", "/bookings/new");

        const registerGuestLink = screen.getByText("➕ Register New Guest").closest("a");
        expect(registerGuestLink).toHaveAttribute("href", "/guests/new");

        const addRoomLink = screen.getByText("➕ Add New Room").closest("a");
        expect(addRoomLink).toHaveAttribute("href", "/rooms/new");
      });
    });

    it("should render System Status section", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue({ content: [] });
      vi.mocked(guestAPI.getAll).mockResolvedValue({ content: [] });
      vi.mocked(reservationAPI.getAll).mockResolvedValue({ content: [] });
      vi.mocked(invoiceAPI.getAll).mockResolvedValue({ content: [] });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("System Status")).toBeInTheDocument();
        expect(screen.getByText("API Connection")).toBeInTheDocument();
        expect(screen.getByText("Server Status")).toBeInTheDocument();
        expect(screen.getByText("Connected")).toBeInTheDocument();
        expect(screen.getByText("Online")).toBeInTheDocument();
      });
    });

    it("should render stat card subtitles correctly", async () => {
      vi.mocked(roomAPI.getAll).mockResolvedValue({ content: mockRooms });
      vi.mocked(guestAPI.getAll).mockResolvedValue({ content: mockGuests });
      vi.mocked(reservationAPI.getAll).mockResolvedValue({ content: mockReservations });
      vi.mocked(invoiceAPI.getAll).mockResolvedValue({ content: mockInvoices });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("2 ready, 1 in maintenance")).toBeInTheDocument();
        expect(screen.getByText("Registered guests")).toBeInTheDocument();
        expect(screen.getByText("1 pending, 1 checked in")).toBeInTheDocument();
        expect(screen.getByText("1 pending payment")).toBeInTheDocument();
        expect(screen.getByText("From paid invoices")).toBeInTheDocument();
      });
    });
  });
});

