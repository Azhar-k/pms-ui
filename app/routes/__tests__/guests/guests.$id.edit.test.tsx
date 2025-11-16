import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import EditGuestPage, { loader, action } from "../../guests/guests.$id.edit";
import { guestAPI } from "../../../services/api";

// Mock the API
vi.mock("../../../services/api", () => ({
  guestAPI: {
    getById: vi.fn(),
    update: vi.fn(),
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

describe("EditGuestPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/guests/1/edit"]) => {
    return createMemoryRouter(
      [
        {
          path: "/guests/:id/edit",
          element: <EditGuestPage />,
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
    it("should load guest successfully", async () => {
      vi.mocked(guestAPI.getById).mockResolvedValue(mockGuest);

      const result = await loader({ params: { id: "1" }, request: new Request("http://localhost/guests/1/edit"), context: {} } as any);

      expect(result.guest).toEqual(mockGuest);
      expect(guestAPI.getById).toHaveBeenCalledWith(1, expect.any(Request));
    });

    it("should throw 404 when guest not found", async () => {
      vi.mocked(guestAPI.getById).mockRejectedValue(new Error("Not found"));

      await expect(
        loader({ params: { id: "999" }, request: new Request("http://localhost/guests/999/edit"), context: {} } as any)
      ).rejects.toThrow();
    });
  });

  describe("Rendering", () => {
    it("should render the edit guest page with title and description", async () => {
      vi.mocked(guestAPI.getById).mockResolvedValue(mockGuest);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Edit Guest")).toBeInTheDocument();
        expect(screen.getByText("Update guest information")).toBeInTheDocument();
      });
    });

    it("should pre-fill form fields with guest data", async () => {
      vi.mocked(guestAPI.getById).mockResolvedValue(mockGuest);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const firstNameInput = screen.getByLabelText(/First Name \*/) as HTMLInputElement;
        const lastNameInput = screen.getByLabelText(/Last Name \*/) as HTMLInputElement;
        const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
        const phoneInput = screen.getByLabelText("Phone Number") as HTMLInputElement;
        const addressInput = screen.getByLabelText("Address") as HTMLInputElement;
        const cityInput = screen.getByLabelText("City") as HTMLInputElement;
        const stateInput = screen.getByLabelText("State") as HTMLInputElement;
        const postalCodeInput = screen.getByLabelText("Postal Code") as HTMLInputElement;
        const countryInput = screen.getByLabelText("Country") as HTMLInputElement;
        const idTypeSelect = screen.getByLabelText("ID Type") as HTMLSelectElement;
        const idNumberInput = screen.getByLabelText("ID Number") as HTMLInputElement;

        expect(firstNameInput.value).toBe("John");
        expect(lastNameInput.value).toBe("Doe");
        expect(emailInput.value).toBe("john.doe@example.com");
        expect(phoneInput.value).toBe("+1234567890");
        expect(addressInput.value).toBe("123 Main Street");
        expect(cityInput.value).toBe("New York");
        expect(stateInput.value).toBe("NY");
        expect(postalCodeInput.value).toBe("10001");
        expect(countryInput.value).toBe("USA");
        expect(idTypeSelect.value).toBe("PASSPORT");
        expect(idNumberInput.value).toBe("AB123456");
      });
    });

    it("should handle empty optional fields", async () => {
      const guestWithMinimalData = {
        id: 2,
        firstName: "Jane",
        lastName: "Smith",
      };

      vi.mocked(guestAPI.getById).mockResolvedValue(guestWithMinimalData);

      const router = createRouter(["/guests/2/edit"]);
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
        const phoneInput = screen.getByLabelText("Phone Number") as HTMLInputElement;
        const idTypeSelect = screen.getByLabelText("ID Type") as HTMLSelectElement;

        expect(emailInput.value).toBe("");
        expect(phoneInput.value).toBe("");
        expect(idTypeSelect.value).toBe("");
      });
    });

    it("should render Update Guest and Cancel buttons", async () => {
      vi.mocked(guestAPI.getById).mockResolvedValue(mockGuest);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Update Guest" })).toBeInTheDocument();
        const cancelLink = screen.getByRole("link", { name: "Cancel" });
        expect(cancelLink).toBeInTheDocument();
        expect(cancelLink).toHaveAttribute("href", "/guests/1");
      });
    });
  });

  describe("Form Submission", () => {
    it("should update guest with modified data", async () => {
      const user = userEvent.setup();
      vi.mocked(guestAPI.getById).mockResolvedValue(mockGuest);
      vi.mocked(guestAPI.update).mockResolvedValue({ ...mockGuest, firstName: "Jane" });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/First Name \*/)).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/First Name \*/) as HTMLInputElement;
      await user.clear(firstNameInput);
      await user.type(firstNameInput, "Jane");

      const form = screen.getByRole("button", { name: "Update Guest" }).closest("form");
      expect(form).toBeInTheDocument();
      
      // Submit the form
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(guestAPI.update).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Verify the call was made with correct data
      expect(guestAPI.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          firstName: "Jane",
        }),
        expect.any(Request)
      );
    });

    it("should submit all form fields", async () => {
      const user = userEvent.setup();
      vi.mocked(guestAPI.getById).mockResolvedValue(mockGuest);
      vi.mocked(guestAPI.update).mockResolvedValue(mockGuest);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/First Name \*/)).toBeInTheDocument();
      });

      // Modify some fields
      await user.clear(screen.getByLabelText("Email") as HTMLInputElement);
      await user.type(screen.getByLabelText("Email") as HTMLInputElement, "newemail@example.com");
      await user.selectOptions(screen.getByLabelText("ID Type"), "DRIVER_LICENSE");

      const form = screen.getByRole("button", { name: "Update Guest" }).closest("form");
      expect(form).toBeInTheDocument();
      
      // Submit the form
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(guestAPI.update).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Verify the call was made with correct data
      expect(guestAPI.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          firstName: "John",
          lastName: "Doe",
          email: "newemail@example.com",
          identificationType: "DRIVER_LICENSE",
        }),
        expect.any(Request)
      );
    });
  });

  describe("Action", () => {
    it("should update guest and redirect on success", async () => {
      vi.mocked(guestAPI.update).mockResolvedValue(mockGuest);

      const formData = new FormData();
      formData.append("firstName", "Jane");
      formData.append("lastName", "Doe");
      formData.append("email", "jane.doe@example.com");

      const request = new Request("http://localhost/guests/1", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: { id: "1" }, context: {} } as any);

      expect(guestAPI.update).toHaveBeenCalledWith(
        1,
        {
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
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
      expect(result.headers.get("Location")).toBe("/guests/1");
    });

    it("should return error on API failure", async () => {
      // Mock a generic error - parseAPIError will return status: null, message: "API Error"
      // Since status is not 400/404/409, it will return the message
      vi.mocked(guestAPI.update).mockRejectedValue(new Error("API Error"));

      const formData = new FormData();
      formData.append("firstName", "Jane");
      formData.append("lastName", "Doe");

      const request = new Request("http://localhost/guests/1", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: { id: "1" }, context: {} } as any);

      // parseAPIError returns { status: null, message: "API Error" }
      // Since status is not 400/404/409, action returns { error: "API Error" }
      expect(result).toEqual({ error: "API Error" });
    });
  });
});

