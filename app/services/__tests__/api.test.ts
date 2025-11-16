import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  roomAPI,
  roomTypeAPI,
  rateTypeAPI,
  guestAPI,
  reservationAPI,
  invoiceAPI,
  userManagementAPI,
} from "../api";
import { tokenStorage } from "../auth";

// Mock fetch globally
global.fetch = vi.fn();

// Mock tokenStorage
vi.mock("../auth", () => ({
  tokenStorage: {
    getAccessToken: vi.fn(() => "mock-token"),
  },
}));

describe("API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("buildQueryString", () => {
    it("should build query string from params", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ content: [], totalElements: 0 }),
      });

      await roomAPI.getAll({ page: 0, size: 10, roomNumber: "101" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("page=0"),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("size=10"),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("roomNumber=101"),
        expect.any(Object)
      );
    });

    it("should exclude undefined, null, and empty values", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ content: [], totalElements: 0 }),
      });

      await roomAPI.getAll({
        page: 0,
        size: 10,
        roomNumber: undefined,
        status: null as any,
        searchTerm: "",
      });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).not.toContain("roomNumber");
      expect(callUrl).not.toContain("status");
      expect(callUrl).not.toContain("searchTerm");
    });
  });

  describe("fetchAPI", () => {
    it("should include Authorization header when token exists", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 1, roomNumber: "101" }),
      });

      await roomAPI.getById(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
        })
      );
    });

    it("should handle 204 No Content response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await roomAPI.delete(1);
      expect(result).toEqual({});
    });

    it("should handle JSON response", async () => {
      const mockData = { id: 1, roomNumber: "101" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockData,
      });

      const result = await roomAPI.getById(1);
      expect(result).toEqual(mockData);
    });

    it("should handle 401 Unauthorized on client-side", async () => {
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = { href: "", pathname: "/test" };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Unauthorized",
      });

      vi.mocked(tokenStorage.clear).mockImplementation(() => {});

      await expect(roomAPI.getById(1)).resolves.toBeInstanceOf(Promise);
      
      // Restore window.location
      window.location = originalLocation;
    });

    it("should throw error for non-401 errors", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server Error",
      });

      await expect(roomAPI.getById(1)).rejects.toThrow("API Error");
    });

    it("should handle network errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new TypeError("Failed to fetch")
      );

      await expect(roomAPI.getById(1)).rejects.toThrow("Network error");
    });

    it("should handle CORS errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new TypeError("CORS error")
      );

      await expect(roomAPI.getById(1)).rejects.toThrow("CORS error");
    });
  });

  describe("Room API", () => {
    it("should call getAll with correct endpoint", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ content: [], totalElements: 0 }),
      });

      await roomAPI.getAll({ page: 0, size: 10 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/rooms"),
        expect.any(Object)
      );
    });

    it("should call getById with correct endpoint", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 1 }),
      });

      await roomAPI.getById(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/rooms/1"),
        expect.any(Object)
      );
    });

    it("should call create with POST method", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 1 }),
      });

      await roomAPI.create({ roomNumber: "101", roomTypeId: 1 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("101"),
        })
      );
    });

    it("should call update with PUT method", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 1 }),
      });

      await roomAPI.update(1, { roomNumber: "101" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/rooms/1"),
        expect.objectContaining({
          method: "PUT",
        })
      );
    });

    it("should call delete with DELETE method", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      await roomAPI.delete(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/rooms/1"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("Guest API", () => {
    it("should call getAll with pagination params", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ content: [], totalElements: 0 }),
      });

      await guestAPI.getAll({ page: 1, size: 20, email: "test@example.com" });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain("/guests");
      expect(callUrl).toContain("page=1");
      expect(callUrl).toContain("size=20");
      expect(callUrl).toContain("email=test%40example.com");
    });
  });

  describe("Reservation API", () => {
    it("should call checkIn with POST method", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 1 }),
      });

      await reservationAPI.checkIn(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/reservations/1/check-in"),
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should call checkOut with POST method", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 1 }),
      });

      await reservationAPI.checkOut(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/reservations/1/check-out"),
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  describe("User Management API", () => {
    it("should use user service base URL", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true, data: [] }),
      });

      await userManagementAPI.getAllUsers();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users"),
        expect.any(Object)
      );
    });
  });
});

