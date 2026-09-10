export type ShoppingFavorite = {
  meal: string;
  restriction: string;
};

export type ShoppingItem = {
  name: string;
  quantity: string;
  category: "Hortifruti" | "Grãos e cereais" | "Proteínas" | "Laticínios e alternativas" | "Despensa";
};

const ingredientCatalog: ShoppingItem[] = [
  { name: "arroz", quantity: "1 kg", category: "Grãos e cereais" },
  { name: "feijão", quantity: "500 g", category: "Despensa" },
  { name: "quinoa", quantity: "500 g", category: "Grãos e cereais" },
  { name: "aveia", quantity: "500 g", category: "Grãos e cereais" },
  { name: "tapioca", quantity: "500 g", category: "Grãos e cereais" },
  { name: "ovos", quantity: "1 dúzia", category: "Proteínas" },
  { name: "frango", quantity: "1 kg", category: "Proteínas" },
  { name: "peixe", quantity: "600 g", category: "Proteínas" },
  { name: "carne", quantity: "600 g", category: "Proteínas" },
  { name: "tofu", quantity: "400 g", category: "Proteínas" },
  { name: "grão-de-bico", quantity: "500 g", category: "Despensa" },
  { name: "lentilha", quantity: "500 g", category: "Despensa" },
  { name: "abóbora", quantity: "1 unidade pequena", category: "Hortifruti" },
  { name: "batata", quantity: "1 kg", category: "Hortifruti" },
  { name: "mandioca", quantity: "1 kg", category: "Hortifruti" },
  { name: "cenoura", quantity: "1 kg", category: "Hortifruti" },
  { name: "abobrinha", quantity: "3 unidades", category: "Hortifruti" },
  { name: "couve", quantity: "1 maço", category: "Hortifruti" },
  { name: "salada", quantity: "2 maços", category: "Hortifruti" },
  { name: "fruta", quantity: "10 unidades", category: "Hortifruti" },
  { name: "banana", quantity: "1 dúzia", category: "Hortifruti" },
  { name: "castanhas", quantity: "200 g", category: "Despensa" },
  { name: "pasta de amendoim", quantity: "1 pote", category: "Despensa" },
  { name: "iogurte sem lactose", quantity: "4 unidades", category: "Laticínios e alternativas" },
];

export function buildShoppingListDetails(favorites: ShoppingFavorite[]): ShoppingItem[] {
  return ingredientCatalog
    .filter((item) => favorites.some((favorite) => `${favorite.meal} ${favorite.restriction}`.toLowerCase().includes(item.name)))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export function buildShoppingList(favorites: ShoppingFavorite[]): string[] {
  return buildShoppingListDetails(favorites).map((item) => item.name);
}

export function scaleShoppingQuantity(quantity: string, people: number): string {
  const match = quantity.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) return `${quantity} × ${people}`;
  const amount = Number(match[1].replace(",", ".")) * people;
  const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace(".", ",");
  return `${formatted} ${match[2]}`.trim();
}
