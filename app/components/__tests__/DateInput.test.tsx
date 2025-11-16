import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateInput } from "../DateInput";

describe("DateInput", () => {
  beforeEach(() => {
    // Mock showPicker if it doesn't exist
    if (!HTMLInputElement.prototype.showPicker) {
      HTMLInputElement.prototype.showPicker = vi.fn();
    }
  });

  describe("Rendering", () => {
    it("should render date input", () => {
      render(<DateInput id="test-date" name="testDate" />);
      const input = document.querySelector('input[type="date"][name="testDate"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe("date");
      expect(input.id).toBe("test-date");
    });

    it("should render label when provided", () => {
      render(<DateInput id="test-date" name="testDate" label="Check-in Date" />);
      expect(screen.getByLabelText("Check-in Date")).toBeInTheDocument();
      const input = screen.getByLabelText("Check-in Date") as HTMLInputElement;
      expect(input.type).toBe("date");
    });

    it("should not render label when not provided", () => {
      render(<DateInput id="test-date" name="testDate" />);
      const input = document.querySelector('input[type="date"][name="testDate"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(screen.queryByText("Check-in Date")).not.toBeInTheDocument();
    });

    it("should apply default value", () => {
      render(
        <DateInput
          id="test-date"
          name="testDate"
          defaultValue="2024-01-15"
        />
      );
      const input = document.querySelector('input[type="date"][name="testDate"]') as HTMLInputElement;
      expect(input.value).toBe("2024-01-15");
    });

    it("should apply custom className", () => {
      render(
        <DateInput
          id="test-date"
          name="testDate"
          className="custom-class"
        />
      );
      const input = document.querySelector('input[type="date"][name="testDate"]') as HTMLInputElement;
      expect(input).toHaveClass("custom-class");
    });

    it("should render calendar icon button", () => {
      render(<DateInput id="test-date" name="testDate" />);
      const button = screen.getByLabelText("Open calendar");
      expect(button).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should open date picker when icon is clicked", async () => {
      const showPickerSpy = vi.spyOn(HTMLInputElement.prototype, "showPicker");
      const focusSpy = vi.spyOn(HTMLInputElement.prototype, "focus");
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click");

      render(<DateInput id="test-date" name="testDate" />);
      
      const button = screen.getByLabelText("Open calendar");
      await userEvent.click(button);

      expect(showPickerSpy).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });

    it("should pass through other input props", () => {
      render(
        <DateInput
          id="test-date"
          name="testDate"
          required
          disabled
          data-testid="date-input"
        />
      );
      const input = screen.getByTestId("date-input") as HTMLInputElement;
      expect(input.required).toBe(true);
      expect(input.disabled).toBe(true);
    });
  });
});

