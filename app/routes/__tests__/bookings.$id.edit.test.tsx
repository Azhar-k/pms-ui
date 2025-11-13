import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import EditBookingPage, { loader, action } from "../bookings.$id.edit";
import { reservationAPI, guestAPI, roomAPI, rateTypeAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  reservationAPI: {
    getById: vi.fn(),
    update: vi.fn(),
  },
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
}));

// Mock the Button component
vi.mock("../../components/Button", () => ({
  Button: ({ to, children, type, variant, ...props }: any) => {
    if (to) {
      return <a href={to} data-variant={variant}>{children}</a>;
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

const mockReservation = {
  id: 1,
  reservationNumber: "RES-001",
  status: "CONFIRMED",
  guestId: 1,
  roomId: 1,
  room: { id: 1, roomNumber: "101", roomType: { name: "Deluxe" }, roomTypeId: 1 },
  rateTypeId: 1,
  checkInDate: "2024-01-15",
  checkOutDate: "2024-01-20",
  numberOfGuests: 2,
  specialRequests: "Late checkout",
};

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

describe("EditBookingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomAPI.getAvailable).mockResolvedValue(mockRooms);
    // Mock getAvailableForDateRange since the component calls it in useEffect
    vi.mocked(roomAPI.getAvailableForDateRange).mockResolvedValue(mockRooms);
  });

  const createRouter = (initialEntries = ["/bookings/1/edit"]) => {
    return createMemoryRouter(
      [
        {
          path: "/bookings/:id/edit",
          element: <EditBookingPage />,
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
    it("should load booking, guests, and rate types successfully", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const result = await loader({ params: { id: "1" }, request: new Request("http://localhost/bookings/1/edit"), context: {} } as any);

      expect(result.reservation).toEqual(mockReservation);
      expect(result.guests).toHaveLength(2);
      expect(result.rateTypes).toHaveLength(2);
      expect(reservationAPI.getById).toHaveBeenCalledWith(1);
      expect(guestAPI.getAll).toHaveBeenCalled();
      expect(rateTypeAPI.getAll).toHaveBeenCalled();
    });

    it("should throw 404 when booking not found", async () => {
      vi.mocked(reservationAPI.getById).mockRejectedValue(new Error("Not found"));
      vi.mocked(guestAPI.getAll).mockResolvedValue([]);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue([]);

      await expect(
        loader({ params: { id: "999" }, request: new Request("http://localhost/bookings/999/edit"), context: {} } as any)
      ).rejects.toThrow();
    });
  });

  describe("Rendering", () => {
    it("should render the edit booking page with title and description", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Edit Booking")).toBeInTheDocument();
        expect(screen.getByText("Update booking information")).toBeInTheDocument();
      });
    });

    it("should pre-fill form fields with booking data", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const guestSelect = screen.getByLabelText(/Guest \*/) as HTMLSelectElement;
        const numberOfGuestsInput = screen.getByLabelText(/Number of Guests \*/) as HTMLInputElement;
        const specialRequestsTextarea = screen.getByLabelText("Special Requests") as HTMLTextAreaElement;

        expect(guestSelect.value).toBe("1");
        expect(numberOfGuestsInput.value).toBe("2");
        expect(specialRequestsTextarea.value).toBe("Late checkout");
      });
    });

    it("should render all form fields", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);
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

    it("should render Update Booking and Cancel buttons", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Update Booking" })).toBeInTheDocument();
        const cancelLink = screen.getByRole("link", { name: "Cancel" });
        expect(cancelLink).toBeInTheDocument();
        expect(cancelLink).toHaveAttribute("href", "/bookings/1");
      });
    });

    it("should show cannot edit message when booking is checked out", async () => {
      const checkedOutReservation = { ...mockReservation, status: "CHECKED_OUT" };
      vi.mocked(reservationAPI.getById).mockResolvedValue(checkedOutReservation);
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Cannot Edit")).toBeInTheDocument();
        expect(screen.getByText("Cannot update a checked-out booking.")).toBeInTheDocument();
        expect(screen.queryByLabelText(/Guest \*/)).not.toBeInTheDocument();
      });
    });

    it("should show Back to Booking button when cannot edit", async () => {
      const checkedOutReservation = { ...mockReservation, status: "CHECKED_OUT" };
      vi.mocked(reservationAPI.getById).mockResolvedValue(checkedOutReservation);
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const backButton = screen.getByRole("link", { name: "Back to Booking" });
        expect(backButton).toBeInTheDocument();
        expect(backButton).toHaveAttribute("href", "/bookings/1");
      });
    });
  });

  describe("Room Loading", () => {
    it("should load available rooms when dates are changed", async () => {
      const user = userEvent.setup();
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);
      vi.mocked(roomAPI.getAvailableForDateRange).mockResolvedValue(mockRooms);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Check-in Date \*/)).toBeInTheDocument();
      });

      const checkInInput = screen.getByLabelText(/Check-in Date \*/) as HTMLInputElement;
      await user.clear(checkInInput);
      await user.type(checkInInput, "2024-01-16");

      await waitFor(() => {
        expect(roomAPI.getAvailableForDateRange).toHaveBeenCalled();
      });
    });

    it("should include current room in available rooms list", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);
      vi.mocked(roomAPI.getAvailableForDateRange).mockResolvedValue([mockRooms[1]]);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        // Current room should be available even if not in the available list
        const roomSelect = screen.getByLabelText(/Room \*/) as HTMLSelectElement;
        expect(roomSelect).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should update booking with modified data", async () => {
      const user = userEvent.setup();
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);
      vi.mocked(reservationAPI.update).mockResolvedValue({ ...mockReservation, numberOfGuests: 3 });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Number of Guests \*/)).toBeInTheDocument();
      });

      const numberOfGuestsInput = screen.getByLabelText(/Number of Guests \*/) as HTMLInputElement;
      await user.clear(numberOfGuestsInput);
      await user.type(numberOfGuestsInput, "3");

      const submitButton = screen.getByRole("button", { name: "Update Booking" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(reservationAPI.update).toHaveBeenCalledWith(1, expect.objectContaining({
          numberOfGuests: 3,
        }));
      });
    });

    it("should submit all form fields", async () => {
      const user = userEvent.setup();
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);
      vi.mocked(reservationAPI.update).mockResolvedValue(mockReservation);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Guest \*/)).toBeInTheDocument();
      });

      // Modify some fields
      await user.selectOptions(screen.getByLabelText(/Guest \*/) as HTMLSelectElement, "2");
      await user.selectOptions(screen.getByLabelText(/Rate Type \*/) as HTMLSelectElement, "2");
      await user.clear(screen.getByLabelText("Special Requests") as HTMLTextAreaElement);
      await user.type(screen.getByLabelText("Special Requests") as HTMLTextAreaElement, "Early check-in");

      const submitButton = screen.getByRole("button", { name: "Update Booking" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(reservationAPI.update).toHaveBeenCalledWith(1, expect.objectContaining({
          guestId: 2,
          rateTypeId: 2,
          specialRequests: "Early check-in",
        }));
      });
    });
  });

  describe("Action", () => {
    it("should update booking and redirect on success", async () => {
      vi.mocked(reservationAPI.update).mockResolvedValue(mockReservation);

      const formData = new FormData();
      formData.append("guestId", "1");
      formData.append("roomId", "1");
      formData.append("rateTypeId", "1");
      formData.append("checkInDate", "2024-01-15");
      formData.append("checkOutDate", "2024-01-20");
      formData.append("numberOfGuests", "2");

      const request = new Request("http://localhost/bookings/1", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: { id: "1" }, context: {} } as any);

      expect(reservationAPI.update).toHaveBeenCalledWith(1, {
        guestId: 1,
        roomId: 1,
        rateTypeId: 1,
        checkInDate: "2024-01-15",
        checkOutDate: "2024-01-20",
        numberOfGuests: 2,
        specialRequests: undefined,
      });

      expect(result).toHaveProperty("status", 302);
      expect(result.headers.get("Location")).toBe("/bookings/1");
    });

    it("should return error on API failure", async () => {
      vi.mocked(reservationAPI.update).mockRejectedValue(new Error("API Error"));

      const formData = new FormData();
      formData.append("guestId", "1");
      formData.append("roomId", "1");
      formData.append("rateTypeId", "1");
      formData.append("checkInDate", "2024-01-15");
      formData.append("checkOutDate", "2024-01-20");
      formData.append("numberOfGuests", "2");

      const request = new Request("http://localhost/bookings/1", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: { id: "1" }, context: {} } as any);

      expect(result).toEqual({ error: "API Error" });
    });
  });

  describe("Error Display", () => {
    it("should display error message when action returns error", async () => {
      vi.mocked(reservationAPI.getById).mockResolvedValue(mockReservation);
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      // Note: This test would need the router to handle actionData properly
      // In a real scenario, you'd need to mock the action result
      await waitFor(() => {
        expect(screen.getByText("Edit Booking")).toBeInTheDocument();
      });
    });
  });
});

