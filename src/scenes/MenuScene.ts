import Phaser from "phaser";
import { CharacterCustomizationSystem } from "../systems/CharacterCustomizationSystem";
import { SaveSystem } from "../systems/SaveSystem";
import type { CharacterCustomization } from "../types";

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Elemento não encontrado: ${id}`);
  return element as T;
}

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    const menu = getElement("main-menu");
    const appShell = getElement("app-shell");
    menu.classList.remove("is-hidden");
    appShell.classList.add("is-menu-open");

    const name = getElement<HTMLInputElement>("custom-name");
    const skin = getElement<HTMLInputElement>("custom-skin");
    const hair = getElement<HTMLInputElement>("custom-hair");
    const outfit = getElement<HTMLInputElement>("custom-outfit");
    const style = getElement<HTMLSelectElement>("custom-style");
    const help = getElement("menu-help");

    const savedCustomization = CharacterCustomizationSystem.load();
    name.value = savedCustomization.farmerName;
    skin.value = savedCustomization.skinColor;
    hair.value = savedCustomization.hairColor;
    outfit.value = savedCustomization.outfitColor;
    style.value = savedCustomization.style;
    this.updatePreview(savedCustomization);

    [name, skin, hair, outfit, style].forEach((input) => {
      input.oninput = () => this.updatePreview(this.readCustomization());
    });

    getElement<HTMLButtonElement>("menu-play").onclick = () => {
      CharacterCustomizationSystem.save(this.readCustomization());
      SaveSystem.clearGame();
      this.startGame();
    };

    getElement<HTMLButtonElement>("menu-continue").onclick = () => {
      CharacterCustomizationSystem.save(this.readCustomization());
      this.startGame();
    };

    getElement<HTMLButtonElement>("menu-reset").onclick = () => {
      if (!window.confirm("Resetar progresso e casos aprendidos?")) return;
      SaveSystem.clearAll();
      CharacterCustomizationSystem.save(this.readCustomization());
      help.textContent = "Progresso resetado. Clique em Jogar para começar uma fazenda nova.";
      help.classList.remove("is-hidden");
    };

    getElement<HTMLButtonElement>("menu-how").onclick = () => {
      help.textContent = "Use WASD/setas para andar, E para interagir, clique nos canteiros para usar ferramentas, TAB troca sementes, Q pede ajuda CBR.";
      help.classList.toggle("is-hidden");
    };

    getElement<HTMLButtonElement>("menu-fullscreen").onclick = () => {
      void document.documentElement.requestFullscreen?.();
    };

    getElement<HTMLButtonElement>("menu-continue").disabled = !SaveSystem.hasGame();
  }

  private startGame(): void {
    getElement("main-menu").classList.add("is-hidden");
    getElement("app-shell").classList.remove("is-menu-open");
    this.scene.start("FarmScene");
  }

  private readCustomization(): CharacterCustomization {
    return CharacterCustomizationSystem.normalize({
      farmerName: getElement<HTMLInputElement>("custom-name").value,
      skinColor: getElement<HTMLInputElement>("custom-skin").value,
      hairColor: getElement<HTMLInputElement>("custom-hair").value,
      outfitColor: getElement<HTMLInputElement>("custom-outfit").value,
      style: getElement<HTMLSelectElement>("custom-style").value as CharacterCustomization["style"],
    });
  }

  private updatePreview(customization: CharacterCustomization): void {
    const preview = getElement("custom-preview");
    preview.style.setProperty("--preview-skin", customization.skinColor);
    preview.style.setProperty("--preview-hair", customization.hairColor);
    preview.style.setProperty("--preview-outfit", customization.outfitColor);
    preview.dataset.style = customization.style;
  }
}
