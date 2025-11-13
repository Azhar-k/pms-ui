import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import GuestDetailPage, { loader } from "../guests.$id";
import { guestAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  guestAPI: {
    getById: vi.fn(),
  },
}));

// Mock the Button component
vi.mock("../../components/Button", () => ({
  Button: ({ to, children, variant, ...props }: any) => {
    if (to) {
      return <a href={to} data-variant={variant}>{children}</a>;
    }
    return <button {...props}>{children}</button>;
  },
}));

const mockGuest = {
  id: 1,
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phoneNumber: "+1234567890",
  address: "123 Main Street",
  city: "New York",
  state: "NY",
  postalCode: "10001",
  country: "USA",
  identificationType: "PASSPORT",
  identificationNumber: "AB123456",
};

describe("GuestDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/guests/1"]) => {
    return createMemoryRouter(
      [
        {
          path: "/guests/:id",
          element: <GuestDetailPage />,
          loader: loader,
        },
      ],
      {
        initialEntries,
      }
    );
  };

  describe("Loader", () => {
    it("should load guest successfully", async () => {
      vi.mocked(guestAPI.getById).mockResolvedValue(mockGuest);

      const result = await loader({ params: { id: "1" }, request: new Request("http://localhost/guests/1"), context: {} } as any);

      expect(result.guest).toEqual(mockGuest);
      expect(guestAPI.getById).toHaveBeenCalledWith(1);
    });

    it("should throw 404 when guest not found", async () => {
      vi.mocked(guestAPI.getById).mockRejectedValue(new Error("Not found"));

      await expect(
        loader({ params: { id: "999" }, request: new Request("http://localhost/guests/999"), context: {} } as any)
      ).rejects.toThrow();
    });
  });

  describe("Rendering", () => {
    it("should render guest name as page title", async () => {
      vi.mocked(guestAPI.getById).mockResolvedValue(mockGuest);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Guest profile and information")).toBeInTheDocument();
      });
    });

    it("should render Edit and Back to Guests buttons", async () => {
      vi.mocked(guestAPI.getById).mockResolvedValue(mockGuest);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const editButton = screen.getByRole("link", { name: "Edit" });
        const backButton = screen.getByRole("link", { name: "Back to Guests" });

        expect(editButton).toBeInTheDocument();
        expect(editButton).toHaveAttribute("href", "/guests/1/edit");
        expect(backButton).toBeInTheDocument();
        expect(backButton).toHaveAttribute("href", "/guests");
      });
    });

    it("should render all guest information fields", async () => {
      vi.mocked(guestAPI.getById).mockResolvedValue(mockGuest);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("First Name")).toBeInTheDocument();
        expect(screen.getByText("John")).toBeInTheDocument();
        expect(screen.getByText("Last Name")).toBeInTheDocument();
        expect(screen.getByText("Doe")).toBeInTheDocument();
        expect(screen.getByText("Email")).toBeInTheDocument();
        expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
        expect(screen.getByText("Phone Number")).toBeInTheDocument();
        expect(screen.getByText("+1234567890")).toBeInTheDocument();
        expect(screen.getByText("Address")).toBeInTheDocument();
        expect(screen.getByText("123 Main Street")).toBeInTheDocument();
        expect(screen.getByText("City")).toBeInTheDocument();
        expect(screen.getByText("New York")).toBeInTheDocument();
        expect(screen.getByText("State")).toBeInTheDocument();
        expect(screen.getByText("NY")).toBeInTheDocument();
        expect(screen.getByText("Postal Code")).toBeInTheDocument();
        expect(screen.getByText("10001")).toBeInTheDocument();
        expect(screen.getByText("Country")).toBeInTheDocument();
        expect(screen.getByText("USA")).toBeInTheDocument();
        expect(screen.getByText("ID Type")).toBeInTheDocument();
        expect(screen.getByText("PASSPORT")).toBeInTheDocument();
        expect(screen.getByText("ID Number")).toBeInTheDocument();
        expect(screen.getByText("AB123456")).toBeInTheDocument();
      });
    });

    it("should not render optional fields when they are missing", async () => {
      const guestWithoutOptionalFields = {
        id: 2,
        firstName: "Jane",
        lastName: "Smith",
      };

      vi.mocked(guestAPI.getById).mockResolvedValue(guestWithoutOptionalFields);

      const router = createRouter(["/guests/2"]);
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.queryByText("Email")).not.toBeInTheDocument();
        expect(screen.queryByText("Phone Number")).not.toBeInTheDocument();
        expect(screen.queryByText("Address")).not.toBeInTheDocument();
      });
    });

    it("should render Quick Actions section", async () => {
      vi.mocked(guestAPI.getById).mockResolvedValue(mockGuest);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Quick Actions")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Create Booking" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "View Bookings" })).toBeInTheDocument();
      });
    });

    it("should link to create booking with guest ID", async () => {
      vi.mocked(guestAPI.getById).mockResolvedValue(mockGuest);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const createBookingLink = screen.getByRole("link", { name: "Create Booking" });
        expect(createBookingLink).toHaveAttribute("href", "/bookings/new?guestId=1");
      });
    });

    it("should link to view bookings with guest ID", async () => {
      vi.mocked(guestAPI.getById).mockResolvedValue(mockGuest);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const viewBookingsLink = screen.getByRole("link", { name: "View Bookings" });
        expect(viewBookingsLink).toHaveAttribute("href", "/bookings?guestId=1");
      });
    });
  });
});

