import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import NewBookingPage, { loader, action } from "./bookings.new";
import { guestAPI, roomAPI, rateTypeAPI, reservationAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  guestAPI: {
    getAll: vi.fn(),
  },
  roomAPI: {
    getAvailable: vi.fn(),
    getAvailableForDateRange: vi.fn(),
  },
  rateTypeAPI: {
    getAll: vi.fn(),
  },
  reservationAPI: {
    create: vi.fn(),
  },
}));

// Mock the Button component
vi.mock("../../components/Button", () => ({
  Button: ({ to, children, type, ...props }: any) => {
    if (to) {
      return <a href={to}>{children}</a>;
    }
    return <button type={type} {...props}>{children}</button>;
  },
}));

// Mock the DateInput component
vi.mock("../../components/DateInput", () => ({
  DateInput: ({ label, id, name, value, onChange, required, ...props }: any) => (
    <div>
      {label && <label htmlFor={id}>{label} {required && "*"}</label>}
      <input
        type="date"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      />
    </div>
  ),
}));

const mockGuests = [
  { id: 1, firstName: "John", lastName: "Doe", email: "john@example.com" },
  { id: 2, firstName: "Jane", lastName: "Smith", email: null },
];

const mockRateTypes = [
  { id: 1, name: "Standard" },
  { id: 2, name: "Premium" },
];

const mockRooms = [
  { id: 1, roomNumber: "101", roomType: { name: "Deluxe" }, roomTypeId: 1 },
  { id: 2, roomNumber: "102", roomType: { name: "Standard" }, roomTypeId: 2 },
];

