import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SortableHeader } from "../SortableHeader";

describe("SortableHeader", () => {
  describe("Rendering", () => {
    it("should render label", () => {
      const handleSort = vi.fn();
      render(
        <SortableHeader field="name" label="Name" onSort={handleSort} />
      );
      expect(screen.getByText((content) => content.includes("Name"))).toBeInTheDocument();
    });

    it("should show neutral sort icon when not sorted", () => {
      const handleSort = vi.fn();
      render(
        <SortableHeader field="name" label="Name" onSort={handleSort} />
      );
      expect(screen.getByText((content) => content.includes("⇅"))).toBeInTheDocument();
    });

    it("should show ascending icon when sorted ascending", () => {
      const handleSort = vi.fn();
      render(
        <SortableHeader
          field="name"
          label="Name"
          sortBy="name"
          sortDir="asc"
          onSort={handleSort}
        />
      );
      expect(screen.getByText((content) => content.includes("↑"))).toBeInTheDocument();
    });

    it("should show descending icon when sorted descending", () => {
      const handleSort = vi.fn();
      render(
        <SortableHeader
          field="name"
          label="Name"
          sortBy="name"
          sortDir="desc"
          onSort={handleSort}
        />
      );
      expect(screen.getByText((content) => content.includes("↓"))).toBeInTheDocument();
    });

    it("should handle uppercase sortDir", () => {
      const handleSort = vi.fn();
      render(
        <SortableHeader
          field="name"
          label="Name"
          sortBy="name"
          sortDir="ASC"
          onSort={handleSort}
        />
      );
      expect(screen.getByText((content) => content.includes("↑"))).toBeInTheDocument();
    });

    it("should apply left alignment by default", () => {
      const handleSort = vi.fn();
      const { container } = render(
        <SortableHeader field="name" label="Name" onSort={handleSort} />
      );
      const header = container.querySelector("th");
      expect(header).toHaveClass("text-left");
    });

    it("should apply right alignment", () => {
      const handleSort = vi.fn();
      const { container } = render(
        <SortableHeader
          field="amount"
          label="Amount"
          align="right"
          onSort={handleSort}
        />
      );
      const header = container.querySelector("th");
      expect(header).toHaveClass("text-right");
    });

    it("should apply center alignment", () => {
      const handleSort = vi.fn();
      const { container } = render(
        <SortableHeader
          field="status"
          label="Status"
          align="center"
          onSort={handleSort}
        />
      );
      const header = container.querySelector("th");
      expect(header).toHaveClass("text-center");
    });

    it("should apply custom className", () => {
      const handleSort = vi.fn();
      const { container } = render(
        <SortableHeader
          field="name"
          label="Name"
          className="custom-class"
          onSort={handleSort}
        />
      );
      const header = container.querySelector("th");
      expect(header).toHaveClass("custom-class");
    });
  });

  describe("Interactions", () => {
    it("should call onSort when clicked", async () => {
      const handleSort = vi.fn();
      const { container } = render(
        <SortableHeader field="name" label="Name" onSort={handleSort} />
      );
      
      const header = container.querySelector("th");
      await userEvent.click(header!);
      
      expect(handleSort).toHaveBeenCalledWith("name");
      expect(handleSort).toHaveBeenCalledTimes(1);
    });

    it("should have cursor pointer style", () => {
      const handleSort = vi.fn();
      const { container } = render(
        <SortableHeader field="name" label="Name" onSort={handleSort} />
      );
      const header = container.querySelector("th");
      expect(header).toHaveClass("cursor-pointer", "hover:bg-gray-100");
    });
  });
});

