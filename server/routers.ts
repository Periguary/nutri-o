import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const recipeSchema = {
  name: "recipe_suggestion",
  strict: true,
  schema: {
    type: "object",
    properties: { title: { type: "string" }, subtitle: { type: "string" }, ingredients: { type: "array", items: { type: "string" } }, steps: { type: "array", items: { type: "string" } }, nutritionNote: { type: "string" }, safetyNote: { type: "string" } },
    required: ["title", "subtitle", "ingredients", "steps", "nutritionNote", "safetyNote"],
    additionalProperties: false,
  },
} as const;

const contentToText = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(part => (typeof part === "string" ? part : (part as { text?: string }).text ?? "")).join("\n");
  return "";
};
const parseJson = <T,>(raw: string): T => {
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("JSON not found");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
};

const assistantFallback = (question: string) => `Posso ajudar com uma orientação inicial sobre “${question}”. Para começar, prefira preparações simples, leia os rótulos completos, evite contaminação cruzada e anote como seu corpo reage. Se houver dor intensa, sangue, vômitos persistentes, perda de peso ou dificuldade para engolir, procure atendimento. Posso também sugerir uma receita econômica com os ingredientes que você tem em casa.`;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  recipe: router({
    suggest: publicProcedure.input(z.object({ ingredients: z.string().min(3).max(500), restriction: z.string().max(80).default("nenhuma restrição informada"), phase: z.string().max(40).default("adulto") })).mutation(async ({ input }) => {
      const response = await invokeLLM({ model: "gemini-3-flash-preview", maxTokens: 1800, messages: [
        { role: "system", content: "Você é o NutriApoio, um assistente educativo de alimentação inclusiva no Brasil. Crie receitas simples, econômicas e realistas usando prioritariamente os ingredientes disponíveis. Respeite a restrição informada. Nunca invente que um produto é seguro: alerte sobre rótulos, contato cruzado e atendimento profissional quando necessário. Não prescreva tratamento, quantidades clínicas ou suplementos. Responda somente com um objeto JSON válido, sem markdown e com as chaves title, subtitle, ingredients (array de strings), steps (array de strings), nutritionNote e safetyNote." },
        { role: "user", content: `Ingredientes disponíveis: ${input.ingredients}\nRestrição ou foco: ${input.restriction}\nFase da vida: ${input.phase}\nCrie uma sugestão de receita para o dia a dia.` },
      ] });
      const raw = contentToText(response.choices?.[0]?.message?.content); if (!raw) throw new Error("The recipe model returned an empty response");
      try { return parseJson(raw); } catch { throw new Error("Não foi possível organizar a sugestão de receita. Tente novamente."); }
    }),
  }),
  diary: router({
    advise: publicProcedure.input(z.object({ summary: z.string().min(10).max(6000) })).mutation(async ({ input }) => {
      const response = await invokeLLM({ model: "gemini-3-flash-preview", maxTokens: 1200, messages: [
        { role: "system", content: "Você é um orientador educativo do NutriApoio. Analise um resumo de diário alimentar brasileiro e devolva somente JSON válido. Seja acolhedor, não diagnostique, não prescreva remédios e sugira procurar profissional em sinais de alerta. Recomende uma receita simples, hábitos observáveis e ervas culinárias apenas como opções de sabor, sempre com ressalva de tolerância individual. Use português do Brasil." },
        { role: "user", content: `Resumo do diário:\n${input.summary}\nGere recomendações personalizadas e práticas.` },
      ], response_format: { type: "json_schema", json_schema: { name: "diary_advice", strict: true, schema: { type: "object", properties: { headline: { type: "string" }, tips: { type: "array", items: { type: "string" } }, recipe: { type: "string" }, herbs: { type: "array", items: { type: "string" } }, safety: { type: "string" } }, required: ["headline", "tips", "recipe", "herbs", "safety"], additionalProperties: false } } } });
      const raw = contentToText(response.choices?.[0]?.message?.content); if (!raw) throw new Error("The diary model returned an empty response");
      try { return parseJson<{ headline: string; tips: string[]; recipe: string; herbs: string[]; safety: string }>(raw); } catch { throw new Error("Não foi possível organizar as recomendações agora."); }
    }),
  }),
  assistant: router({
    ask: publicProcedure.input(z.object({ question: z.string().min(1).max(1200), context: z.string().max(1000).default("sem foco específico") })).mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({ model: "gemini-3-flash-preview", maxTokens: 1600, messages: [
          { role: "system", content: "Você é o Assistente NutriApoio, educativo, acolhedor e prático. Responda em português do Brasil. Ajude com alimentação inclusiva, substituições, receitas econômicas, manipulação segura, higiene, armazenamento, leitura de rótulos e organização de refeições. Nunca diagnostique, prescreva remédios, suplementos ou dietas clínicas; diferencie alergia de intolerância; destaque contaminação cruzada e sinais de alerta. Entregue sempre uma resposta útil com: resposta direta, passos práticos, uma ideia de receita quando fizer sentido e um lembrete de segurança. Se não souber algo, diga isso e ofereça um caminho seguro. Não use promessas milagrosas." },
          { role: "user", content: `Foco atual: ${input.context}\nPergunta: ${input.question}` },
        ] });
        const text = contentToText(response.choices?.[0]?.message?.content).trim();
        return { answer: text || assistantFallback(input.question), source: text ? "ia" : "fallback" };
      } catch {
        return { answer: assistantFallback(input.question), source: "fallback" };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
