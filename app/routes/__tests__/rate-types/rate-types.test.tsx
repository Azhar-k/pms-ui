import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import RateTypesPage, { loader } from "../../rate-types/rate-types";
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
  },
];

const mockRateTypes = [
  {
    id: 1,
    name: "Standard Rate",
    description: "Standard pricing",
    isActive: true,
  },
  {
    id: 2,
    name: "Premium Rate",
    description: "Premium pricing",
    isActive: true,
  },
];

describe("RateTypesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/rate-types"]) => {
    return createMemoryRouter(
      [
        {
          path: "/rate-types",
          element: <RateTypesPage />,
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

      const request = new Request("http://localhost/rate-types");
      const result = await loader({ request });

      expect(result.roomTypes).toHaveLength(1);
      expect(result.rateTypes).toHaveLength(2);
      expect(roomTypeAPI.getAll).toHaveBeenCalled();
      expect(rateTypeAPI.getAll).toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(roomTypeAPI.getAll).mockRejectedValue(new Error("API Error"));
      vi.mocked(rateTypeAPI.getAll).mockRejectedValue(new Error("API Error"));

      const request = new Request("http://localhost/rate-types");
      const result = await loader({ request });

      expect(result.roomTypes).toEqual([]);
      expect(result.rateTypes).toEqual([]);
    });
  });

  describe("Rendering", () => {
    it("should render rate types page with title and description", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Room Types")).toBeInTheDocument();
        expect(screen.getByText("Manage hotel room types")).toBeInTheDocument();
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

    it("should render 'Add New Rate Type' button", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const addButton = screen.getByText("Add New Rate Type");
        expect(addButton).toBeInTheDocument();
        expect(addButton.closest("a")).toHaveAttribute("href", "/rate-types/new");
      });
    });

    it("should render rate type cards", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue(mockRateTypes);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Standard Rate")).toBeInTheDocument();
        expect(screen.getByText("Premium Rate")).toBeInTheDocument();
      });
    });

    it("should render empty state when no rate types", async () => {
      vi.mocked(roomTypeAPI.getAll).mockResolvedValue(mockRoomTypes);
      vi.mocked(rateTypeAPI.getAll).mockResolvedValue([]);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText(/No rate types found. Create your first rate type!/)).toBeInTheDocument();
      });
    });
  });
});

