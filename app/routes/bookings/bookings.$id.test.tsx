import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import BookingDetailPage, { loader, action } from "./bookings.$id";
import { reservationAPI, invoiceAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  reservationAPI: {
    getById: vi.fn(),
    checkIn: vi.fn(),
    checkOut: vi.fn(),
    cancel: vi.fn(),
  },
  invoiceAPI: {
    generate: vi.fn(),
  },
}));

// Mock the Button component
vi.mock("../../components/Button", () => ({
  Button: ({ to, children, type, variant, className, ...props }: any) => {
    if (to) {
      return <a href={to} data-variant={variant} className={className}>{children}</a>;
    }
    return <button type={type} className={className} {...props}>{children}</button>;
  },
}));

// Mock the dateFormat utility
vi.mock("../../utils/dateFormat", () => ({
  formatDisplayDate: (date: string | Date) => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },
  formatDisplayDateTime: (date: string | Date) => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  },
}));

const mockReservation = {
  id: 1,
  reservationNumber: "RES-001",
  status: "CONFIRMED",
  guest: { id: 1, firstName: "John", lastName: "Doe" },
  guestId: 1,
  room: { id: 1, roomNumber: "101" },
  roomId: 1,
  checkInDate: "2024-01-15",
  checkOutDate: "2024-01-20",
  numberOfGuests: 2,
  totalAmount: 5000.00,
  specialRequests: "Late checkout",
  actualCheckInTime: null,
  actualCheckOutTime: null,
};

