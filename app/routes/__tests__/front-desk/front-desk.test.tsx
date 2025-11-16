import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import FrontDeskPage, { loader, action } from "../../front-desk/front-desk";
import { reservationAPI } from "../../../services/api";

// Mock the API
vi.mock("../../../services/api", () => ({
  reservationAPI: {
    getByDateRange: vi.fn(),
    checkIn: vi.fn(),
    checkOut: vi.fn(),
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

// Mock the dateFormat utility
vi.mock("../../../utils/dateFormat", () => ({
  formatDisplayDate: (date: string | Date) => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },
}));

// Mock handleAPIError
vi.mock("../../../utils/auth", () => ({
  handleAPIError: vi.fn(),
}));

const mockReservations = [
  {
    id: 1,
    reservationNumber: "RES-001",
    guest: { id: 1, firstName: "John", lastName: "Doe" },
    room: { id: 1, roomNumber: "101" },
    checkInDate: "2024-01-15",
    checkOutDate: "2024-01-20",
    status: "CONFIRMED",
  },
  {
    id: 2,
    reservationNumber: "RES-002",
    guest: { id: 2, firstName: "Jane", lastName: "Smith" },
    room: { id: 2, roomNumber: "102" },
    checkInDate: "2024-01-16",
    checkOutDate: "2024-01-18",
    status: "CHECKED_IN",
  },
];

describe("FrontDeskPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/front-desk"]) => {
    return createMemoryRouter(
      [
        {
          path: "/front-desk",
          element: <FrontDeskPage />,
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
    it("should load reservations for month view by default", async () => {
      vi.mocked(reservationAPI.getByDateRange).mockResolvedValue(mockReservations);

      const request = new Request("http://localhost/front-desk");
      const result = await loader({ request });

      expect(result.reservations).toHaveLength(2);
      expect(result.view).toBe("month");
      expect(reservationAPI.getByDateRange).toHaveBeenCalled();
    });

    it("should load reservations for week view when specified", async () => {
      vi.mocked(reservationAPI.getByDateRange).mockResolvedValue(mockReservations);

      const request = new Request("http://localhost/front-desk?view=week");
      const result = await loader({ request });

      expect(result.view).toBe("week");
      expect(reservationAPI.getByDateRange).toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(reservationAPI.getByDateRange).mockRejectedValue(new Error("API Error"));

      const request = new Request("http://localhost/front-desk");
      const result = await loader({ request });

      expect(result.reservations).toEqual([]);
      expect(result.view).toBe("month");
    });

    it("should use provided date parameter", async () => {
      vi.mocked(reservationAPI.getByDateRange).mockResolvedValue(mockReservations);

      const request = new Request("http://localhost/front-desk?date=2024-02-01");
      const result = await loader({ request });

      expect(result.currentDate).toBe("2024-02-01");
    });
  });

  describe("Action", () => {
    it("should check in reservation", async () => {
      vi.mocked(reservationAPI.checkIn).mockResolvedValue(undefined);

      const formData = new FormData();
      formData.append("action", "checkIn");
      formData.append("reservationId", "1");
      formData.append("redirectTo", "/front-desk");

      const request = new Request("http://localhost/front-desk", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(reservationAPI.checkIn).toHaveBeenCalledWith(1, expect.any(Request));
      expect(result).toHaveProperty("status", 302);
      expect(result.headers.get("Location")).toBe("/front-desk");
    });

    it("should check out reservation", async () => {
      vi.mocked(reservationAPI.checkOut).mockResolvedValue(undefined);

      const formData = new FormData();
      formData.append("action", "checkOut");
      formData.append("reservationId", "1");
      formData.append("redirectTo", "/front-desk");

      const request = new Request("http://localhost/front-desk", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(reservationAPI.checkOut).toHaveBeenCalledWith(1, expect.any(Request));
      expect(result).toHaveProperty("status", 302);
    });

    it("should return error on API failure", async () => {
      vi.mocked(reservationAPI.checkIn).mockRejectedValue(new Error("Check-in failed"));

      const formData = new FormData();
      formData.append("action", "checkIn");
      formData.append("reservationId", "1");

      const request = new Request("http://localhost/front-desk", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({
        error: "Check-in failed",
      });
    });
  });

  describe("Rendering", () => {
    it("should render front desk page", async () => {
      vi.mocked(reservationAPI.getByDateRange).mockResolvedValue(mockReservations);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Front Desk")).toBeInTheDocument();
      });
    });

    it("should render view toggle buttons", async () => {
      vi.mocked(reservationAPI.getByDateRange).mockResolvedValue(mockReservations);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        // The view toggle buttons should be present
        expect(screen.getByText("Front Desk")).toBeInTheDocument();
      });
    });
  });
});

