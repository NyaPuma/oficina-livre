import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("bloqueia após atingir o limite", () => {
    const key = `teste-${Date.now()}`;
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(false);
  });

  it("mantém chaves independentes", () => {
    const suffix = Date.now();
    expect(checkRateLimit(`a-${suffix}`, 1, 60_000)).toBe(true);
    expect(checkRateLimit(`b-${suffix}`, 1, 60_000)).toBe(true);
  });
});
