import "./style.css";
import { LineActor } from "./actors/LineActor.ts";
import { createEngine } from "./game/engine.ts";

const game = createEngine();
const lineActor = new LineActor();
game.add(lineActor);

game.start();
