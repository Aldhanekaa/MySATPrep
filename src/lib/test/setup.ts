/**
 * Jest Global Setup File
 *
 * Imported via jest.config.ts `setupFilesAfterFramework`.
 * - Extends Jest matchers with @testing-library/jest-dom
 * - Starts MSW server before all tests and resets/stops it appropriately
 */

import "@testing-library/jest-dom";
import { setupServer } from "msw/node";
import { handlers } from "./mswHandlers";

// Create the MSW server with default handlers
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

// Reset handlers after each test to avoid handler pollution
afterEach(() => {
  server.resetHandlers();
});

// Clean up and close server after all tests
afterAll(() => {
  server.close();
});
