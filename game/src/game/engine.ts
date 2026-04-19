import { Color, DisplayMode, Engine } from "excalibur";
import { tuning } from "./tuning";

export const createEngine = (): Engine =>
  new Engine({
    canvasElementId: "game",
    width: tuning.gameViewport.width,
    height: tuning.gameViewport.height,
    /** 親 #game-frame のサイズに合わせる（FitScreen は window 基準でシェルの padding を無視する） */
    displayMode: DisplayMode.FitContainer,
    backgroundColor: Color.Black,
    suppressPlayButton: true,
  });
