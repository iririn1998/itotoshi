import type { Engine } from "excalibur";
import { GameScene } from "../game/sceneKeys";
import type { GameplayScene } from "../game/scenes/GameplayScene";

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

const GAME_OVER_MODAL_DELAY_MS = 500;
/** `style.css` のゲームオーバーモーダル transition 時間と揃える */
const GAME_OVER_FADE_MS = 500;

/**
 * index.html のタイトル／ランキング／ゲームオーバー DOM と Excalibur シーン遷移を結ぶ
 */
export const bindShellUi = (game: Engine, gameplayScene: GameplayScene): void => {
  const titleScreen = requireElement<HTMLDivElement>("title-screen");
  const gameOverScreen = requireElement<HTMLDivElement>("game-over-screen");
  const gameOverDialog = gameOverScreen.querySelector<HTMLElement>('[role="dialog"]');
  if (!gameOverDialog) {
    throw new Error('Missing role="dialog" inside #game-over-screen');
  }
  const rankingScreen = requireElement<HTMLDivElement>("ranking-screen");
  const rankingDialog = rankingScreen.querySelector<HTMLElement>('[role="dialog"]');
  if (!rankingDialog) {
    throw new Error('Missing role="dialog" inside #ranking-screen');
  }
  const btnGameStart = requireElement<HTMLButtonElement>("btn-game-start");
  const btnRanking = requireElement<HTMLButtonElement>("btn-ranking");
  const btnRankingBack = requireElement<HTMLButtonElement>("btn-ranking-back");
  const btnGameOverRetry = requireElement<HTMLButtonElement>("btn-game-over-retry");
  const btnGameOverHome = requireElement<HTMLButtonElement>("btn-game-over-home");
  const appShell = requireElement<HTMLDivElement>("app-shell");
  const hudScore = requireElement<HTMLDivElement>("hud-score");
  const hudScoreValue = requireElement<HTMLSpanElement>("hud-score-value");

  const setGameplayHudVisible = (visible: boolean): void => {
    hudScore.classList.toggle("is-hidden", !visible);
  };

  const syncHudScoreText = (value: number): void => {
    hudScoreValue.textContent = String(value);
  };

  gameplayScene.session.addScoreChangeListener((score) => {
    syncHudScoreText(score);
  });
  syncHudScoreText(gameplayScene.session.score);

  const restoreShellInertAfterGameOver = (): void => {
    for (const child of appShell.children) {
      if (child === gameOverScreen) {
        continue;
      }
      child.removeAttribute("inert");
      if (child instanceof HTMLElement) {
        child.setAttribute("aria-hidden", child.classList.contains("is-hidden") ? "true" : "false");
      }
    }
  };

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

  let gameOverShowTimeout: ReturnType<typeof setTimeout> | null = null;
  let gameOverFadeEndTimeout: ReturnType<typeof setTimeout> | null = null;

  const clearGameOverShowTimeout = (): void => {
    if (gameOverShowTimeout !== null) {
      clearTimeout(gameOverShowTimeout);
      gameOverShowTimeout = null;
    }
  };

  const clearGameOverFadeEndTimeout = (): void => {
    if (gameOverFadeEndTimeout !== null) {
      clearTimeout(gameOverFadeEndTimeout);
      gameOverFadeEndTimeout = null;
    }
  };

  const hideGameOver = (): void => {
    clearGameOverShowTimeout();
    clearGameOverFadeEndTimeout();
    gameOverScreen.classList.remove("game-over-fade-enter", "game-over-fade-enter-active");
    setOverlayVisible(gameOverScreen, false);
    restoreShellInertAfterGameOver();
  };

  const showGameOver = (): void => {
    clearGameOverFadeEndTimeout();
    gameOverScreen.classList.remove("game-over-fade-enter-active");
    gameOverScreen.classList.add("game-over-fade-enter");
    setOverlayVisible(gameOverScreen, true);
    for (const child of appShell.children) {
      if (child === gameOverScreen) {
        continue;
      }
      child.setAttribute("inert", "");
      child.setAttribute("aria-hidden", "true");
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        gameOverScreen.classList.add("game-over-fade-enter-active");
      });
    });
    const fadeEndMs = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : GAME_OVER_FADE_MS;
    gameOverFadeEndTimeout = setTimeout(() => {
      gameOverFadeEndTimeout = null;
      gameOverScreen.classList.remove("game-over-fade-enter", "game-over-fade-enter-active");
      focusElement(gameOverDialog);
    }, fadeEndMs);
  };

  const scheduleGameOverUi = (): void => {
    clearGameOverShowTimeout();
    gameOverShowTimeout = setTimeout(() => {
      gameOverShowTimeout = null;
      showGameOver();
    }, GAME_OVER_MODAL_DELAY_MS);
  };

  gameplayScene.registerGameOverUi(scheduleGameOverUi);

  btnRanking.addEventListener("click", () => {
    setRankingModalOpen(true);
  });

  btnRankingBack.addEventListener("click", () => {
    setRankingModalOpen(false);
  });

  btnGameStart.addEventListener("click", () => {
    hideGameOver();
    setRankingModalOpen(false, { restoreFocus: false });
    setOverlayVisible(titleScreen, false);
    setGameplayHudVisible(true);
    void game.goToScene(GameScene.gameplay);
  });

  btnGameOverRetry.addEventListener("click", () => {
    hideGameOver();
    setGameplayHudVisible(true);
    gameplayScene.resetRound();
  });

  btnGameOverHome.addEventListener("click", () => {
    hideGameOver();
    setGameplayHudVisible(false);
    setOverlayVisible(titleScreen, true);
    void game.goToScene(GameScene.title);
  });
};
