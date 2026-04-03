import { Color, DisplayMode, Engine } from "excalibur";

export const createEngine = (): Engine =>
  new Engine({
    canvasElementId: "game",
    width: 800,
    height: 600,
    displayMode: DisplayMode.FitScreen,
    backgroundColor: Color.Black,
  });
