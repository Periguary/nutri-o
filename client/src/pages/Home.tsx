import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { buildShoppingListDetails } from "@/lib/nutrition-utils";
import { Link } from "wouter";
import {
  AlertTriangle,
  Apple,
  ArrowUpRight,
  Baby,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CookingPot,
  FileText,
  Download,
  Filter,
  WandSparkles,
  Trash2,
  LoaderCircle,
  ShoppingBasket,
  CheckCheck,
  HeartPulse,
  Bookmark,
  Send,
  GlassWater,
  HeartHandshake,
  Leaf,
  Menu,
  MessageCircle,
  MoveRight,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  UserRound,
  Utensils,
  X,
} from "lucide-react";

type RestrictionKey =
  | "celiaca"
  | "lactose"
  | "aplv"
  | "fodmap"
  | "diabetes"
  | "veganismo";

type PhaseKey = "adulto" | "crianca" | "gestante";

type DigestiveFocus = "nenhum" | "refluxo" | "gastrite" | "intestino";

type FavoriteMeal = {
  id: string;
  meal: string;
  category: string;
  restriction: string;
  phase: string;
  createdAt: number;
};

const restrictions: { key: RestrictionKey; label: string; note: string; icon: typeof Leaf }[] = [
  { key: "celiaca", label: "Doença celíaca", note: "sem glúten", icon: Sprout },
  { key: "lactose", label: "Intolerância à lactose", note: "conforto digestivo", icon: GlassWater },
  { key: "aplv", label: "APLV", note: "sem leite de vaca", icon: HeartHandshake },
  { key: "fodmap", label: "Low FODMAP", note: "fases e sintomas", icon: Apple },
  { key: "diabetes", label: "Diabetes", note: "equilíbrio glicêmico", icon: CircleCheck },
  { key: "veganismo", label: "Veganismo", note: "escolhas éticas", icon: Leaf },
];

const assistantData: Record<RestrictionKey, {
  title: string;
  intro: string;
  avoid: string[];
  swaps: string[];
  menu: string;
  alert: string;
}> = {
  celiaca: {
    title: "Doença celíaca",
    intro: "Uma condição autoimune em que o glúten desencadeia uma resposta que pode lesionar o intestino. A exclusão precisa ser rigorosa e contínua.",
    avoid: ["trigo, centeio e cevada", "malte e extratos de malte", "produtos sem garantia de ausência de glúten"],
    swaps: ["quinoa, amaranto e milho", "aveia certificada sem glúten", "farinhas de arroz e mandioca"],
    menu: "Tapioca com ovo e fruta · arroz, feijão, peixe e salada · fruta com castanhas · sopa de legumes com quinoa",
    alert: "Use utensílios, torradeira e superfícies exclusivas ou muito bem higienizadas. Migalhas também contam.",
  },
  lactose: {
    title: "Intolerância à lactose",
    intro: "A digestão reduzida da lactose pode causar desconforto. A tolerância varia de pessoa para pessoa e deve ser investigada individualmente.",
    avoid: ["leite comum em grandes porções", "sorvetes e cremes à base de leite", "ingredientes como soro de leite e leite em pó"],
    swaps: ["leites e iogurtes sem lactose", "bebidas vegetais fortificadas com cálcio", "queijos maturados, quando tolerados"],
    menu: "Pão de fermentação natural com ovo · bowl de arroz, frango e legumes · banana com pasta de amendoim · omelete com folhas",
    alert: "Leia o rótulo mesmo em produtos conhecidos. A quantidade e a combinação da refeição podem mudar a tolerância.",
  },
  aplv: {
    title: "Alergia à proteína do leite",
    intro: "É uma reação do sistema imunológico às proteínas do leite. Em crianças, a orientação deve ser sempre individualizada com pediatra e nutricionista.",
    avoid: ["leite e derivados", "caseína, caseinato e soro de leite", "produtos com aviso de pode conter leite"],
    swaps: ["preparações com vegetais, leguminosas e ovos", "bebidas vegetais adequadas à idade", "pastas de grão-de-bico e castanhas"],
    menu: "Cuscuz de milho com ovo · feijão, arroz e carne desfiada · fruta com pasta de castanha · purê de mandioquinha com frango",
    alert: "Nunca confie apenas na ausência da palavra 'leite'. Procure derivados e alertas de alergênicos no rótulo.",
  },
  fodmap: {
    title: "Dieta Low FODMAP",
    intro: "É uma estratégia temporária para investigar sintomas gastrointestinais, com fases de redução, reintrodução e personalização profissional.",
    avoid: ["alimentos definidos pelo protocolo e pela fase", "porções grandes de certos carboidratos fermentáveis", "regras rígidas sem acompanhamento"],
    swaps: ["arroz, batata, aveia e quinoa", "frutas em porções individualizadas", "ervas, azeite e especiarias para sabor"],
    menu: "Mingau de aveia com morangos · frango, arroz e cenoura · kiwi com sementes · peixe com batata e abobrinha",
    alert: "A dieta não é para sempre. O objetivo é descobrir tolerâncias, não ampliar restrições sem necessidade.",
  },
  diabetes: {
    title: "Diabetes",
    intro: "Uma alimentação organizada ajuda no controle da glicemia, sempre junto do tratamento e das orientações da equipe de saúde.",
    avoid: ["bebidas açucaradas no dia a dia", "porções frequentes de ultraprocessados", "pular refeições sem orientação"],
    swaps: ["frutas inteiras em vez de sucos", "feijão, grãos e vegetais", "castanhas e sementes em pequenas porções"],
    menu: "Ovos, fruta e aveia · arroz integral, feijão e metade do prato de salada · iogurte sem açúcar · sopa de legumes com frango",
    alert: "Medicamentos e necessidades variam. Ajustes de alimentação devem conversar com a prescrição do seu profissional.",
  },
  veganismo: {
    title: "Veganismo",
    intro: "Uma escolha ética que exclui ingredientes de origem animal. Com planejamento, pode ser variada, saborosa e nutricionalmente adequada.",
    avoid: ["carnes, peixes e frutos do mar", "leite, ovos e derivados", "caldos, molhos e gelatinas de origem animal"],
    swaps: ["feijões, lentilhas, grão-de-bico e tofu", "bebidas vegetais fortificadas", "castanhas, sementes e tahine"],
    menu: "Pão integral com homus · arroz, feijão, tofu e couve · fruta com sementes · curry de grão-de-bico e legumes",
    alert: "A vitamina B12 exige atenção específica. Converse com um nutricionista sobre suplementação e exames.",
  },
};

