import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import RoomTypesPage, { loader } from "../../room-types/room-types";
import { roomTypeAPI, rateTypeAPI } from "../../../services/api";

// Mock the API
vi.mock("../../../services/api", () => ({
  roomTypeAPI: {
    getAll: vi.fn(),
  },
  rateTypeAPI: {
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

const mockRoomTypes = [
  {
    id: 1,
    name: "Deluxe",
    basePricePerNight: 5000,
    description: "Spacious deluxe room",
    maxOccupancy: 2,
    defaultRoomSize: 300,
    hasBalcony: true,
    hasView: true,
    hasMinibar: false,
    hasSafe: true,
    hasAirConditioning: true,
  },
  {
    id: 2,
    name: "Standard",
    basePricePerNight: 3000,
    description: "Standard room",
    maxOccupancy: 1,
    defaultRoomSize: 200,
    hasBalcony: false,
    hasView: false,
    hasMinibar: false,
    hasSafe: false,
    hasAirConditioning: true,
  },
];

const mockRateTypes = [
  { id: 1, name: "Standard Rate" },
  { id: 2, name: "Premium Rate" },
];

describe("RoomTypesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/room-types"]) => {
    return createMemoryRouter(
      [
        {
          path: "/room-types",
          element: <RoomTypesPage />,
          loader: loader,
        },
      ],
      {
        initialEntries,
      }
    );
  };

  describe("Loader", () => {
    it("should load room types and rate types successfully", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const request = new Request("http://localhost/room-types");
      const result = await loader({ request });

      expect(result.roomTypes).toHaveLength(2);
      expect(result.rateTypes).toHaveLength(2);
      expect(roomTypeAPI.getAll).toHaveBeenCalled();
      expect(rateTypeAPI.getAll).toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(roomTypeAPI.getAll).mockRejectedValue(new Error("API Error"));
      vi.mocked(rateTypeAPI.getAll).mockRejectedValue(new Error("API Error"));

      const request = new Request("http://localhost/room-types");
      const result = await loader({ request });

      expect(result.roomTypes).toEqual([]);
      expect(result.rateTypes).toEqual([]);
    });

    it("should handle partial API failures", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);
      vi.mocked(rateTypeAPI.getAll).mockRejectedValue(new Error("API Error"));

      const request = new Request("http://localhost/room-types");
      const result = await loader({ request });

      expect(result.roomTypes).toHaveLength(2);
      expect(result.rateTypes).toEqual([]);
    });
  });

  describe("Rendering", () => {
    it("should render room types page with title and description", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Room Types")).toBeInTheDocument();
        expect(screen.getByText("Manage hotel room types")).toBeInTheDocument();
      });
    });

    it("should render 'Add New Room Type' button", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const addButton = screen.getByText("Add New Room Type");
        expect(addButton).toBeInTheDocument();
        expect(addButton.closest("a")).toHaveAttribute("href", "/room-types/new");
      });
    });

    it("should render room type cards", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Deluxe")).toBeInTheDocument();
        expect(screen.getByText("Standard")).toBeInTheDocument();
      });
    });

    it("should render room type details", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        // Find the Deluxe room type card and check details within it
        const deluxeCard = screen.getByText("Deluxe").closest(".bg-white");
        expect(deluxeCard).toBeInTheDocument();
        
        const withinDeluxe = within(deluxeCard!);
        expect(withinDeluxe.getByText("₹5000.00 / night")).toBeInTheDocument();
        expect(withinDeluxe.getByText("Spacious deluxe room")).toBeInTheDocument();
        expect(withinDeluxe.getByText("Max Occupancy:")).toBeInTheDocument();
        expect(withinDeluxe.getByText("2")).toBeInTheDocument();
      });
    });

    it("should render room type amenities", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        // Find the Deluxe room type card and check amenities within it
        const deluxeCard = screen.getByText("Deluxe").closest(".bg-white");
        expect(deluxeCard).toBeInTheDocument();
        
        const withinDeluxe = within(deluxeCard!);
        // Look for amenity badges (they are spans, not anchor tags)
        expect(withinDeluxe.getByText("Balcony")).toBeInTheDocument();
        // "View" appears as both an amenity badge (span) and an action link (anchor)
        // Use getAllByText and filter to find the span element
        const viewElements = withinDeluxe.getAllByText("View");
        const viewAmenity = viewElements.find(el => el.tagName === "SPAN");
        expect(viewAmenity).toBeInTheDocument();
        expect(withinDeluxe.getByText("Safe")).toBeInTheDocument();
        expect(withinDeluxe.getByText("A/C")).toBeInTheDocument();
      });
    });

    it("should render empty state when no room types", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue([]);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText(/No room types found. Create your first room type!/)).toBeInTheDocument();
      });
    });

    it("should render View and Edit links for each room type", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        // Filter to only get anchor links for room types (not rate types, not amenity badges)
        const allViewLinks = screen.getAllByText("View");
        const roomTypeViewLinks = allViewLinks.filter(
          (link) => link.tagName === "A" && link.getAttribute("href")?.startsWith("/room-types/")
        );
        
        const allEditLinks = screen.getAllByText("Edit");
        const roomTypeEditLinks = allEditLinks.filter(
          (link) => link.tagName === "A" && link.getAttribute("href")?.startsWith("/room-types/")
        );

        expect(roomTypeViewLinks).toHaveLength(2);
        expect(roomTypeEditLinks).toHaveLength(2);

        expect(roomTypeViewLinks[0]).toHaveAttribute("href", "/room-types/1");
        expect(roomTypeEditLinks[0]).toHaveAttribute("href", "/room-types/1/edit");
      });
    });

    it("should render rate types section", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Rate Types")).toBeInTheDocument();
        expect(screen.getByText("Manage rate types and room type rates")).toBeInTheDocument();
      });
    });
  });
});

