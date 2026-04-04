import type { Engine } from "excalibur";
import { GameScene } from "../game/sceneKeys";

const requireElement = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element #${id}`);
  }
  return el as T;
};

const setOverlayVisible = (overlay: HTMLElement, visible: boolean): void => {
  overlay.classList.toggle("is-hidden", !visible);
  overlay.setAttribute("aria-hidden", visible ? "false" : "true");
};

/**
 * index.html のタイトル／ランキング DOM と Excalibur シーン遷移を結ぶ
 */
export const bindShellUi = (game: Engine): void => {
  const titleScreen = requireElement<HTMLDivElement>("title-screen");
  const rankingScreen = requireElement<HTMLDivElement>("ranking-screen");
  const btnGameStart = requireElement<HTMLButtonElement>("btn-game-start");
  const btnRanking = requireElement<HTMLButtonElement>("btn-ranking");
  const btnRankingBack = requireElement<HTMLButtonElement>("btn-ranking-back");

  btnRanking.addEventListener("click", () => {
    setOverlayVisible(rankingScreen, true);
  });

  btnRankingBack.addEventListener("click", () => {
    setOverlayVisible(rankingScreen, false);
  });

  btnGameStart.addEventListener("click", () => {
    setOverlayVisible(rankingScreen, false);
    setOverlayVisible(titleScreen, false);
    void game.goToScene(GameScene.gameplay);
  });
};
