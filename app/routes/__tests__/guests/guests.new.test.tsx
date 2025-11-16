import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import NewGuestPage, { action } from "../../guests/guests.new";
import { guestAPI } from "../../../services/api";

// Mock the API
vi.mock("../../../services/api", () => ({
  guestAPI: {
    create: vi.fn(),
  },
}));

// Mock the Button component
vi.mock("../../../components/Button", () => ({
  Button: ({ to, children, type, ...props }: any) => {
    if (to) {
      return <a href={to}>{children}</a>;
    }
    return <button type={type} {...props}>{children}</button>;
  },
}));

describe("NewGuestPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = () => {
    return createMemoryRouter(
      [
        {
          path: "/guests/new",
          element: <NewGuestPage />,
          action: action,
        },
      ],
      {
        initialEntries: ["/guests/new"],
      }
    );
  };

  describe("Rendering", () => {
    it("should render the new guest page with title and description", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);

      expect(screen.getByText("Register New Guest")).toBeInTheDocument();
      expect(screen.getByText("Add a new guest to the system")).toBeInTheDocument();
    });

    it("should render all form fields", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);

      expect(screen.getByLabelText(/First Name \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name \*/)).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Phone Number")).toBeInTheDocument();
      expect(screen.getByLabelText("Address")).toBeInTheDocument();
      expect(screen.getByLabelText("City")).toBeInTheDocument();
      expect(screen.getByLabelText("State")).toBeInTheDocument();
      expect(screen.getByLabelText("Postal Code")).toBeInTheDocument();
      expect(screen.getByLabelText("Country")).toBeInTheDocument();
      expect(screen.getByLabelText("ID Type")).toBeInTheDocument();
      expect(screen.getByLabelText("ID Number")).toBeInTheDocument();
    });

    it("should mark first name and last name as required", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);

      const firstNameInput = screen.getByLabelText(/First Name \*/) as HTMLInputElement;
      const lastNameInput = screen.getByLabelText(/Last Name \*/) as HTMLInputElement;

      expect(firstNameInput).toBeRequired();
      expect(lastNameInput).toBeRequired();
    });

    it("should render ID type dropdown with options", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);

      const idTypeSelect = screen.getByLabelText("ID Type") as HTMLSelectElement;
      expect(idTypeSelect).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Select ID type" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Passport" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Driver's License" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "National ID" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Other" })).toBeInTheDocument();
    });

    it("should render Register Guest and Cancel buttons", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);

      expect(screen.getByRole("button", { name: "Register Guest" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/guests");
    });
  });

  describe("Form Submission", () => {
    it("should submit form with all fields", async () => {
      const user = userEvent.setup();
      vi.mocked(guestAPI.create).mockResolvedValue({ id: 1 });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await user.type(screen.getByLabelText(/First Name \*/), "John");
      await user.type(screen.getByLabelText(/Last Name \*/), "Doe");
      await user.type(screen.getByLabelText("Email"), "john.doe@example.com");
      await user.type(screen.getByLabelText("Phone Number"), "+1234567890");
      await user.type(screen.getByLabelText("Address"), "123 Main St");
      await user.type(screen.getByLabelText("City"), "New York");
      await user.type(screen.getByLabelText("State"), "NY");
      await user.type(screen.getByLabelText("Postal Code"), "10001");
      await user.type(screen.getByLabelText("Country"), "USA");
      await user.selectOptions(screen.getByLabelText("ID Type"), "PASSPORT");
      await user.type(screen.getByLabelText("ID Number"), "AB123456");

      const form = screen.getByRole("button", { name: "Register Guest" }).closest("form");
      expect(form).toBeInTheDocument();
      
      // Submit the form
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(guestAPI.create).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Verify the call was made with correct data
      expect(guestAPI.create).toHaveBeenCalledWith(
        {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phoneNumber: "+1234567890",
          address: "123 Main St",
          city: "New York",
          state: "NY",
          country: "USA",
          postalCode: "10001",
          identificationType: "PASSPORT",
          identificationNumber: "AB123456",
        },
        expect.any(Request)
      );
    });

    it("should submit form with only required fields", async () => {
      const user = userEvent.setup();
      vi.mocked(guestAPI.create).mockResolvedValue({ id: 1 });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await user.type(screen.getByLabelText(/First Name \*/), "Jane");
      await user.type(screen.getByLabelText(/Last Name \*/), "Smith");

      const form = screen.getByRole("button", { name: "Register Guest" }).closest("form");
      expect(form).toBeInTheDocument();
      
      // Submit the form
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(guestAPI.create).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Verify the call was made with correct data
      expect(guestAPI.create).toHaveBeenCalledWith(
        {
          firstName: "Jane",
          lastName: "Smith",
          email: undefined,
          phoneNumber: undefined,
          address: undefined,
          city: undefined,
          state: undefined,
          country: undefined,
          postalCode: undefined,
          identificationType: undefined,
          identificationNumber: undefined,
        },
        expect.any(Request)
      );
    });

    it("should handle empty optional fields as undefined", async () => {
      const user = userEvent.setup();
      vi.mocked(guestAPI.create).mockResolvedValue({ id: 1 });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await user.type(screen.getByLabelText(/First Name \*/), "Bob");
      await user.type(screen.getByLabelText(/Last Name \*/), "Johnson");
      // Leave optional fields empty

      const form = screen.getByRole("button", { name: "Register Guest" }).closest("form");
      expect(form).toBeInTheDocument();
      
      // Submit the form
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(guestAPI.create).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Verify the call was made with correct data
      expect(guestAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Bob",
          lastName: "Johnson",
          email: undefined,
          phoneNumber: undefined,
        }),
        expect.any(Request)
      );
    });
  });

  describe("Action", () => {
    it("should create guest and redirect on success", async () => {
      vi.mocked(guestAPI.create).mockResolvedValue({ id: 1 });

      const formData = new FormData();
      formData.append("firstName", "John");
      formData.append("lastName", "Doe");
      formData.append("email", "john.doe@example.com");

      const request = new Request("http://localhost/guests/new", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(guestAPI.create).toHaveBeenCalledWith(
        {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phoneNumber: undefined,
          address: undefined,
          city: undefined,
          state: undefined,
          country: undefined,
          postalCode: undefined,
          identificationType: undefined,
          identificationNumber: undefined,
        },
        expect.any(Request)
      );

      expect(result).toHaveProperty("status", 302);
      expect(result).toHaveProperty("headers");
    });

    it("should return error on API failure", async () => {
      // Mock a generic error - parseAPIError will return status: null, message: "API Error"
      // Since status is not 409 or 400, it will return the message
      vi.mocked(guestAPI.create).mockRejectedValue(new Error("API Error"));

      const formData = new FormData();
      formData.append("firstName", "John");
      formData.append("lastName", "Doe");

      const request = new Request("http://localhost/guests/new", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      // parseAPIError returns { status: null, message: "API Error" }
      // Since status is not 409 or 400, action returns { error: "API Error" }
      expect(result).toEqual({ error: "API Error" });
    });
  });
});

