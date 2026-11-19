import { describe, expect, it } from "vitest";
import { searchTecDocParts } from "./tecdoc";

describe("searchTecDocParts (catálogo local)", () => {
  it("encontra peças por descrição", async () => {
    const result = await searchTecDocParts("travão");
    expect(result.source).toBe("local");
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].description.toLowerCase()).toContain("travão");
  });

  it("encontra peças por código OE", async () => {
    const result = await searchTecDocParts("W712/94");
    expect(result.data[0]?.code).toBe("FILTRO-OLEO");
  });

  it("respeita o limite", async () => {
    const result = await searchTecDocParts("filtro", 1);
    expect(result.data).toHaveLength(1);
  });
});
