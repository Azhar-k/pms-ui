import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterField } from "../FilterField";

// Mock DateInput
vi.mock("../DateInput", () => ({
  DateInput: ({ label, id, name, defaultValue, className }: any) => (
    <div>
      {label && <label htmlFor={id}>{label}</label>}
      <input
        type="date"
        id={id}
        name={name}
        defaultValue={defaultValue}
        className={className}
        data-testid="date-input"
      />
    </div>
  ),
}));

describe("FilterField", () => {
  describe("Rendering", () => {
    it("should render text input by default", () => {
      render(<FilterField label="Search" name="search" />);
      expect(screen.getByLabelText("Search")).toBeInTheDocument();
      const input = screen.getByLabelText("Search") as HTMLInputElement;
      expect(input.type).toBe("text");
    });

    it("should render email input", () => {
      render(<FilterField label="Email" name="email" type="email" />);
      const input = screen.getByLabelText("Email") as HTMLInputElement;
      expect(input.type).toBe("email");
    });

    it("should render number input", () => {
      render(<FilterField label="Count" name="count" type="number" />);
      const input = screen.getByLabelText("Count") as HTMLInputElement;
      expect(input.type).toBe("number");
    });

    it("should render select input", () => {
      const options = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
      ];
      render(
        <FilterField
          label="Status"
          name="status"
          type="select"
          options={options}
        />
      );
      const select = screen.getByLabelText("Status") as HTMLSelectElement;
      expect(select.tagName).toBe("SELECT");
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
    });

    it("should render date input", () => {
      render(
        <FilterField
          label="Check-in Date"
          name="checkInDate"
          type="date"
        />
      );
      expect(screen.getByTestId("date-input")).toBeInTheDocument();
    });

    it("should render datetime-local input", () => {
      render(
        <FilterField
          label="Event Time"
          name="eventTime"
          type="datetime-local"
        />
      );
      const input = screen.getByLabelText("Event Time") as HTMLInputElement;
      expect(input.type).toBe("datetime-local");
    });

    it("should apply placeholder", () => {
      render(
        <FilterField
          label="Search"
          name="search"
          placeholder="Enter search term"
        />
      );
      const input = screen.getByPlaceholderText("Enter search term");
      expect(input).toBeInTheDocument();
    });

    it("should apply defaultValue", () => {
      render(
        <FilterField
          label="Search"
          name="search"
          defaultValue="test value"
        />
      );
      const input = screen.getByLabelText("Search") as HTMLInputElement;
      expect(input.value).toBe("test value");
    });

    it("should use name as id by default", () => {
      render(<FilterField label="Search" name="searchTerm" />);
      const input = screen.getByLabelText("Search");
      expect(input.id).toBe("searchTerm");
    });

    it("should use custom id when provided", () => {
      render(
        <FilterField label="Search" name="searchTerm" id="custom-id" />
      );
      const input = screen.getByLabelText("Search");
      expect(input.id).toBe("custom-id");
    });

    it("should apply custom className", () => {
      render(
        <FilterField
          label="Search"
          name="search"
          className="custom-class"
        />
      );
      const input = screen.getByLabelText("Search");
      expect(input).toHaveClass("custom-class");
    });
  });
});

