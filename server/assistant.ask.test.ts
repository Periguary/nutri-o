import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { invokeLLM } from "./_core/llm";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
const mockedInvokeLLM = vi.mocked(invokeLLM);
const context = (): TrpcContext => ({ user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });

describe("assistant.ask", () => {
  beforeEach(() => mockedInvokeLLM.mockReset());
  it("returns an educational answer from the model", async () => {
    mockedInvokeLLM.mockResolvedValue({ id: "assistant", created: Date.now(), model: "gemini-3-flash-preview", choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: "Use uma panela limpa, separe utensílios e leia os alergênicos do rótulo." } }] });
    const result = await appRouter.createCaller(context()).assistant.ask({ question: "Como evitar contaminação cruzada?", context: "doença celíaca" });
    expect(result.source).toBe("ia");
    expect(result.answer).toContain("panela limpa");
  });
  it("always returns a useful free fallback when the model fails", async () => {
    mockedInvokeLLM.mockResolvedValue({ id: "assistant-empty", created: Date.now(), model: "gemini-3-flash-preview", choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: "" } }] });
    const result = await appRouter.createCaller(context()).assistant.ask({ question: "O que posso fazer agora?", context: "refluxo" });
    expect(result.source).toBe("fallback");
    expect(result.answer).toContain("receita econômica");
  });
});
