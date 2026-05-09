import { defaultCustomization } from "../data/characterOptions";
import type { CharacterCustomization } from "../types";

const customizationKey = "fazendinha-cbr-customization";

function sanitizeColor(value: string | undefined, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

export class CharacterCustomizationSystem {
  static load(): CharacterCustomization {
    const raw = localStorage.getItem(customizationKey);
    if (!raw) return { ...defaultCustomization };

    try {
      return this.normalize(JSON.parse(raw) as Partial<CharacterCustomization>);
    } catch {
      return { ...defaultCustomization };
    }
  }

  static save(customization: CharacterCustomization): void {
    localStorage.setItem(customizationKey, JSON.stringify(this.normalize(customization)));
  }

  static clear(): void {
    localStorage.removeItem(customizationKey);
  }

  static normalize(value?: Partial<CharacterCustomization>): CharacterCustomization {
    return {
      farmerName: typeof value?.farmerName === "string" && value.farmerName.trim() ? value.farmerName.trim().slice(0, 20) : defaultCustomization.farmerName,
      skinColor: sanitizeColor(value?.skinColor, defaultCustomization.skinColor),
      hairColor: sanitizeColor(value?.hairColor, defaultCustomization.hairColor),
      outfitColor: sanitizeColor(value?.outfitColor, defaultCustomization.outfitColor),
      style: value?.style === "B" || value?.style === "C" ? value.style : defaultCustomization.style,
    };
  }
}
