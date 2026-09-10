import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { invokeLLM } from "./_core/llm";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

const mockedInvokeLLM = vi.mocked(invokeLLM);

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("recipe.suggest", () => {
  beforeEach(() => {
    mockedInvokeLLM.mockReset();
  });

  it("converts a model JSON response into a recipe suggestion", async () => {
    mockedInvokeLLM.mockResolvedValue({
      id: "test-recipe",
      created: Date.now(),
      model: "gemini-3-flash-preview",
      choices: [{
        index: 0,
        finish_reason: "stop",
        message: {
          role: "assistant",
          content: JSON.stringify({
            title: "Panela de legumes",
            subtitle: "Uma ideia simples para aproveitar o que já existe em casa.",
            ingredients: ["arroz", "abóbora"],
            steps: ["Cozinhe tudo até ficar macio."],
            nutritionNote: "Combine vegetais com uma fonte de proteína.",
            safetyNote: "Confira o rótulo dos temperos industrializados.",
          }),
        },
      }],
    });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.recipe.suggest({
      ingredients: "arroz e abóbora",
      restriction: "Doença celíaca",
      phase: "Adulto",
    });

    expect(result.title).toBe("Panela de legumes");
    expect(result.ingredients).toContain("arroz");
    expect(mockedInvokeLLM).toHaveBeenCalledWith(expect.objectContaining({
      model: "gemini-3-flash-preview",
      maxTokens: 1800,
    }));
  });

  it("rejects empty ingredient lists before calling the model", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.recipe.suggest({
      ingredients: "",
      restriction: "Nenhuma",
      phase: "Adulto",
    })).rejects.toThrow();

    expect(mockedInvokeLLM).not.toHaveBeenCalled();
  });
});
