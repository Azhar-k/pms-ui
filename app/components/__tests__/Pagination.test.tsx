import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  beforeEach(() => {
    // Mock window.location for tests
    delete (window as any).location;
    (window as any).location = {
      pathname: "/test",
      href: "http://localhost/test",
      search: "",
    };
  });

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
      const router = createMemoryRouter(
        [
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
        ],
        {
          initialEntries: ["/test"],
        }
      );
      const { container } = render(<RouterProvider router={router} />);
      // Pagination returns null, so the container should only have the router wrapper
      // Check that pagination-specific elements are not present
      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });

    it("should render pagination info", async () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);
      
      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/test");
      });
      
      expect(screen.getByText(/Showing/)).toBeInTheDocument();
      // Use getAllByText since "1" appears multiple times (in info and page number)
      const ones = screen.getAllByText("1");
      expect(ones.length).toBeGreaterThan(0);
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
    });

    it("should calculate start and end items correctly", async () => {
      const router = createMemoryRouter(
        [
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
        ],
        {
          initialEntries: ["/test"],
        }
      );
      render(<RouterProvider router={router} />);
      
      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/test");
      });
      
      // Page 2 (0-indexed) = items 21-30
      expect(screen.getByText("21")).toBeInTheDocument();
      expect(screen.getByText("30")).toBeInTheDocument();
    });

    it("should handle last page correctly", async () => {
      const router = createMemoryRouter(
        [
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
        ],
        {
          initialEntries: ["/test"],
        }
      );
      render(<RouterProvider router={router} />);
      
      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/test");
      });
      
      // Last page should show 41-47
      // "47" appears twice (in "to 47" and "of 47 results"), so use getAllByText
      expect(screen.getByText("41")).toBeInTheDocument();
      const fortySevens = screen.getAllByText("47");
      expect(fortySevens.length).toBeGreaterThanOrEqual(1);
    });

    it("should render page numbers", async () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);
      
      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/test");
      });
      
      // With currentPage=0 and totalPages=5, the component shows:
      // - Page 1 (index 0, always shown)
      // - Pages 1, 2, 3 (indices 0, 1, 2, within range of currentPage ± 2)
      // - Page 5 (index 4, last page, always shown)
      // So we get pages 1, 2, 3, 5 = 4 page links shown
      // Find page links (not info text) by checking they're anchor tags with href containing "page="
      const pageLinks = screen.getAllByRole("link").filter(link => {
        const href = link.getAttribute("href");
        return href?.includes("page=") && /^[1-5]$/.test(link.textContent || "");
      });
      expect(pageLinks.length).toBeGreaterThanOrEqual(4);
      // Verify specific pages are present
      expect(screen.getByRole("link", { name: "1" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "2" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "3" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "5" })).toBeInTheDocument();
    });

    it("should highlight current page", async () => {
      const router = createMemoryRouter(
        [
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
        ],
        {
          initialEntries: ["/test"],
        }
      );
      render(<RouterProvider router={router} />);
      
      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/test");
      });
      
      // Page 3 (1-indexed) should be highlighted
      // Find the page link (not the info text)
      const page3Links = screen.getAllByText("3");
      const page3Link = page3Links.find(link => link.closest("a")?.getAttribute("href")?.includes("page=2"));
      expect(page3Link).toBeInTheDocument();
      expect(page3Link?.closest("a")).toHaveClass("bg-blue-50", "border-blue-500", "text-blue-600");
    });

    it("should render Previous button when not on first page", async () => {
      const router = createMemoryRouter(
        [
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
        ],
        {
          initialEntries: ["/test"],
        }
      );
      render(<RouterProvider router={router} />);
      
      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/test");
      });
      
      // Previous button appears in both mobile and desktop views
      const previousButtons = screen.getAllByText("Previous");
      expect(previousButtons.length).toBeGreaterThan(0);
    });

    it("should not render Previous button on first page", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);
      const previousButtons = screen.queryAllByText("Previous");
      // Previous button should not be visible on desktop view when on first page
      expect(previousButtons.length).toBe(0);
    });

    it("should render Next button when not on last page", async () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);
      
      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/test");
      });
      
      // Next button appears in both mobile and desktop views
      const nextButtons = screen.getAllByText("Next");
      expect(nextButtons.length).toBeGreaterThan(0);
    });

    it("should not render Next button on last page", async () => {
      const router = createMemoryRouter(
        [
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
        ],
        {
          initialEntries: ["/test"],
        }
      );
      render(<RouterProvider router={router} />);
      
      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/test");
      });
      
      const nextButtons = screen.queryAllByText("Next");
      // Next button should not be visible when on last page
      expect(nextButtons.length).toBe(0);
    });

    it("should show ellipsis for pages far from current", async () => {
      const router = createMemoryRouter(
        [
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
        ],
        {
          initialEntries: ["/test"],
        }
      );
      render(<RouterProvider router={router} />);
      
      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/test");
      });
      
      // Should show ellipsis
      const ellipsis = screen.getAllByText("...");
      expect(ellipsis.length).toBeGreaterThan(0);
    });

    it("should preserve search params in page links", async () => {
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
      
      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/test");
      });
      
      // Find the page 2 link (not the info text)
      const page2Links = screen.getAllByText("2");
      const page2Link = page2Links.find(link => link.closest("a")?.getAttribute("href")?.includes("page=1"));
      expect(page2Link).toBeInTheDocument();
      expect(page2Link?.closest("a")?.getAttribute("href")).toContain("search=test");
      expect(page2Link?.closest("a")?.getAttribute("href")).toContain("status=active");
      expect(page2Link?.closest("a")?.getAttribute("href")).toContain("page=1");
    });
  });
});

