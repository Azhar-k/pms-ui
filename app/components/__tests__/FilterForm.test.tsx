import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { FilterForm } from "../FilterForm";

describe("FilterForm", () => {
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
      const router = createMemoryRouter([
        {
          path: "/test",
          element: (
            <FilterForm clearUrl="/test" showPageSize={false}>
              <input name="search" placeholder="Search" />
            </FilterForm>
          ),
        },
      ]);
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

    it("should apply custom className", () => {
      const router = createMemoryRouter([
        {
          path: "/test",
          element: (
            <FilterForm clearUrl="/test" className="custom-class">
              <input name="search" placeholder="Search" />
            </FilterForm>
          ),
        },
      ]);
      render(<RouterProvider router={router} />);
      const formContainer = screen.getByPlaceholderText("Search").closest("div")?.parentElement;
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

      const form = screen.getByPlaceholderText("Search").closest("form");
      await user.click(screen.getByText("Apply Filters"));

      await waitFor(() => {
        expect(router.state.location.search).toContain("search=test+query");
      });
    });

    it("should exclude empty values from URL", async () => {
      const user = userEvent.setup();
      const router = createRouter();
      render(<RouterProvider router={router} />);

      const searchInput = screen.getByPlaceholderText("Search");
      await user.type(searchInput, "   "); // Only whitespace

      const form = screen.getByPlaceholderText("Search").closest("form");
      await user.click(screen.getByText("Apply Filters"));

      await waitFor(() => {
        // Empty values should be excluded
        expect(router.state.location.search).not.toContain("search=");
      });
    });

    it("should include multiple form fields", async () => {
      const user = userEvent.setup();
      const router = createMemoryRouter([
        {
          path: "/test",
          element: (
            <FilterForm clearUrl="/test">
              <input name="search" placeholder="Search" />
              <input name="email" placeholder="Email" />
            </FilterForm>
          ),
        },
      ]);
      render(<RouterProvider router={router} />);

      await user.type(screen.getByPlaceholderText("Search"), "test");
      await user.type(screen.getByPlaceholderText("Email"), "test@example.com");

      await user.click(screen.getByText("Apply Filters"));

      await waitFor(() => {
        expect(router.state.location.search).toContain("search=test");
        expect(router.state.location.search).toContain("email=test%40example.com");
      });
    });
  });
});

