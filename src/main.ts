import "./style.css";
import { Engine, DisplayMode, Color } from "excalibur";

const game = new Engine({
  canvasElementId: "game",
  width: 800,
  height: 600,
  displayMode: DisplayMode.FitScreen,
  backgroundColor: Color.DarkGray,
});

game.start();
