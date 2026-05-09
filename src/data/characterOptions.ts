import type { CharacterCustomization } from "../types";

export const defaultCustomization: CharacterCustomization = {
  farmerName: "Fazendeiro CBR",
  skinColor: "#f1b77a",
  hairColor: "#7a4a24",
  outfitColor: "#4d6fb3",
  style: "A",
};

export const skinOptions = ["#f1b77a", "#c98b5d", "#8b5a3c", "#f3cfaa"];
export const hairOptions = ["#7a4a24", "#263027", "#c47a35", "#f4cc58"];
export const outfitOptions = ["#4d6fb3", "#3f9a49", "#b95234", "#8d5fb8"];
export const styleOptions: CharacterCustomization["style"][] = ["A", "B", "C"];