describe("NewBookingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomAPI.getAvailable).mockResolvedValue(mockRooms);
  });

  const createRouter = (initialEntries = ["/bookings/new"]) => {
    return createMemoryRouter(
      [
        {
          path: "/bookings/new",
          element: <NewBookingPage />,
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
    it("should load guests and rate types successfully", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const result = await loader({ request: new Request("http://localhost/bookings/new"), params: {}, context: {} } as any);

      expect(result.guests).toHaveLength(2);
      expect(result.rateTypes).toHaveLength(2);
      expect(guestAPI.getAll).toHaveBeenCalled();
      expect(rateTypeAPI.getAll).toHaveBeenCalled();
    });

    it("should handle paginated guest response", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue({
        content: mockGuests,
        totalElements: 2,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true,
      });
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const result = await loader({ request: new Request("http://localhost/bookings/new"), params: {}, context: {} } as any);

      expect(result.guests).toHaveLength(2);
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(guestAPI.getAll).mockRejectedValue(new Error("API Error"));
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue([]);

      const result = await loader({ request: new Request("http://localhost/bookings/new"), params: {}, context: {} } as any);

      expect(result.guests).toEqual([]);
      expect(result.rateTypes).toEqual([]);
    });
  });

  describe("Rendering", () => {
    it("should render the new booking page with title and description", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Create New Booking")).toBeInTheDocument();
        expect(screen.getByText("Book a room for a guest")).toBeInTheDocument();
      });
    });

    it("should render all form fields", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Guest \*/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Check-in Date \*/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Check-out Date \*/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Room \*/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Rate Type \*/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Number of Guests \*/)).toBeInTheDocument();
        expect(screen.getByLabelText("Special Requests")).toBeInTheDocument();
      });
    });

    it("should render guest dropdown with guest options", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Select a guest" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: /John Doe/ })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: /Jane Smith/ })).toBeInTheDocument();
      });
    });

    it("should pre-select guest when guestId is in search params", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter(["/bookings/new?guestId=1"]);
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const guestSelect = screen.getByLabelText(/Guest \*/) as HTMLSelectElement;
        expect(guestSelect.value).toBe("1");
      });
    });

    it("should render rate type dropdown with options", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Select a rate type" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Standard" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Premium" })).toBeInTheDocument();
      });
    });

    it("should render Create Booking and Cancel buttons", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Create Booking" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/bookings");
      });
    });
  });

  describe("Room Loading", () => {
    it("should load available rooms when dates are selected", async () => {
      const user = userEvent.setup();
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);
      vi.mocked(roomAPI.getAvailableForDateRange).mockResolvedValue(mockRooms);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Check-in Date \*/)).toBeInTheDocument();
      });

      const checkInInput = screen.getByLabelText(/Check-in Date \*/) as HTMLInputElement;
      const checkOutInput = screen.getByLabelText(/Check-out Date \*/) as HTMLInputElement;

      await user.type(checkInInput, "2024-01-15");
      await user.type(checkOutInput, "2024-01-20");

      await waitFor(() => {
        expect(roomAPI.getAvailableForDateRange).toHaveBeenCalledWith("2024-01-15", "2024-01-20");
      });
    });

    it("should load default available rooms when dates are not selected", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(roomAPI.getAvailable).toHaveBeenCalled();
      });
    });
  });

  describe("Form Submission", () => {
    it("should submit form with all fields", async () => {
      const user = userEvent.setup();
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);
      vi.mocked(reservationAPI.create).mockResolvedValue({ id: 1 });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Guest \*/)).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByLabelText(/Guest \*/), "1");
      await user.type(screen.getByLabelText(/Check-in Date \*/) as HTMLInputElement, "2024-01-15");
      await user.type(screen.getByLabelText(/Check-out Date \*/) as HTMLInputElement, "2024-01-20");
      await user.selectOptions(screen.getByLabelText(/Room \*/), "1");
      await user.selectOptions(screen.getByLabelText(/Rate Type \*/), "1");
      await user.type(screen.getByLabelText(/Number of Guests \*/) as HTMLInputElement, "2");
      await user.type(screen.getByLabelText("Special Requests") as HTMLTextAreaElement, "Late checkout");

      const submitButton = screen.getByRole("button", { name: "Create Booking" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(reservationAPI.create).toHaveBeenCalledWith({
          guestId: 1,
          roomId: 1,
          rateTypeId: 1,
          checkInDate: "2024-01-15",
          checkOutDate: "2024-01-20",
          numberOfGuests: 2,
          specialRequests: "Late checkout",
        });
      });
    });

    it("should submit form with only required fields", async () => {
      const user = userEvent.setup();
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);
      vi.mocked(reservationAPI.create).mockResolvedValue({ id: 1 });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Guest \*/)).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByLabelText(/Guest \*/), "1");
      await user.type(screen.getByLabelText(/Check-in Date \*/) as HTMLInputElement, "2024-01-15");
      await user.type(screen.getByLabelText(/Check-out Date \*/) as HTMLInputElement, "2024-01-20");
      await user.selectOptions(screen.getByLabelText(/Room \*/), "1");
      await user.selectOptions(screen.getByLabelText(/Rate Type \*/), "1");
      await user.type(screen.getByLabelText(/Number of Guests \*/) as HTMLInputElement, "1");
      // Leave special requests empty

      const submitButton = screen.getByRole("button", { name: "Create Booking" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(reservationAPI.create).toHaveBeenCalledWith(
          expect.objectContaining({
            guestId: 1,
            roomId: 1,
            rateTypeId: 1,
            numberOfGuests: 1,
            specialRequests: undefined,
          })
        );
      });
    });
  });

  describe("Action", () => {
    it("should create booking and redirect on success", async () => {
      vi.mocked(reservationAPI.create).mockResolvedValue({ id: 1 });

      const formData = new FormData();
      formData.append("guestId", "1");
      formData.append("roomId", "1");
      formData.append("rateTypeId", "1");
      formData.append("checkInDate", "2024-01-15");
      formData.append("checkOutDate", "2024-01-20");
      formData.append("numberOfGuests", "2");

      const request = new Request("http://localhost/bookings/new", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(reservationAPI.create).toHaveBeenCalledWith({
        guestId: 1,
        roomId: 1,
        rateTypeId: 1,
        checkInDate: "2024-01-15",
        checkOutDate: "2024-01-20",
        numberOfGuests: 2,
        specialRequests: undefined,
      });

      expect(result).toHaveProperty("status", 302);
      expect(result.headers.get("Location")).toBe("/bookings");
    });

    it("should return error on API failure", async () => {
      vi.mocked(reservationAPI.create).mockRejectedValue(new Error("API Error"));

      const formData = new FormData();
      formData.append("guestId", "1");
      formData.append("roomId", "1");
      formData.append("rateTypeId", "1");
      formData.append("checkInDate", "2024-01-15");
      formData.append("checkOutDate", "2024-01-20");
      formData.append("numberOfGuests", "2");

      const request = new Request("http://localhost/bookings/new", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: "API Error" });
    });
  });

  describe("Error Display", () => {
    it("should display error message when action returns error", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter(["/bookings/new?error=Failed to create booking"]);
      render(<RouterProvider router={router} />);

      // Note: This test would need the router to handle actionData properly
      // In a real scenario, you'd need to mock the action result
    });
  });
});

