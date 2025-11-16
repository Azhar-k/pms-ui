import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  describe("Rendering", () => {
    it("should render status text", () => {
      render(<StatusBadge status="ACTIVE" />);
      expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    });

    it("should apply default color when no colorMap provided", () => {
      render(<StatusBadge status="UNKNOWN" />);
      const badge = screen.getByText("UNKNOWN");
      expect(badge).toHaveClass("bg-gray-100", "text-gray-800");
    });

    it("should apply color from colorMap", () => {
      const colorMap = {
        ACTIVE: "bg-green-100 text-green-800",
        INACTIVE: "bg-red-100 text-red-800",
      };
      render(<StatusBadge status="ACTIVE" colorMap={colorMap} />);
      const badge = screen.getByText("ACTIVE");
      expect(badge).toHaveClass("bg-green-100", "text-green-800");
    });

    it("should use default color for status not in colorMap", () => {
      const colorMap = {
        ACTIVE: "bg-green-100 text-green-800",
      };
      render(<StatusBadge status="UNKNOWN" colorMap={colorMap} />);
      const badge = screen.getByText("UNKNOWN");
      expect(badge).toHaveClass("bg-gray-100", "text-gray-800");
    });

    it("should apply custom defaultColor", () => {
      render(<StatusBadge status="UNKNOWN" defaultColor="bg-blue-100 text-blue-800" />);
      const badge = screen.getByText("UNKNOWN");
      expect(badge).toHaveClass("bg-blue-100", "text-blue-800");
    });

    it("should apply custom className", () => {
      render(<StatusBadge status="ACTIVE" className="custom-class" />);
      const badge = screen.getByText("ACTIVE");
      expect(badge).toHaveClass("custom-class");
    });

    it("should have correct base classes", () => {
      render(<StatusBadge status="TEST" />);
      const badge = screen.getByText("TEST");
      expect(badge).toHaveClass(
        "px-2",
        "inline-flex",
        "text-xs",
        "leading-5",
        "font-semibold",
        "rounded-full"
      );
    });
  });
});

