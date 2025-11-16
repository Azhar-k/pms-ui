import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTableSort } from "../useTableSort";

// Mock react-router
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

describe("useTableSort", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.forEach((_, key) => {
      mockSearchParams.delete(key);
    });
  });

  describe("Default behavior", () => {
    it("should return default sort direction when no params", () => {
      const { result } = renderHook(() => useTableSort());
      
      expect(result.current.sortBy).toBeUndefined();
      expect(result.current.sortDir).toBe("asc");
    });

    it("should use custom default sort direction", () => {
      const { result } = renderHook(() =>
        useTableSort({ defaultSortDir: "desc" })
      );
      
      expect(result.current.sortDir).toBe("desc");
    });

    it("should return sortBy from URL params", () => {
      mockSearchParams.set("sortBy", "name");
      const { result } = renderHook(() => useTableSort());
      
      expect(result.current.sortBy).toBe("name");
    });

    it("should return sortDir from URL params", () => {
      mockSearchParams.set("sortBy", "name");
      mockSearchParams.set("sortDir", "desc");
      const { result } = renderHook(() => useTableSort());
      
      expect(result.current.sortDir).toBe("desc");
    });
  });

  describe("handleSort", () => {
    it("should set new sort field when clicking different column", () => {
      mockSearchParams.set("sortBy", "name");
      mockSearchParams.set("sortDir", "asc");
      
      const { result } = renderHook(() => useTableSort());
      
      act(() => {
        result.current.handleSort("email");
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=email")
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining("sortDir=asc")
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining("page=0")
      );
    });

    it("should toggle sort direction when clicking same column (asc to desc)", () => {
      mockSearchParams.set("sortBy", "name");
      mockSearchParams.set("sortDir", "asc");
      
      const { result } = renderHook(() => useTableSort());
      
      act(() => {
        result.current.handleSort("name");
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=name")
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining("sortDir=desc")
      );
    });

    it("should toggle sort direction when clicking same column (desc to asc)", () => {
      mockSearchParams.set("sortBy", "name");
      mockSearchParams.set("sortDir", "desc");
      
      const { result } = renderHook(() => useTableSort());
      
      act(() => {
        result.current.handleSort("name");
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining("sortDir=asc")
      );
    });

    it("should reset to page 0 when sorting", () => {
      mockSearchParams.set("sortBy", "name");
      mockSearchParams.set("page", "2");
      
      const { result } = renderHook(() => useTableSort());
      
      act(() => {
        result.current.handleSort("email");
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining("page=0")
      );
    });

    it("should handle uppercase sortDir", () => {
      mockSearchParams.set("sortBy", "name");
      mockSearchParams.set("sortDir", "ASC");
      
      const { result } = renderHook(() => useTableSort());
      
      act(() => {
        result.current.handleSort("name");
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining("sortDir=desc")
      );
    });

    it("should use default sort direction for new field when default is desc", () => {
      // Clear any existing params
      mockSearchParams.delete("sortBy");
      mockSearchParams.delete("sortDir");
      
      const { result } = renderHook(() =>
        useTableSort({ defaultSortDir: "desc" })
      );
      
      act(() => {
        result.current.handleSort("name");
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining("sortDir=desc")
      );
    });
  });

  describe("getSortIcon", () => {
    it("should return neutral icon when not sorted", () => {
      const { result } = renderHook(() => useTableSort());
      
      expect(result.current.getSortIcon("name")).toBe("⇅");
    });

    it("should return ascending icon when sorted ascending", () => {
      mockSearchParams.set("sortBy", "name");
      mockSearchParams.set("sortDir", "asc");
      
      const { result } = renderHook(() => useTableSort());
      
      expect(result.current.getSortIcon("name")).toBe("↑");
    });

    it("should return descending icon when sorted descending", () => {
      mockSearchParams.set("sortBy", "name");
      mockSearchParams.set("sortDir", "desc");
      
      const { result } = renderHook(() => useTableSort());
      
      expect(result.current.getSortIcon("name")).toBe("↓");
    });

    it("should handle uppercase sortDir", () => {
      mockSearchParams.set("sortBy", "name");
      mockSearchParams.set("sortDir", "ASC");
      
      const { result } = renderHook(() => useTableSort());
      
      expect(result.current.getSortIcon("name")).toBe("↑");
    });

    it("should return neutral icon for different field", () => {
      mockSearchParams.set("sortBy", "name");
      mockSearchParams.set("sortDir", "asc");
      
      const { result } = renderHook(() => useTableSort());
      
      expect(result.current.getSortIcon("email")).toBe("⇅");
    });
  });
});

