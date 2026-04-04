import { Color, DisplayMode, Engine } from "excalibur";
import { tuning } from "./tuning";

export const createEngine = (): Engine =>
  new Engine({
    canvasElementId: "game",
    width: tuning.gameViewport.width,
    height: tuning.gameViewport.height,
    displayMode: DisplayMode.FitScreen,
    backgroundColor: Color.Black,
    suppressPlayButton: true,
  });
