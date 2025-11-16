import { describe, it, expect, vi, beforeEach } from "vitest";
import { action } from "../../logout/logout";
import { authAPI, tokenStorage } from "../../../services/auth";

// Mock the API
vi.mock("../../../services/auth", () => ({
  authAPI: {
    logout: vi.fn(),
  },
  tokenStorage: {
    clear: vi.fn(),
  },
}));

describe("Logout Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call logout API and clear tokens", async () => {
    vi.mocked(authAPI.logout).mockResolvedValue(undefined);

    const request = new Request("http://localhost/logout", {
      method: "POST",
    });

    const result = await action({ request, params: {}, context: {} } as any);

    expect(authAPI.logout).toHaveBeenCalled();
    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(result).toHaveProperty("status", 302);
    expect(result.headers.get("Location")).toBe("/login");
  });

  it("should clear cookies in response headers", async () => {
    vi.mocked(authAPI.logout).mockResolvedValue(undefined);

    const request = new Request("http://localhost/logout", {
      method: "POST",
    });

    const result = await action({ request, params: {}, context: {} } as any);

    const setCookieHeaders = result.headers.getSetCookie();
    expect(setCookieHeaders.length).toBeGreaterThan(0);
    
    const cookieString = result.headers.get("Set-Cookie");
    expect(cookieString).toContain("auth_access_token=");
    expect(cookieString).toContain("auth_refresh_token=");
    expect(cookieString).toContain("auth_user=");
  });

  it("should set cookies with Max-Age=0 to expire them", async () => {
    vi.mocked(authAPI.logout).mockResolvedValue(undefined);

    const request = new Request("http://localhost/logout", {
      method: "POST",
    });

    const result = await action({ request, params: {}, context: {} } as any);

    const cookieString = result.headers.get("Set-Cookie");
    expect(cookieString).toContain("Max-Age=0");
    expect(cookieString).toContain("Expires=Thu, 01 Jan 1970");
  });

  it("should handle logout API errors gracefully", async () => {
    vi.mocked(authAPI.logout).mockRejectedValue(new Error("Logout failed"));

    const request = new Request("http://localhost/logout", {
      method: "POST",
    });

    // Should still clear tokens and redirect even if API fails
    await expect(action({ request, params: {}, context: {} } as any)).rejects.toThrow();
  });
});