const digestiveGuidance: Record<DigestiveFocus, { label: string; title: string; text: string; tips: string[] }> = {
  nenhum: { label: "Sem foco específico", title: "Cuidados que cabem na sua rotina", text: "Observe como seu corpo responde, faça refeições com calma e procure ajuda se os sintomas persistirem.", tips: ["Coma devagar e mastigue bem", "Prefira preparações simples quando estiver sensível", "Anote alimentos e sintomas para conversar com um profissional"] },
  refluxo: { label: "Refluxo", title: "Menos desconforto, mais conforto", text: "Para muitas pessoas, refeições menores e evitar deitar logo após comer ajudam. Os gatilhos variam: observe seu padrão sem cortar grupos por conta própria.", tips: ["Evite deitar por 2 a 3 horas após comer", "Teste reduzir café, álcool, frituras, menta e pimenta se forem gatilhos", "Eleve a cabeceira com orientação e procure avaliação se houver dor ou dificuldade para engolir"] },
  gastrite: { label: "Gastrite", title: "Comer com gentileza", text: "Priorize refeições regulares e preparações menos irritantes durante fases de desconforto. Gastrite merece investigação e acompanhamento, especialmente com dor persistente.", tips: ["Evite longos períodos em jejum se isso piorar os sintomas", "Prefira cozidos, assados e temperos suaves quando estiver em crise", "Não use anti-inflamatórios ou faça restrições sem falar com um profissional"] },
  intestino: { label: "Intestino sensível", title: "Ritmo, variedade e observação", text: "Sintomas intestinais são individuais. Uma rotina previsível, hidratação e diário de sintomas podem ajudar a encontrar padrões sem dietas radicais.", tips: ["Aumente fibras aos poucos e beba água", "Observe porções e combinações, não apenas um alimento isolado", "Procure nutricionista antes de iniciar dietas de exclusão"] },
};

const phases: { key: PhaseKey; label: string; icon: typeof UserRound }[] = [
  { key: "adulto", label: "Adulto", icon: UserRound },
  { key: "crianca", label: "Criança", icon: Baby },
  { key: "gestante", label: "Gestante", icon: HeartHandshake },
];

const knowledgeCards = [
  {
    eyebrow: "01 · Para começar",
    title: "Alergia não é a mesma coisa que intolerância",
    body: "Alergias envolvem o sistema imunológico. Intolerâncias costumam estar ligadas à digestão ou ao metabolismo. Entender essa diferença muda os cuidados e evita restrições desnecessárias.",
    color: "sage",
  },
  {
    eyebrow: "02 · Informação",
    title: "Doença celíaca pede atenção ao detalhe",
    body: "É uma condição autoimune. Para quem tem diagnóstico, o cuidado com o glúten inclui ingredientes, utensílios e o modo como a comida é preparada.",
    color: "sand",
  },
  {
    eyebrow: "03 · Com acolhimento",
    title: "Comer melhor não precisa ser perfeito",
    body: "A ideia é construir repertório e autonomia: mais comida de verdade, escolhas possíveis para a sua rotina e apoio profissional quando necessário.",
    color: "terracotta",
  },
];

