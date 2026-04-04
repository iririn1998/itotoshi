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

const focusElement = (el: HTMLElement): void => {
  requestAnimationFrame(() => {
    el.focus();
  });
};

/**
 * index.html のタイトル／ランキング DOM と Excalibur シーン遷移を結ぶ
 */
export const bindShellUi = (game: Engine): void => {
  const titleScreen = requireElement<HTMLDivElement>("title-screen");
  const rankingScreen = requireElement<HTMLDivElement>("ranking-screen");
  const rankingDialog = rankingScreen.querySelector<HTMLElement>('[role="dialog"]');
  if (!rankingDialog) {
    throw new Error('Missing role="dialog" inside #ranking-screen');
  }
  const btnGameStart = requireElement<HTMLButtonElement>("btn-game-start");
  const btnRanking = requireElement<HTMLButtonElement>("btn-ranking");
  const btnRankingBack = requireElement<HTMLButtonElement>("btn-ranking-back");

  const setRankingModalOpen = (open: boolean, options?: { restoreFocus?: boolean }): void => {
    const restoreFocus = options?.restoreFocus !== false;
    setOverlayVisible(rankingScreen, open);
    titleScreen.toggleAttribute("inert", open);
    titleScreen.setAttribute("aria-hidden", open ? "true" : "false");
    if (open) {
      focusElement(rankingDialog);
    } else if (restoreFocus) {
      focusElement(btnRanking);
    }
  };

  btnRanking.addEventListener("click", () => {
    setRankingModalOpen(true);
  });

  btnRankingBack.addEventListener("click", () => {
    setRankingModalOpen(false);
  });

  btnGameStart.addEventListener("click", () => {
    setRankingModalOpen(false, { restoreFocus: false });
    setOverlayVisible(titleScreen, false);
    void game.goToScene(GameScene.gameplay);
  });
};