describe("BookingDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/bookings/1"]) => {
    return createMemoryRouter(
      [
        {
          path: "/bookings/:id",
          element: <BookingDetailPage />,
          loader: loader,
          action: action,
        },
      ],
      {
        initialEntries,
      }
    );
  };

  describe("Loader", () => {
    it("should load booking successfully", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);

      const result = await loader({ params: { id: "1" }, request: new Request("http://localhost/bookings/1"), context: {} } as any);

      expect(result.reservation).toEqual(mockReservation);
      expect(reservationAPI.getById).toHaveBeenCalledWith(1, expect.any(Request));
    });

    it("should throw 404 when booking not found", async () => {
      vi.mocked(reservationAPI.getById).mockRejectedValue(new Error("Not found"));

      await expect(
        loader({ params: { id: "999" }, request: new Request("http://localhost/bookings/999"), context: {} } as any)
      ).rejects.toThrow();
    });
  });

  describe("Rendering", () => {
    it("should render booking number as page title", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Booking RES-001")).toBeInTheDocument();
        expect(screen.getByText("Booking details and actions")).toBeInTheDocument();
      });
    });

    it("should render booking number fallback when reservationNumber is null", async () => {
      const reservationWithoutNumber = { ...mockReservation, reservationNumber: null };
      vi.mocked(reservationAPI.getById).mockResolvedValue(reservationWithoutNumber);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Booking #1")).toBeInTheDocument();
      });
    });

    it("should render Back to Bookings button", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const backButton = screen.getByRole("link", { name: "Back to Bookings" });
        expect(backButton).toBeInTheDocument();
        expect(backButton).toHaveAttribute("href", "/bookings");
      });
    });

    it("should render all booking information fields", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Booking Number")).toBeInTheDocument();
        expect(screen.getByText("RES-001")).toBeInTheDocument();
        expect(screen.getByText("Status")).toBeInTheDocument();
        expect(screen.getByText("CONFIRMED")).toBeInTheDocument();
        expect(screen.getByText("Guest")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Room")).toBeInTheDocument();
        expect(screen.getByText("Room 101")).toBeInTheDocument();
        expect(screen.getByText("Check-in Date")).toBeInTheDocument();
        expect(screen.getByText("Check-out Date")).toBeInTheDocument();
        expect(screen.getByText("Number of Guests")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("Total Amount")).toBeInTheDocument();
        expect(screen.getByText("₹5000.00")).toBeInTheDocument();
        expect(screen.getByText("Special Requests")).toBeInTheDocument();
        expect(screen.getByText("Late checkout")).toBeInTheDocument();
      });
    });

    it("should render guest link when guest exists", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const guestLink = screen.getByText("John Doe").closest("a");
        expect(guestLink).toHaveAttribute("href", "/guests/1");
      });
    });

    it("should render room link when room exists", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const roomLink = screen.getByText("Room 101").closest("a");
        expect(roomLink).toHaveAttribute("href", "/rooms/1");
      });
    });

    it("should render guest fallback when guest is null", async () => {
      const reservationWithoutGuest = { ...mockReservation, guest: null };
      vi.mocked(reservationAPI.getById).mockResolvedValue(reservationWithoutGuest);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Guest #1")).toBeInTheDocument();
      });
    });

    it("should render room fallback when room is null", async () => {
      const reservationWithoutRoom = { ...mockReservation, room: null };
      vi.mocked(reservationAPI.getById).mockResolvedValue(reservationWithoutRoom);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Room #1")).toBeInTheDocument();
      });
    });

    it("should render actual check-in time when available", async () => {
      const reservationWithCheckIn = {
        ...mockReservation,
        actualCheckInTime: "2024-01-15T14:30:00Z",
      };
      vi.mocked(reservationAPI.getById).mockResolvedValue(reservationWithCheckIn);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Actual Check-in Time")).toBeInTheDocument();
      });
    });

    it("should render actual check-out time when available", async () => {
      const reservationWithCheckOut = {
        ...mockReservation,
        actualCheckOutTime: "2024-01-20T11:00:00Z",
      };
      vi.mocked(reservationAPI.getById).mockResolvedValue(reservationWithCheckOut);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Actual Check-out Time")).toBeInTheDocument();
      });
    });

    it("should not render special requests when empty", async () => {
      const reservationWithoutRequests = { ...mockReservation, specialRequests: null };
      vi.mocked(reservationAPI.getById).mockResolvedValue(reservationWithoutRequests);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.queryByText("Special Requests")).not.toBeInTheDocument();
      });
    });
  });

  describe("Actions", () => {
    it("should show Edit button when booking can be edited", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const editLink = screen.getByRole("link", { name: "Edit Booking" });
        expect(editLink).toBeInTheDocument();
        expect(editLink).toHaveAttribute("href", "/bookings/1/edit");
      });
    });

    it("should show Check In button when status is CONFIRMED", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Check In" })).toBeInTheDocument();
      });
    });

    it("should show Check In button when status is PENDING", async () => {
      const pendingReservation = { ...mockReservation, status: "PENDING" };
      vi.mocked(reservationAPI.getById).mockResolvedValue(pendingReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Check In" })).toBeInTheDocument();
      });
    });

    it("should show Check Out button when status is CHECKED_IN", async () => {
      const checkedInReservation = { ...mockReservation, status: "CHECKED_IN" };
      vi.mocked(reservationAPI.getById).mockResolvedValue(checkedInReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Check Out" })).toBeInTheDocument();
      });
    });

    it("should show Cancel button when booking can be cancelled", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Cancel Booking" })).toBeInTheDocument();
      });
    });

    it("should not show Cancel button when status is CHECKED_OUT", async () => {
      const checkedOutReservation = { ...mockReservation, status: "CHECKED_OUT" };
      vi.mocked(reservationAPI.getById).mockResolvedValue(checkedOutReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: "Cancel Booking" })).not.toBeInTheDocument();
      });
    });

    it("should not show Edit button when status is CHECKED_OUT", async () => {
      const checkedOutReservation = { ...mockReservation, status: "CHECKED_OUT" };
      vi.mocked(reservationAPI.getById).mockResolvedValue(checkedOutReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.queryByRole("link", { name: "Edit Booking" })).not.toBeInTheDocument();
      });
    });

    it("should show Generate Invoice button", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Generate Invoice" })).toBeInTheDocument();
      });
    });

    it("should show View Invoices link", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const viewInvoicesLink = screen.getByRole("link", { name: "View Invoices" });
        expect(viewInvoicesLink).toBeInTheDocument();
        expect(viewInvoicesLink).toHaveAttribute("href", "/invoices?reservationId=1");
      });
    });
  });

  describe("Action", () => {
    it("should handle check-in action", async () => {
      vi.mocked(reservationAPI.checkIn).mockResolvedValue({ ...mockReservation, status: "CHECKED_IN" });

      const formData = new FormData();
      formData.append("action", "checkIn");

      const request = new Request("http://localhost/bookings/1", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: { id: "1" }, context: {} } as any);

      expect(reservationAPI.checkIn).toHaveBeenCalledWith(1, expect.any(Request));
      expect(result).toHaveProperty("status", 302);
      expect(result.headers.get("Location")).toBe("/bookings/1");
    });

    it("should handle check-out action", async () => {
      vi.mocked(reservationAPI.checkOut).mockResolvedValue({ ...mockReservation, status: "CHECKED_OUT" });

      const formData = new FormData();
      formData.append("action", "checkOut");

      const request = new Request("http://localhost/bookings/1", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: { id: "1" }, context: {} } as any);

      expect(reservationAPI.checkOut).toHaveBeenCalledWith(1, expect.any(Request));
      expect(result).toHaveProperty("status", 302);
    });

    it("should handle cancel action", async () => {
      vi.mocked(reservationAPI.cancel).mockResolvedValue({ ...mockReservation, status: "CANCELLED" });

      const formData = new FormData();
      formData.append("action", "cancel");

      const request = new Request("http://localhost/bookings/1", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: { id: "1" }, context: {} } as any);

      expect(reservationAPI.cancel).toHaveBeenCalledWith(1, expect.any(Request));
      expect(result).toHaveProperty("status", 302);
    });

    it("should handle generate invoice action", async () => {
      vi.mocked(invoiceAPI.generate).mockResolvedValue({ id: 1 });

      const formData = new FormData();
      formData.append("action", "generateInvoice");

      const request = new Request("http://localhost/bookings/1", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: { id: "1" }, context: {} } as any);

      expect(invoiceAPI.generate).toHaveBeenCalledWith(1, expect.any(Request));
      expect(result).toHaveProperty("status", 302);
      expect(result.headers.get("Location")).toBe("/invoices/1");
    });

    it("should return error on API failure", async () => {
      // Mock a 400 error (validation error) so the action returns an error instead of throwing
      vi.mocked(reservationAPI.checkIn).mockRejectedValue(new Error("API Error: 400 Bad Request - Action failed"));

      const formData = new FormData();
      formData.append("action", "checkIn");

      const request = new Request("http://localhost/bookings/1", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: { id: "1" }, context: {} } as any);

      // parseAPIError extracts "Action failed" from "API Error: 400 Bad Request - Action failed"
      expect(result).toEqual({ error: "Action failed" });
    });
  });
});

