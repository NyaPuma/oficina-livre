import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("bloqueia após atingir o limite", async () => {
    const key = `teste-${Date.now()}`;
    expect(await checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 2, 60_000)).toBe(false);
  });

  it("mantém chaves independentes", async () => {
    const suffix = Date.now();
    expect(await checkRateLimit(`a-${suffix}`, 1, 60_000)).toBe(true);
    expect(await checkRateLimit(`b-${suffix}`, 1, 60_000)).toBe(true);
  });
});
