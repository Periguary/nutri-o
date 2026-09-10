import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { invokeLLM } from "./_core/llm";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
const mockedInvokeLLM = vi.mocked(invokeLLM);
const context = (): TrpcContext => ({ user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });

describe("diary.advise", () => {
  beforeEach(() => mockedInvokeLLM.mockReset());
  it("returns personalized tips, recipe and herbs from the model", async () => {
    mockedInvokeLLM.mockResolvedValue({ id: "diary-advice", created: Date.now(), model: "gemini-3-flash-preview", choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: JSON.stringify({ headline: "Observe o jantar", tips: ["Coma mais cedo"], recipe: "Creme de abóbora", herbs: ["Salsinha"], safety: "Procure orientação se persistir." }) } }] });
    const result = await appRouter.createCaller(context()).diary.advise({ summary: "2026-09-10 | Jantar | sopa | azia/refluxo | intensidade: 3/5" });
    expect(result.headline).toBe("Observe o jantar");
    expect(result.herbs).toContain("Salsinha");
    expect(mockedInvokeLLM).toHaveBeenCalledWith(expect.objectContaining({ model: "gemini-3-flash-preview", maxTokens: 1200 }));
  });
});
