import { expect, afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Fix for React Router v7 Request/AbortSignal compatibility in Node.js
// Patch Request constructor to handle AbortSignal validation issues with undici
// In tests, we don't need abort functionality, so we remove the signal
if (typeof globalThis.Request !== "undefined") {
  const OriginalRequest = globalThis.Request;
  
  globalThis.Request = class Request extends OriginalRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      // Remove signal to avoid undici validation errors in test environment
      // Tests don't need abort functionality
      const { signal, ...safeInit } = init || {};
      super(input, safeInit);
    }
  } as typeof Request;
}

// Suppress React Router HydrateFallback warnings in tests
// This is expected when using createMemoryRouter in test environment
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("HydrateFallback")
    ) {
      return; // Suppress HydrateFallback warnings
    }
    originalError.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