const guideCards = [
  {
    icon: Search,
    tag: "Rotulagem",
    title: "Como ler um rótulo em 90 segundos",
    desc: "Um passo a passo visual para encontrar alergênicos, ingredientes ocultos e avisos de contaminação.",
    time: "4 min de leitura",
  },
  {
    icon: ShieldCheck,
    tag: "Segurança",
    title: "Cozinha sem contaminação cruzada",
    desc: "Superfícies, utensílios, armazenamento e os pequenos cuidados que protegem a sua refeição.",
    time: "6 min de leitura",
  },
  {
    icon: CalendarDays,
    tag: "Rotina",
    title: "Montando um dia de refeições",
    desc: "Ideias flexíveis baseadas em alimentos in natura e minimamente processados, sem terrorismo alimentar.",
    time: "5 min de leitura",
  },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {

  const [mobileOpen, setMobileOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [availableIngredients, setAvailableIngredients] = useState("");
  const [digestiveFocus, setDigestiveFocus] = useState<DigestiveFocus>("nenhum");
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [favoriteFilter, setFavoriteFilter] = useState("todas");
  const [favorites, setFavorites] = useState<FavoriteMeal[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nutriapoio-favorites") || "[]") as Array<FavoriteMeal | string>;
      return saved.map((item) => typeof item === "string" ? { id: item, meal: item, category: "Outras", restriction: "", phase: "", createdAt: Date.now() } : item);
    } catch { return []; }
  });
  const [selectedRestriction, setSelectedRestriction] = useState<RestrictionKey>("celiaca");
  const [selectedPhase, setSelectedPhase] = useState<PhaseKey>("adulto");
  const [isGenerated, setIsGenerated] = useState(false);
  const recipeMutation = trpc.recipe.suggest.useMutation();
  const assistantMutation = trpc.assistant.ask.useMutation({ onSuccess: (data) => setAssistantAnswer(data.answer) });

  const result = useMemo(() => assistantData[selectedRestriction], [selectedRestriction]);

  const askAssistant = (prompt = question) => {
    const normalized = prompt.toLowerCase();
    let answer = "Posso ajudar com substituições, rótulos, contaminação cruzada e ideias de preparo. Tente perguntar, por exemplo: 'o que usar no lugar do leite?'";
    if (normalized.includes("leite") || normalized.includes("lactose")) answer = "Para intolerância à lactose, experimente leite e iogurte zero lactose ou bebidas vegetais fortificadas com cálcio. Para APLV, zero lactose não é seguro: procure alternativas sem proteína do leite e orientação profissional.";
    else if (normalized.includes("trigo") || normalized.includes("glúten") || normalized.includes("gluten")) answer = "Boas trocas são arroz, milho, mandioca, batata, quinoa, amaranto e farinhas de arroz ou grão-de-bico. Para doença celíaca, confira a declaração de alergênicos e a certificação sem glúten.";
    else if (normalized.includes("ovo")) answer = "Em bolos, uma substituição possível é usar banana amassada ou linhaça hidratada, mas o resultado varia por receita. Em alergias, observe também avisos de 'pode conter'.";
    else if (normalized.includes("receita") || normalized.includes("jantar") || normalized.includes("almoço")) answer = `Para ${result.title.toLowerCase()}, uma ideia simples é: ${result.menu}. Adapte porções e ingredientes à sua orientação individual.`;
    setAssistantAnswer("Estou preparando uma resposta completa com receita, dicas práticas e cuidados de segurança...");
    assistantMutation.mutate({ question: prompt.trim() || "Como posso me alimentar melhor hoje?", context: `${result.title} · ${digestiveGuidance[digestiveFocus].label}` }, { onError: () => setAssistantAnswer(answer) });
  };

  const currentRestrictionLabel = restrictions.find((item: { key: RestrictionKey; label: string }) => item.key === selectedRestriction)?.label ?? "Outras";
  const digestive = digestiveGuidance[digestiveFocus];
  const quickSuggestions = [
    { label: "Opções sem glúten", question: "Quais são opções sem glúten para um almoço simples?" },
    { label: "Lanches rápidos", question: "Quais lanches rápidos posso preparar?" },
    { label: "Refluxo: o que observar", question: "O que posso observar na alimentação quando tenho refluxo?" },
    { label: "Trocar o leite", question: "O que usar no lugar do leite?" },
  ];
  const shoppingItems = buildShoppingListDetails(favorites);
  const currentPhaseLabel = phases.find((phase) => phase.key === selectedPhase)?.label ?? "Adulto";
  const currentFavoriteId = `${selectedRestriction}-${selectedPhase}-${result.menu}`;
  const isCurrentFavorite = favorites.some((item) => item.id === currentFavoriteId);
  const favoriteCategories = ["todas", ...Array.from(new Set(favorites.map((item) => item.category)))];
  const visibleFavorites = favorites.filter((item) => favoriteFilter === "todas" || item.category === favoriteFilter);

  const toggleFavorite = () => {
    setIsSaving(true);
    const next = isCurrentFavorite
      ? favorites.filter((item) => item.id !== currentFavoriteId)
      : [...favorites, { id: currentFavoriteId, meal: result.menu, category: currentRestrictionLabel, restriction: result.title, phase: currentPhaseLabel, createdAt: Date.now() }];
    setFavorites(next);
    localStorage.setItem("nutriapoio-favorites", JSON.stringify(next));
    window.setTimeout(() => setIsSaving(false), 420);
    toast.success(isCurrentFavorite ? "Refeição removida dos favoritos" : "Refeição salva nos favoritos", { description: isCurrentFavorite ? "Seu repertório foi atualizado." : "Você pode encontrá-la na sua coleção." });
  };

  const removeFavorite = (id: string) => {
    const next = favorites.filter((item) => item.id !== id);
    setFavorites(next);
    localStorage.setItem("nutriapoio-favorites", JSON.stringify(next));
  };

  const generateDynamicRecipe = () => {
    if (availableIngredients.trim().length < 3) return;
    recipeMutation.mutate({ ingredients: availableIngredients, restriction: result.title, phase: currentPhaseLabel });
  };

  const saveGeneratedRecipe = () => {
    const recipe = recipeMutation.data;
    if (!recipe) return;
    const saved = JSON.parse(localStorage.getItem("nutriapoio-favorites") || "[]") as FavoriteMeal[];
    const next = [...saved, { id: `ai-${Date.now()}`, meal: `${recipe.title}: ${recipe.ingredients.join(", ")}`, category: currentRestrictionLabel, restriction: result.title, phase: currentPhaseLabel, createdAt: Date.now() }];
    localStorage.setItem("nutriapoio-favorites", JSON.stringify(next));
    setFavorites(next);
    setSaveFeedback("Receita salva nos favoritos"); window.setTimeout(() => setSaveFeedback(""), 2600); toast.success("Receita salva nos favoritos", { description: "Ela já está no seu repertório." });
  };

  const saveGeneratedRecipeToDiary = () => {
    const recipe = recipeMutation.data;
    if (!recipe) return;
    const saved = JSON.parse(localStorage.getItem("nutriapoio-diary") || "[]") as Array<Record<string, string>>;
    const next = [{ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), meal: recipe.title, time: "A planejar", symptom: "Sem sintomas", intensity: "1", notes: `Receita sugerida pela IA: ${recipe.ingredients.join(", ")}` }, ...saved];
    localStorage.setItem("nutriapoio-diary", JSON.stringify(next));
    setSaveFeedback("Receita enviada ao diário"); window.setTimeout(() => setSaveFeedback(""), 2600); toast.success("Receita enviada ao diário", { description: "Você pode complementar o registro na página Diário." });
  };

  const exportMenu = () => {
    setIsExporting(true);
    const recipe = recipeMutation.data;
    const printWindow = window.open("", "_blank", "width=860,height=900");
    if (!printWindow) { setIsExporting(false); toast.error("Permita a abertura da janela para exportar o PDF."); return; }
    toast.success("Cardápio pronto para exportar", { description: "Na janela aberta, escolha 'Salvar como PDF'." });
    window.setTimeout(() => setIsExporting(false), 900);
    const safe = (value: string) => value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char] ?? char));
    const recipeBlock = recipe ? `<section class="recipe"><div class="eyebrow">Receita criada com seus ingredientes</div><h2>${safe(recipe.title)}</h2><p>${safe(recipe.subtitle)}</p><div class="columns"><div><h3>Ingredientes</h3><ul>${recipe.ingredients.map((item: string) => `<li>${safe(item)}</li>`).join("")}</ul></div><div><h3>Preparo</h3><ol>${recipe.steps.map((item: string) => `<li>${safe(item)}</li>`).join("")}</ol></div></div><p class="note"><strong>Nota nutricional:</strong> ${safe(recipe.nutritionNote)}</p><p class="warning"><strong>Segurança:</strong> ${safe(recipe.safetyNote)}</p></section>` : "";
    printWindow.document.write(`<html><head><title>Cardápio NutriApoio · ${safe(result.title)}</title><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#f7f3eb;color:#203226;font-family:Arial,sans-serif;line-height:1.55}.page{padding:48px;min-height:100vh}.top{background:#203226;color:#f7f3eb;padding:30px 34px;border-radius:22px}.mark{font-weight:bold;letter-spacing:.12em;text-transform:uppercase;color:#e7a47d;font-size:11px}.top h1{font-family:Georgia,serif;font-size:36px;line-height:1.02;margin:16px 0 10px}.meta{font-size:12px;color:#c9d8c8}.section{margin-top:26px;background:#e9f0e8;border-radius:18px;padding:24px}.eyebrow{font-size:10px;font-weight:bold;letter-spacing:.14em;text-transform:uppercase;color:#b9684d}.section h2,.recipe h2{font-family:Georgia,serif;color:#31583e;font-size:24px;margin:8px 0 14px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:28px}.columns h3{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#b9684d}.columns li{margin-bottom:8px}.recipe{margin-top:26px;border:1px solid #d6e2d4;border-radius:18px;padding:24px;background:#fbfaf6}.note{background:#e7a47d;border-radius:12px;padding:12px;font-size:12px}.warning{background:#fff4e9;border-radius:12px;padding:12px;font-size:12px;color:#754c3c}.footer{margin-top:30px;font-size:11px;color:#718074;border-top:1px solid #dedbd2;padding-top:14px}@media print{.page{padding:28px}}</style></head><body><div class="page"><div class="top"><div class="mark">NutriApoio · ponto de partida</div><h1>Comer bem, do seu jeito.</h1><div class="meta">Foco: ${safe(result.title)} · Fase: ${safe(currentPhaseLabel)}</div></div><section class="section"><div class="eyebrow">Ideia de um dia</div><h2>Seu cardápio-base</h2><p>${safe(result.menu)}</p></section><section class="section"><div class="eyebrow">Trocas inteligentes</div><h2>Substituições para experimentar</h2><div class="columns"><div><h3>Evite ou confira</h3><ul>${result.avoid.map((item) => `<li>${safe(item)}</li>`).join("")}</ul></div><div><h3>Prefira ou experimente</h3><ul>${result.swaps.map((item) => `<li>${safe(item)}</li>`).join("")}</ul></div></div></section>${recipeBlock}<div class="footer">Material educativo e informativo. Não substitui consulta individualizada com nutricionista ou médico.</div></div><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
    printWindow.document.close();
  };

  const exportShoppingList = () => {
    if (shoppingItems.length === 0) { toast.info("Salve algumas refeições primeiro", { description: "A lista semanal é montada a partir dos favoritos." }); return; }
    const printWindow = window.open("", "_blank", "width=700,height=800");
    if (!printWindow) { toast.error("Permita a abertura da janela para exportar a lista."); return; }
    const items = shoppingItems.map((item) => `<li><span>□</span><strong>${item.category}</strong> · ${item.name} — ${item.quantity}</li>`).join("");
    printWindow.document.write(`<html><head><title>Lista de compras · NutriApoio</title><style>body{font-family:Arial,sans-serif;background:#f7f3eb;color:#203226;padding:42px}header{background:#203226;color:#f7f3eb;border-radius:20px;padding:28px}h1{font-family:Georgia,serif;font-size:32px;margin:10px 0}.eyebrow{color:#e7a47d;font-size:11px;letter-spacing:.15em;text-transform:uppercase;font-weight:bold}section{background:#e9f0e8;border-radius:18px;padding:24px;margin-top:24px}li{list-style:none;padding:11px 0;border-bottom:1px solid #d6e2d4;font-size:16px}li span{color:#b9684d;font-size:22px;margin-right:12px}.note{color:#718074;font-size:12px;margin-top:28px}</style></head><body><header><div class="eyebrow">NutriApoio · planejamento leve</div><h1>Minha lista de compras</h1><p>Baseada nas refeições salvas nesta semana.</p></header><section><ul>${items}</ul></section><p class="note">Confira rótulos e adapte a lista às suas necessidades. Material educativo, não substitui orientação individual.</p><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
    printWindow.document.close();
    toast.success("Lista de compras preparada", { description: "Sua lista semanal foi aberta em uma nova janela." });
  };

  const openAssistant = () => {
    setMobileOpen(false);
    scrollToSection("assistente");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f3eb] text-[#203226]">
      {saveFeedback && <div role="status" className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 animate-soft-pop items-center gap-3 rounded-full border border-[#b9d1bb] bg-[#fbfaf6] px-5 py-3 text-sm font-bold text-[#31583e] shadow-[0_16px_45px_rgba(32,50,38,.18)]"><span className="grid size-7 place-items-center rounded-full bg-[#dcebdd] text-[#477354]">✓</span>{saveFeedback}</div>}
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between rounded-full border border-white/50 bg-[#f7f3eb]/90 px-4 py-3 shadow-[0_14px_50px_rgba(32,50,38,0.1)] backdrop-blur-xl sm:px-6">
          <a href="#inicio" className="group flex items-center gap-3" aria-label="NutriApoio, voltar ao início">
            <span className="grid size-9 place-items-center rounded-full bg-[#254a38] text-[#f5e7ce] shadow-sm transition-transform duration-200 group-hover:rotate-[-8deg]">
              <Sprout className="size-[18px]" strokeWidth={2.2} />
            </span>
            <span className="font-display text-[1.25rem] font-semibold tracking-[-0.04em] text-[#203226]">Nutri<span className="text-[#b9684d]">Apoio</span></span>
          </a>

          <nav className="hidden items-center gap-7 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#5b6e60] lg:flex" aria-label="Navegação principal">
            <a className="transition-colors hover:text-[#b9684d]" href="#inicio">Início</a>
            <a className="transition-colors hover:text-[#b9684d]" href="#assistente">Assistente</a>
            <a className="transition-colors hover:text-[#b9684d]" href="#entenda">Entenda</a>
            <a className="transition-colors hover:text-[#b9684d]" href="#guias">Guias práticos</a>
            <Link className="transition-colors hover:text-[#b9684d]" href="/receitas">Receitas</Link>
            <Link className="transition-colors hover:text-[#b9684d]" href="/diario">Diário</Link>
            <Link className="transition-colors hover:text-[#b9684d]" href="/videos">Vídeos</Link>
            <Link className="transition-colors hover:text-[#b9684d]" href="/compras">Compras</Link>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={openAssistant} className="hidden items-center gap-2 rounded-full bg-[#b9684d] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(185,104,77,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#a95b41] active:scale-[0.97] sm:flex">
              <MessageCircle className="size-4" />
              <span>Falar com o assistente</span>
            </button>
            <button onClick={() => setMobileOpen((open) => !open)} className="grid size-10 place-items-center rounded-full bg-[#e7eee6] text-[#254a38] lg:hidden" aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}>
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="mx-auto mt-2 max-w-[1240px] rounded-[1.5rem] border border-[#dce5dc] bg-[#fbfaf6] p-4 shadow-xl lg:hidden">
            <nav className="grid gap-1 text-sm font-semibold text-[#385142]" aria-label="Navegação móvel">
              {[['Início', 'inicio'], ['Assistente', 'assistente'], ['Entenda', 'entenda'], ['Guias práticos', 'guias']].map(([label, id]) => (
                <a key={id} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 transition-colors hover:bg-[#edf3ed]" href={`#${id}`}>{label}</a>
              ))}
              <Link onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 transition-colors hover:bg-[#edf3ed]" href="/receitas">Receitas para refluxo e gastrite</Link>
              <Link onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 transition-colors hover:bg-[#edf3ed]" href="/diario">Diário alimentar</Link>
              <Link onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 transition-colors hover:bg-[#edf3ed]" href="/videos">Vídeos por condição</Link>
              <Link onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 transition-colors hover:bg-[#edf3ed]" href="/compras">Lista de compras</Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section id="inicio" className="relative px-4 pb-8 pt-28 sm:px-6 lg:px-8 lg:pt-32">
          <div className="hero-shell relative mx-auto flex min-h-[650px] max-w-[1400px] items-end overflow-hidden rounded-[2rem] bg-[#213827] shadow-[0_28px_80px_rgba(42,61,45,0.22)] sm:min-h-[700px] lg:rounded-[2.5rem]">
            <img src="/manus-storage/nutriapoio-hero_62842fa8.jpg" alt="Tigela com quinoa, grão-de-bico, abacate e folhas frescas" className="absolute inset-0 size-full object-cover object-center" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,46,32,0.98)_0%,rgba(26,46,32,0.82)_30%,rgba(26,46,32,0.15)_68%,rgba(26,46,32,0.12)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(26,46,32,0.68)_0%,transparent_45%)]" />
            <div className="grain pointer-events-none absolute inset-0 opacity-20" />

            <div className="relative z-10 grid w-full gap-12 px-6 pb-8 pt-12 sm:px-10 sm:pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(260px,380px)] lg:items-end lg:px-16 lg:pb-16">
              <div className="max-w-[650px]">
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#d8e4d8] backdrop-blur-sm">
                  <Sparkles className="size-3.5 text-[#e7b48a]" />
                  informação que acolhe
                </div>
                <h1 className="font-display text-[clamp(3.35rem,7vw,6.7rem)] font-medium leading-[0.92] tracking-[-0.065em] text-[#f8f3e8]">
                  Comer bem,
                  <span className="block italic text-[#edb68e]">do seu jeito.</span>
                </h1>
                <p className="mt-7 max-w-[500px] text-[1.02rem] leading-7 text-[#d3dfd3] sm:text-[1.1rem]">
                  Um lugar seguro para entender restrições alimentares, encontrar substituições e construir uma rotina mais leve — sem culpa e sem complicação.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button onClick={openAssistant} className="group inline-flex items-center gap-3 rounded-full bg-[#e6a37b] px-5 py-3.5 text-sm font-bold text-[#2b3d2d] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f2b58b] active:scale-[0.97]">
                    Encontrar meu caminho
                    <span className="grid size-6 place-items-center rounded-full bg-[#2f513c] text-[#f8f3e8] transition-transform duration-200 group-hover:translate-x-0.5"><ArrowUpRight className="size-3.5" /></span>
                  </button>
                  <a href="#entenda" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-white/10">Explorar guias <ChevronRight className="size-4" /></a>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="rounded-[1.75rem] border border-white/20 bg-[#f6efe4]/90 p-5 text-[#294032] shadow-2xl backdrop-blur-md">
                  <div className="flex items-start justify-between gap-5">
                    <span className="grid size-11 place-items-center rounded-2xl bg-[#d9e8d9] text-[#31583e]"><HeartHandshake className="size-5" /></span>
                    <span className="rounded-full bg-[#e3efe1] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#4a7557]">feito para você</span>
                  </div>
                  <p className="mt-6 font-display text-[1.55rem] font-semibold leading-tight tracking-[-0.04em]">Pequenas escolhas também são cuidado.</p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#647668]"><CircleCheck className="size-4 text-[#b9684d]" /> conteúdo educativo e inclusivo</div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-5 right-6 hidden items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/70 sm:flex lg:right-16">
              <span className="h-px w-10 bg-white/40" />
              comida de verdade · autonomia · acolhimento
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-[1120px]">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.6fr] lg:items-end">
              <div>
                <p className="section-kicker">Uma trilha simples</p>
                <h2 className="section-title mt-4 max-w-[420px]">Mais clareza para fazer escolhas possíveis.</h2>
              </div>
              <p className="max-w-[520px] justify-self-end text-base leading-7 text-[#637267]">Você não precisa saber tudo de uma vez. O NutriApoio organiza informação confiável em caminhos curtos, para ajudar no próximo passo.</p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                { number: "01", icon: BookOpen, title: "Entender", body: "Descubra o que muda entre alergia, intolerância e condição autoimune." },
                { number: "02", icon: Utensils, title: "Escolher", body: "Encontre substitutos saborosos e ideias de refeições para sua rotina." },
                { number: "03", icon: ShieldCheck, title: "Cuidar", body: "Aprenda a ler rótulos e reduzir riscos de contaminação cruzada." },
              ].map((item) => (
                <article key={item.number} className="group rounded-[1.75rem] border border-[#e4e0d7] bg-[#fbfaf6] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#c7d6c8] hover:shadow-[0_18px_42px_rgba(57,76,58,0.1)]">
                  <div className="flex items-start justify-between"><span className="text-[0.72rem] font-bold tracking-[0.15em] text-[#b9684d]">{item.number}</span><span className="grid size-10 place-items-center rounded-full bg-[#e8f0e7] text-[#467254] transition-transform duration-300 group-hover:rotate-[-8deg]"><item.icon className="size-[18px]" /></span></div>
                  <h3 className="mt-10 font-display text-[1.7rem] font-semibold tracking-[-0.05em]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#6a786d]">{item.body}</p>
                  <a href="#assistente" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#456a50]">começar <MoveRight className="size-4 transition-transform group-hover:translate-x-1" /></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="assistente" className="scroll-mt-28 bg-[#e9f0e8] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-[1120px]">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="section-kicker text-[#557c60]">Seu ponto de partida</p>
                <h2 className="section-title mt-4 max-w-[600px]">Assistente de escolhas<br className="hidden sm:block" /> <span className="italic text-[#b9684d]">mais conscientes.</span></h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#5e7664]"><span className="grid size-7 place-items-center rounded-full bg-white text-[#4f7b5b]"><Sparkles className="size-3.5" /></span> resposta educativa, feita para orientar</div>
            </div>

            <div className="mt-10 grid overflow-hidden rounded-[2rem] border border-[#cfddd0] bg-[#fbfaf6] shadow-[0_20px_60px_rgba(55,82,60,0.1)] lg:grid-cols-[0.95fr_1.05fr]">
              <div className="border-b border-[#e0e7df] p-6 sm:p-9 lg:border-b-0 lg:border-r">
                <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#254a38] text-[#f8f3e8] text-sm font-bold">01</span><div><p className="text-sm font-bold text-[#2e4936]">Monte seu contexto</p><p className="text-xs text-[#7a877b]">leva menos de um minuto</p></div></div>
                <div className="mt-9"><label className="text-[0.67rem] font-bold uppercase tracking-[0.16em] text-[#718074]">Qual é o seu foco hoje?</label><div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {restrictions.map((item) => {
                    const active = selectedRestriction === item.key;
                    return <button key={item.key} onClick={() => { setSelectedRestriction(item.key); setIsGenerated(false); }} className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 ${active ? "border-[#5d8b68] bg-[#e5f0e3] text-[#31583e] shadow-[inset_0_0_0_1px_rgba(93,139,104,0.15)]" : "border-[#e1e7df] bg-white text-[#718074] hover:border-[#b8cfbb] hover:bg-[#f7fbf6]"}`}><span className={`grid size-8 place-items-center rounded-xl ${active ? "bg-[#c9dfca] text-[#376447]" : "bg-[#f1f4ef] text-[#859287]"}`}><item.icon className="size-4" /></span><span><span className="block text-[0.77rem] font-bold leading-tight">{item.label}</span><span className="mt-0.5 block text-[0.65rem] text-[#839085]">{item.note}</span></span>{active && <Check className="ml-auto size-4" />}</button>;
                  })}
                </div></div>
                <div className="mt-8"><label className="text-[0.67rem] font-bold uppercase tracking-[0.16em] text-[#718074]">Para quem estamos pensando?</label><div className="mt-3 flex flex-wrap gap-2">
                  {phases.map((phase) => { const active = selectedPhase === phase.key; return <button key={phase.key} onClick={() => setSelectedPhase(phase.key)} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-xs font-bold transition-colors ${active ? "border-[#5d8b68] bg-[#31583e] text-white" : "border-[#e1e7df] bg-white text-[#718074] hover:border-[#b8cfbb]"}`}><phase.icon className="size-3.5" />{phase.label}</button>; })}
                </div></div>
                  <button onClick={() => { setIsGenerated(true); toast.success("Orientação atualizada", { description: "Seu ponto de partida foi personalizado." }); }} className="animate-soft-pulse mt-9 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#b9684d] px-5 py-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(185,104,77,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#a95b41] active:scale-[0.98]"><Sparkles className="size-4" />{isGenerated ? "Atualizar orientação" : "Gerar meu ponto de partida"}<ArrowUpRight className="size-4" /></button>
                <p className="mt-4 text-center text-[0.66rem] leading-5 text-[#89958a]">Não substitui diagnóstico ou acompanhamento profissional.</p>
              </div>

              <div className="relative overflow-hidden bg-[#254a38] p-6 text-[#f7f3eb] sm:p-9">
                <div className="absolute -right-24 -top-24 size-64 rounded-full border border-white/10" /><div className="absolute -right-10 -top-10 size-36 rounded-full border border-white/10" />
                <div className="relative">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[0.67rem] font-bold uppercase tracking-[0.16em] text-[#b9d1bb]"><span className={`size-2 rounded-full ${isGenerated ? "bg-[#edb68e]" : "bg-[#a9c7aa]"}`} />{isGenerated ? "sua orientação está pronta" : "exemplo de orientação"}</div><span className="rounded-full bg-white/10 px-3 py-1 text-[0.65rem] font-semibold text-[#d4e3d4]">{phases.find((phase) => phase.key === selectedPhase)?.label}</span></div>
                  <h3 className="mt-8 font-display text-[2.1rem] font-semibold leading-tight tracking-[-0.05em] text-[#fbf7ed]">{result.title}</h3>
                  <p className="mt-4 max-w-[460px] text-sm leading-6 text-[#c8d9c8]">{result.intro}</p>
                  <div className="mt-8 grid gap-5 sm:grid-cols-2"><div><p className="flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#e7b48a]"><CircleAlert className="size-3.5" /> atenção a</p><ul className="mt-3 space-y-2 text-sm text-[#e1ebe0]">{result.avoid.map((item: string) => <li key={item} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#e7b48a]" />{item}</li>)}</ul></div><div><p className="flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#b9d1bb]"><CircleCheck className="size-3.5" /> experimente</p><ul className="mt-3 space-y-2 text-sm text-[#e1ebe0]">{result.swaps.map((item: string) => <li key={item} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#a9c7aa]" />{item}</li>)}</ul></div></div>
                  <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.07] p-4"><div className="flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#b9d1bb]"><Utensils className="size-3.5" /> ideia de um dia</div><p className="mt-2 text-sm leading-6 text-[#e8efe7]">{result.menu}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={toggleFavorite} disabled={isSaving} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-[#e8efe7] transition-all hover:bg-white/15 disabled:opacity-70">{isSaving ? <LoaderCircle className="size-3.5 animate-spin" /> : <Bookmark className={`size-3.5 ${isCurrentFavorite ? "fill-[#e7b48a] text-[#e7b48a]" : ""}`} />} {isCurrentFavorite ? "Salvo nos favoritos" : "Salvar refeição"}</button><button onClick={exportMenu} disabled={isExporting} className="inline-flex items-center gap-2 rounded-full bg-[#e7b48a] px-3 py-2 text-xs font-bold text-[#2d3e2e] transition-all hover:bg-[#f2b58b] disabled:opacity-70">{isExporting ? <LoaderCircle className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}{isExporting ? "Preparando..." : "Exportar PDF"}</button></div></div>
                  <div className="mt-5 rounded-2xl border border-[#b9d1bb]/20 bg-[#31583e]/40 p-4"><p className="flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#e7b48a]"><HeartPulse className="size-3.5" /> conforto digestivo</p><p className="mt-2 text-xs leading-5 text-[#d8e6d8]">Selecione um foco para receber lembretes gerais, sem dietas radicais.</p><div className="mt-3 flex flex-wrap gap-2">{(Object.keys(digestiveGuidance) as DigestiveFocus[]).map((focus) => <button key={focus} onClick={() => setDigestiveFocus(focus)} className={`rounded-full px-3 py-2 text-xs font-bold transition-all ${digestiveFocus === focus ? "bg-[#e7b48a] text-[#2d3e2e]" : "bg-white/10 text-[#d8e6d8] hover:bg-white/15"}`}>{digestiveGuidance[focus].label}</button>)}</div><div className="mt-4 rounded-xl bg-white/[0.08] p-3"><p className="font-display text-lg text-[#f7f3eb]">{digestive.title}</p><p className="mt-1 text-xs leading-5 text-[#d8e6d8]">{digestive.text}</p><ul className="mt-2 grid gap-1 text-xs leading-5 text-[#e8efe7]">{digestive.tips.map((tip) => <li key={tip} className="flex gap-2"><CheckCheck className="mt-0.5 size-3.5 shrink-0 text-[#e7b48a]" />{tip}</li>)}</ul></div></div>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4"><p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#b9d1bb]">Pergunte ao assistente</p><div className="mt-3 flex flex-wrap gap-2">{quickSuggestions.map((suggestion) => <button key={suggestion.label} onClick={() => { setQuestion(suggestion.question); askAssistant(suggestion.question); }} className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-[0.65rem] font-semibold text-[#d9e8d9] transition-all hover:-translate-y-0.5 hover:border-[#e7b48a] hover:text-[#f3c3a6]">{suggestion.label}</button>)}</div><div className="mt-3 flex gap-2"><input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") askAssistant(); }} placeholder="Ex.: o que usar no lugar do leite?" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-[#a8bba8] outline-none focus:border-[#e7b48a]"/><button onClick={() => askAssistant()} disabled={assistantMutation.isPending} className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7b48a] text-[#2d3e2e] hover:bg-[#f2b58b]" aria-label="Enviar pergunta"><Send className="size-4" /></button></div>{assistantAnswer && <div className="mt-4 rounded-2xl border border-[#e7b48a]/30 bg-[#f7f3eb] p-4 text-sm leading-7 text-[#31583e]"><div className="mb-3 flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#b9684d]"><Sparkles className="size-3.5" /> Resposta organizada</div><Streamdown>{assistantAnswer}</Streamdown></div>}<div className="mt-5 border-t border-white/10 pt-4"><p className="flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#e7b48a]"><WandSparkles className="size-3.5" /> receita dinâmica gratuita</p><p className="mt-2 text-xs leading-5 text-[#c8d9c8]">Digite o que você já tem em casa e a IA cria uma sugestão compatível com seu foco.</p><div className="mt-3 flex gap-2"><input value={availableIngredients} onChange={(event) => setAvailableIngredients(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") generateDynamicRecipe(); }} placeholder="Ex.: arroz, abóbora, ovos e couve" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-[#a8bba8] outline-none focus:border-[#e7b48a]"/><button onClick={generateDynamicRecipe} disabled={recipeMutation.isPending || availableIngredients.trim().length < 3} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#e7b48a] px-3 text-xs font-bold text-[#2d3e2e] transition-colors hover:bg-[#f2b58b] disabled:cursor-not-allowed disabled:opacity-50"><WandSparkles className="size-3.5" />{recipeMutation.isPending ? "Criando..." : "Criar"}</button></div>{recipeMutation.error && <p className="mt-3 text-xs text-[#f4c3a5]">Não consegui criar agora. Tente novamente em instantes.</p>}{recipeMutation.data && <div className="mt-4 rounded-xl bg-white/[0.08] p-3"><p className="font-display text-xl text-[#f7f3eb]">{recipeMutation.data.title}</p><p className="mt-1 text-xs leading-5 text-[#c8d9c8]">{recipeMutation.data.subtitle}</p><div className="mt-3 rounded-xl bg-white/[0.06] p-3 text-xs leading-6 text-[#e8efe7]"><p className="font-bold text-[#e7b48a]">Ingredientes</p><p className="mt-1">{recipeMutation.data.ingredients.join(" · ")}</p><p className="mt-3 font-bold text-[#e7b48a]">Preparo em passos</p><ol className="mt-1 grid gap-1 text-xs leading-5 text-[#e8efe7]">{recipeMutation.data.steps.slice(0, 3).map((step: string, index: number) => <li key={step}><span className="mr-1 text-[#e7b48a]">{index + 1}.</span>{step}</li>)}</ol></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={saveGeneratedRecipe} className="inline-flex items-center gap-2 rounded-full bg-[#e7b48a] px-3 py-2 text-xs font-bold text-[#2d3e2e]"><Bookmark className="size-3.5" /> Salvar nos favoritos</button><button onClick={saveGeneratedRecipeToDiary} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-[#e8efe7]"><CalendarDays className="size-3.5" /> Enviar ao diário</button></div></div>}</div></div>
                  <div className="mt-5 flex gap-3 rounded-2xl border border-[#e7b48a]/30 bg-[#e7b48a]/10 p-4 text-xs leading-5 text-[#f1d6c0]"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#e7b48a]" /><span>{result.alert}</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="favoritos" className="scroll-mt-28 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-[1120px] rounded-[2rem] border border-[#e2ddd3] bg-[#fbfaf6] p-6 shadow-[0_16px_42px_rgba(57,76,58,0.06)] sm:p-9">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="section-kicker">Seu repertório</p>
                <h2 className="section-title mt-4 text-[2.7rem] sm:text-[3.5rem]">Refeições que <span className="italic text-[#b9684d]">ficam.</span></h2>
                <p className="mt-4 max-w-[560px] text-sm leading-6 text-[#68766b]">Salve ideias no assistente para consultar quando estiver planejando a próxima compra ou refeição. Elas ficam neste navegador.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e8f0e7] px-3.5 py-2 text-xs font-bold text-[#467254]"><Bookmark className="size-3.5" /> {favorites.length} {favorites.length === 1 ? "refeição salva" : "refeições salvas"}</span>
            </div>
            {favorites.length > 0 && <div className="mt-7 flex flex-wrap items-center gap-2"><span className="mr-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#718074]"><Filter className="size-3.5" /> filtrar</span>{favoriteCategories.map((category) => <button key={category} onClick={() => setFavoriteFilter(category)} className={`rounded-full border px-3 py-2 text-xs font-bold capitalize transition-colors ${favoriteFilter === category ? "border-[#31583e] bg-[#31583e] text-white" : "border-[#d5e0d4] bg-white text-[#5d765f] hover:bg-[#eef5ed]"}`}>{category}</button>)}</div>}
            <div className="mt-7 animate-soft-pop rounded-2xl border border-[#d7e2d5] bg-[#f1f6ef] p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white text-[#477354]"><ShoppingBasket className="size-5" /></span><div><p className="text-sm font-bold text-[#31583e]">Lista de compras semanal</p><p className="mt-1 text-xs leading-5 text-[#718074]">{shoppingItems.length ? `${shoppingItems.length} itens com quantidades e categorias reconhecidos nas refeições salvas.` : "Salve refeições para montar sua lista automaticamente."}</p></div></div><div className="flex gap-2"><button onClick={() => setShoppingOpen((open) => !open)} className="rounded-full border border-[#cbdcc9] bg-white px-3 py-2 text-xs font-bold text-[#477354]">{shoppingOpen ? "Ocultar lista" : "Ver lista"}</button><button onClick={exportShoppingList} className="inline-flex items-center gap-2 rounded-full bg-[#31583e] px-3 py-2 text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#254a38]"><Download className="size-3.5" />Exportar lista</button></div></div>{shoppingOpen && <div className="mt-4 grid gap-2 border-t border-[#d7e2d5] pt-4 sm:grid-cols-2">{shoppingItems.length ? shoppingItems.map((item) => <div key={item.name} className="rounded-xl bg-white px-3 py-2 text-sm text-[#4f6653]"><span className="mr-2 text-[#b9684d]">□</span><strong className="capitalize">{item.name}</strong><span className="ml-2 text-xs text-[#718074]">{item.quantity} · {item.category}</span></div>) : <p className="text-sm text-[#718074]">Ainda não há itens suficientes. Salve uma refeição como arroz, feijão, ovos, frutas ou legumes.</p>}</div>}</div>
            {favorites.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-[#cbd9ca] bg-[#f3f7f1] p-6 text-sm text-[#6d7d70]">Seu espaço está pronto. Use o botão <strong className="font-bold text-[#31583e]">Salvar refeição</strong> no assistente para guardar uma sugestão.</div>
            ) : visibleFavorites.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-[#cbd9ca] bg-[#f3f7f1] p-6 text-sm text-[#6d7d70]">Nenhuma refeição salva nesta categoria.</div>
            ) : (
              <div className="mt-8 grid gap-3 md:grid-cols-2">{visibleFavorites.map((item) => <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl bg-[#e9f0e8] p-4 text-sm leading-6 text-[#4f6653]"><div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white text-[#477354]"><Utensils className="size-4" /></span><div><span className="block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#b9684d]">{item.category}</span><span>{item.meal}</span></div></div><button onClick={() => removeFavorite(item.id)} className="rounded-full p-2 text-[#718074] hover:bg-white hover:text-[#b9684d]" aria-label="Remover refeição dos favoritos"><Trash2 className="size-4" /></button></div>)}</div>
            )}
          </div>
        </section>

        <section id="entenda" className="scroll-mt-28 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-[1120px]">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start"><div><p className="section-kicker">Conhecimento sem complicar</p><h2 className="section-title mt-4">Antes de excluir,<br /><span className="italic text-[#b9684d]">vamos entender.</span></h2><p className="mt-6 max-w-[330px] text-sm leading-6 text-[#6d796e]">Informação clara ajuda a proteger a saúde e também devolve liberdade para comer com mais segurança.</p><Link href="/guias" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#31583e]">Ver todos os guias <ArrowUpRight className="size-4" /></Link></div><div className="grid gap-4">{knowledgeCards.map((card) => <article key={card.eyebrow} className={`relative overflow-hidden rounded-[1.75rem] p-6 sm:p-7 ${card.color === "sage" ? "bg-[#dcebdd]" : card.color === "sand" ? "bg-[#f1e4d1]" : "bg-[#f0d7ca]"}`}><span className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#6e7d70]">{card.eyebrow}</span><h3 className="mt-5 max-w-[530px] font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.05em] text-[#2a4131]">{card.title}</h3><p className="mt-3 max-w-[570px] text-sm leading-6 text-[#5e6e60]">{card.body}</p><span className="absolute -bottom-10 -right-6 font-display text-[8rem] italic leading-none text-black/[0.04]">{card.eyebrow.slice(0, 2)}</span></article>)}</div></div>
          </div>
        </section>

        <section id="guias" className="scroll-mt-28 border-t border-[#e3ded4] bg-[#fbfaf6] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-[1120px]"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="section-kicker">Biblioteca NutriApoio</p><h2 className="section-title mt-4">Guias para levar<br className="hidden sm:block" /> <span className="italic text-[#b9684d]">para a vida real.</span></h2></div><p className="max-w-[360px] text-sm leading-6 text-[#6d796e]">Conteúdo direto ao ponto para você consultar no mercado, na cozinha ou quando surgir uma dúvida.</p></div><div className="mt-11 grid gap-4 md:grid-cols-3">{guideCards.map((card) => <article key={card.title} className="group flex min-h-[300px] flex-col rounded-[1.75rem] border border-[#e5e1d8] bg-[#f7f3eb] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#c5d5c7] hover:shadow-[0_18px_42px_rgba(57,76,58,0.1)]"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-[#e2ede1] text-[#477354]"><card.icon className="size-5" /></span><span className="rounded-full bg-white px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#728076]">{card.time}</span></div><p className="mt-10 text-[0.67rem] font-bold uppercase tracking-[0.18em] text-[#b9684d]">{card.tag}</p><h3 className="mt-3 font-display text-[1.65rem] font-semibold leading-tight tracking-[-0.05em] text-[#2b4332]">{card.title}</h3><p className="mt-3 text-sm leading-6 text-[#68766b]">{card.desc}</p><button onClick={() => window.location.href = card.tag === "Rotulagem" ? "/guias/rotulos" : card.tag === "Segurança" ? "/guias/organizacao" : "/guias"} className="mt-auto flex items-center gap-2 pt-7 text-xs font-bold uppercase tracking-[0.14em] text-[#3f684d]">abrir guia <MoveRight className="size-4 transition-transform group-hover:translate-x-1" /></button></article>)}</div></div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="mx-auto max-w-[1120px] overflow-hidden rounded-[2rem] bg-[#e7a47d] px-6 py-10 sm:px-10 lg:px-14 lg:py-12"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><span className="inline-flex items-center gap-2 text-[0.67rem] font-bold uppercase tracking-[0.18em] text-[#704635]"><CookingPot className="size-4" /> para guardar</span><h2 className="mt-4 max-w-[650px] font-display text-[2.3rem] font-semibold leading-[1] tracking-[-0.055em] text-[#2d3e2e] sm:text-[3.1rem]">Sua alimentação merece cuidado, não cobrança.</h2></div><button onClick={openAssistant} className="inline-flex items-center justify-center gap-3 rounded-full bg-[#254a38] px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1b3a2a] active:scale-[0.97]">Voltar ao assistente <ArrowUpRight className="size-4" /></button></div></div></section>
      </main>

      <footer className="border-t border-[#dedbd2] bg-[#203226] px-4 py-12 text-[#d8e2d7] sm:px-6 lg:px-8"><div className="mx-auto max-w-[1120px]"><div className="grid gap-10 lg:grid-cols-[1fr_auto_auto] lg:items-start"><div><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#e7a47d] text-[#254a38]"><Sprout className="size-[18px]" /></span><span className="font-display text-[1.25rem] font-semibold tracking-[-0.04em] text-white">Nutri<span className="text-[#e7a47d]">Apoio</span></span></div><p className="mt-4 max-w-[340px] text-sm leading-6 text-[#a9baa9]">Informação para quem precisa fazer escolhas alimentares com mais segurança, autonomia e acolhimento.</p></div><div><p className="text-[0.66rem] font-bold uppercase tracking-[0.17em] text-[#e7a47d]">Explore</p><div className="mt-4 grid gap-3 text-sm text-[#c3d0c2]"><a className="hover:text-white" href="#assistente">Assistente</a><a className="hover:text-white" href="#entenda">Entenda sua condição</a><Link className="hover:text-white" href="/guias">Guias práticos</Link></div></div><div><p className="text-[0.66rem] font-bold uppercase tracking-[0.17em] text-[#e7a47d]">Importante</p><div className="mt-4 max-w-[270px] text-sm leading-6 text-[#a9baa9]">O conteúdo é educativo e não substitui uma consulta individualizada com nutricionista, médico gastroenterologista ou alergologista.</div></div></div><div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 text-[0.68rem] text-[#8da18d] sm:flex-row"><span>© 2026 NutriApoio · feito para cuidar</span><span>Privacidade · Contato · Acessibilidade</span></div></div></footer>
    </div>
  );
}
