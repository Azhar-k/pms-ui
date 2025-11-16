import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Button } from "../Button";

describe("Button", () => {
  describe("Rendering", () => {
    it("should render button with children", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("should render as Link when 'to' prop is provided", () => {
      const router = createMemoryRouter([
        {
          path: "/",
          element: <Button to="/test">Go to test</Button>,
        },
      ]);
      render(<RouterProvider router={router} />);
      
      const link = screen.getByText("Go to test").closest("a");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
    });

    it("should render as button when 'to' prop is not provided", () => {
      render(<Button>Click me</Button>);
      const button = screen.getByText("Click me");
      expect(button.tagName).toBe("BUTTON");
    });

    it("should apply primary variant by default", () => {
      render(<Button>Primary</Button>);
      const button = screen.getByText("Primary");
      expect(button).toHaveClass("bg-blue-600");
    });

    it("should apply secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByText("Secondary");
      expect(button).toHaveClass("bg-gray-200");
    });

    it("should apply danger variant", () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByText("Danger");
      expect(button).toHaveClass("bg-red-600");
    });

    it("should apply success variant", () => {
      render(<Button variant="success">Success</Button>);
      const button = screen.getByText("Success");
      expect(button).toHaveClass("bg-green-600");
    });

    it("should apply custom className", () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByText("Custom");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("Interactions", () => {
    it("should call onClick when button is clicked", async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByText("Click me");
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should be disabled when disabled prop is provided", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByText("Disabled") as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      expect(button).toHaveClass("disabled:opacity-50", "disabled:cursor-not-allowed");
    });

    it("should pass through other button props", () => {
      render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
      const button = screen.getByTestId("submit-btn") as HTMLButtonElement;
      expect(button.type).toBe("submit");
    });
  });
});

