import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  const createRouter = (initialEntries = ["/test"]) => {
    return createMemoryRouter(
      [
        {
          path: "/test",
          element: (
            <Pagination
              currentPage={0}
              totalPages={5}
              totalElements={50}
              pageSize={10}
            />
          ),
        },
      ],
      {
        initialEntries,
      }
    );
  };

  describe("Rendering", () => {
    it("should return null when totalPages <= 1", () => {
      const router = createMemoryRouter([
        {
          path: "/test",
          element: (
            <Pagination
              currentPage={0}
              totalPages={1}
              totalElements={5}
              pageSize={10}
            />
          ),
        },
      ]);
      const { container } = render(<RouterProvider router={router} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render pagination info", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);
      expect(screen.getByText(/Showing/)).toBeInTheDocument();
      expect(screen.getByText(/1/)).toBeInTheDocument();
      expect(screen.getByText(/10/)).toBeInTheDocument();
      expect(screen.getByText(/50/)).toBeInTheDocument();
    });

    it("should calculate start and end items correctly", () => {
      const router = createMemoryRouter([
        {
          path: "/test",
          element: (
            <Pagination
              currentPage={2}
              totalPages={5}
              totalElements={50}
              pageSize={10}
            />
          ),
        },
      ]);
      render(<RouterProvider router={router} />);
      // Page 2 (0-indexed) = items 21-30
      expect(screen.getByText(/21/)).toBeInTheDocument();
      expect(screen.getByText(/30/)).toBeInTheDocument();
    });

    it("should handle last page correctly", () => {
      const router = createMemoryRouter([
        {
          path: "/test",
          element: (
            <Pagination
              currentPage={4}
              totalPages={5}
              totalElements={47}
              pageSize={10}
            />
          ),
        },
      ]);
      render(<RouterProvider router={router} />);
      // Last page should show 41-47
      expect(screen.getByText(/41/)).toBeInTheDocument();
      expect(screen.getByText(/47/)).toBeInTheDocument();
    });

    it("should render page numbers", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);
      // Should show page 1, 2, 3, 4, 5 (1-indexed)
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should highlight current page", () => {
      const router = createMemoryRouter([
        {
          path: "/test",
          element: (
            <Pagination
              currentPage={2}
              totalPages={5}
              totalElements={50}
              pageSize={10}
            />
          ),
        },
      ]);
      render(<RouterProvider router={router} />);
      // Page 3 (1-indexed) should be highlighted
      const page3Link = screen.getByText("3").closest("a");
      expect(page3Link).toHaveClass("bg-blue-50", "border-blue-500", "text-blue-600");
    });

    it("should render Previous button when not on first page", () => {
      const router = createMemoryRouter([
        {
          path: "/test",
          element: (
            <Pagination
              currentPage={1}
              totalPages={5}
              totalElements={50}
              pageSize={10}
            />
          ),
        },
      ]);
      render(<RouterProvider router={router} />);
      expect(screen.getByText("Previous")).toBeInTheDocument();
    });

    it("should not render Previous button on first page", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);
      const previousButtons = screen.queryAllByText("Previous");
      // Previous button should not be visible on desktop view when on first page
      expect(previousButtons.length).toBe(0);
    });

    it("should render Next button when not on last page", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);
      expect(screen.getByText("Next")).toBeInTheDocument();
    });

    it("should not render Next button on last page", () => {
      const router = createMemoryRouter([
        {
          path: "/test",
          element: (
            <Pagination
              currentPage={4}
              totalPages={5}
              totalElements={50}
              pageSize={10}
            />
          ),
        },
      ]);
      render(<RouterProvider router={router} />);
      const nextButtons = screen.queryAllByText("Next");
      // Next button should not be visible on desktop view when on last page
      expect(nextButtons.length).toBe(0);
    });

    it("should show ellipsis for pages far from current", () => {
      const router = createMemoryRouter([
        {
          path: "/test",
          element: (
            <Pagination
              currentPage={5}
              totalPages={10}
              totalElements={100}
              pageSize={10}
            />
          ),
        },
      ]);
      render(<RouterProvider router={router} />);
      // Should show ellipsis
      const ellipsis = screen.getAllByText("...");
      expect(ellipsis.length).toBeGreaterThan(0);
    });

    it("should preserve search params in page links", () => {
      const router = createMemoryRouter(
        [
          {
            path: "/test",
            element: (
              <Pagination
                currentPage={0}
                totalPages={5}
                totalElements={50}
                pageSize={10}
              />
            ),
          },
        ],
        {
          initialEntries: ["/test?search=test&status=active"],
        }
      );
      render(<RouterProvider router={router} />);
      
      const page2Link = screen.getByText("2").closest("a");
      expect(page2Link?.getAttribute("href")).toContain("search=test");
      expect(page2Link?.getAttribute("href")).toContain("status=active");
      expect(page2Link?.getAttribute("href")).toContain("page=1");
    });
  });
});

