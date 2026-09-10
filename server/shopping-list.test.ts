import { describe, expect, it } from "vitest";
import { buildShoppingList, scaleShoppingQuantity } from "../client/src/lib/nutrition-utils";

describe("buildShoppingList", () => {
  it("deduplicates recognized ingredients from saved meals", () => {
    const result = buildShoppingList([
      { meal: "arroz, feijão e ovos", restriction: "Doença celíaca" },
      { meal: "arroz com abóbora e ovos", restriction: "" },
    ]);
    expect(result).toHaveLength(4);
    expect(result).toEqual(expect.arrayContaining(["abóbora", "arroz", "feijão", "ovos"]));
  });

  it("returns an empty list when favorites have no recognized ingredients", () => {
    expect(buildShoppingList([{ meal: "uma ideia especial", restriction: "" }])).toEqual([]);
  });

  it("scales numeric quantities for the household size", () => {
    expect(scaleShoppingQuantity("500 g", 4)).toBe("2000 g");
    expect(scaleShoppingQuantity("1 dúzia", 3)).toBe("3 dúzia");
  });
});
