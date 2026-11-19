import { describe, expect, it } from "vitest";
import { getRepairTime, getServiceSchedule, isTecRmiConfigured } from "./tecrmi";

describe("TecRMI (modo demonstração)", () => {
  it("não está configurado sem credenciais", () => {
    delete process.env.TECRMI_API_URL;
    expect(isTecRmiConfigured()).toBe(false);
  });

  it("devolve tempo de reparação de exemplo para travões", async () => {
    const result = await getRepairTime({ brand: "Seat", model: "Ibiza", year: 2018 }, "pastilhas de travão");
    expect(result.source).toBe("local");
    expect(result.data?.hours).toBeGreaterThan(0);
  });

  it("devolve plano de manutenção de exemplo", async () => {
    const result = await getServiceSchedule({ brand: "Seat", model: "Ibiza", year: 2018 }, 84500);
    expect(result.source).toBe("local");
    expect(result.data.length).toBeGreaterThan(0);
  });
});
