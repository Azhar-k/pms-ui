import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { FilterForm } from "../FilterForm";

describe("FilterForm", () => {
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
            <FilterForm clearUrl="/test">
              <input name="search" placeholder="Search" />
            </FilterForm>
          ),
        },
      ],
      {
        initialEntries,
      }
    );
  };

  describe("Rendering", () => {
    it("should render children", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);
      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    });

    it("should render page size selector by default", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);
      expect(screen.getByLabelText("Page Size")).toBeInTheDocument();
    });

    it("should not render page size selector when showPageSize is false", () => {
      const router = createMemoryRouter(
        [
          {
            path: "/test",
            element: (
              <FilterForm clearUrl="/test" showPageSize={false}>
                <input name="search" placeholder="Search" />
              </FilterForm>
            ),
          },
        ],
        {
          initialEntries: ["/test"],
        }
      );
      render(<RouterProvider router={router} />);
      expect(screen.queryByLabelText("Page Size")).not.toBeInTheDocument();
    });

    it("should render Apply Filters button", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);
      expect(screen.getByText("Apply Filters")).toBeInTheDocument();
    });

    it("should render Clear link", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);
      const clearLink = screen.getByText("Clear");
      expect(clearLink).toBeInTheDocument();
      expect(clearLink.closest("a")).toHaveAttribute("href", "/test");
    });

    it("should have default page size of 10", () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);
      const pageSizeSelect = screen.getByLabelText("Page Size") as HTMLSelectElement;
      expect(pageSizeSelect.value).toBe("10");
    });

    it("should use page size from URL params", () => {
      const router = createMemoryRouter(
        [
          {
            path: "/test",
            element: (
              <FilterForm clearUrl="/test">
                <input name="search" placeholder="Search" />
              </FilterForm>
            ),
          },
        ],
        {
          initialEntries: ["/test?size=20"],
        }
      );
      render(<RouterProvider router={router} />);
      const pageSizeSelect = screen.getByLabelText("Page Size") as HTMLSelectElement;
      expect(pageSizeSelect.value).toBe("20");
    });

    it("should preserve sort parameters as hidden inputs", () => {
      const router = createMemoryRouter(
        [
          {
            path: "/test",
            element: (
              <FilterForm clearUrl="/test">
                <input name="search" placeholder="Search" />
              </FilterForm>
            ),
          },
        ],
        {
          initialEntries: ["/test?sortBy=name&sortDir=asc"],
        }
      );
      render(<RouterProvider router={router} />);
      const sortByInput = document.querySelector('input[name="sortBy"]') as HTMLInputElement;
      const sortDirInput = document.querySelector('input[name="sortDir"]') as HTMLInputElement;
      expect(sortByInput).toBeInTheDocument();
      expect(sortByInput.value).toBe("name");
      expect(sortDirInput).toBeInTheDocument();
      expect(sortDirInput.value).toBe("asc");
    });

    it("should apply custom className", async () => {
      const router = createMemoryRouter(
        [
          {
            path: "/test",
            element: (
              <FilterForm clearUrl="/test" className="custom-class">
                <input name="search" placeholder="Search" />
              </FilterForm>
            ),
          },
        ],
        {
          initialEntries: ["/test"],
        }
      );
      render(<RouterProvider router={router} />);
      
      // Wait for router to initialize and component to render
      await waitFor(
        () => {
          expect(router.state.location.pathname).toBe("/test");
          expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
      
      // The className is on the outer div, which contains the form
      // Structure: div (with className) > form > input
      const searchInput = screen.getByPlaceholderText("Search");
      const form = searchInput.closest("form");
      const formContainer = form?.parentElement;
      expect(formContainer).toBeInTheDocument();
      expect(formContainer).toHaveClass("custom-class");
    });
  });

  describe("Form Submission", () => {
    it("should navigate with form data on submit", async () => {
      const user = userEvent.setup();
      const router = createRouter();
      render(<RouterProvider router={router} />);

      const searchInput = screen.getByPlaceholderText("Search");
      await user.type(searchInput, "test query");

      // Update window.location.pathname to match router location
      (window as any).location.pathname = router.state.location.pathname;

      await user.click(screen.getByText("Apply Filters"));

      await waitFor(() => {
        expect(router.state.location.search).toContain("search=test+query");
        // Update window.location to match router state
        (window as any).location.pathname = router.state.location.pathname;
      });
    });

    it("should exclude empty values from URL", async () => {
      const user = userEvent.setup();
      const router = createRouter();
      render(<RouterProvider router={router} />);

      const searchInput = screen.getByPlaceholderText("Search");
      await user.type(searchInput, "   "); // Only whitespace

      // Update window.location.pathname to match router location
      (window as any).location.pathname = router.state.location.pathname;

      await user.click(screen.getByText("Apply Filters"));

      await waitFor(() => {
        // Empty values should be excluded
        expect(router.state.location.search).not.toContain("search=");
        // Update window.location to match router state
        (window as any).location.pathname = router.state.location.pathname;
      });
    });

    it("should include multiple form fields", async () => {
      const user = userEvent.setup();
      const router = createMemoryRouter(
        [
          {
            path: "/test",
            element: (
              <FilterForm clearUrl="/test">
                <input name="search" placeholder="Search" />
                <input name="email" placeholder="Email" />
              </FilterForm>
            ),
          },
        ],
        {
          initialEntries: ["/test"],
        }
      );
      render(<RouterProvider router={router} />);

      // Wait for router to initialize and component to render
      await waitFor(
        () => {
          expect(router.state.location.pathname).toBe("/test");
          expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Update window.location.pathname to match router location
      (window as any).location.pathname = router.state.location.pathname;

      await user.type(screen.getByPlaceholderText("Search"), "test");
      await user.type(screen.getByPlaceholderText("Email"), "test@example.com");

      await user.click(screen.getByText("Apply Filters"));

      await waitFor(() => {
        expect(router.state.location.search).toContain("search=test");
        expect(router.state.location.search).toContain("email=test%40example.com");
        // Update window.location to match router state
        (window as any).location.pathname = router.state.location.pathname;
      });
    });
  });
});

