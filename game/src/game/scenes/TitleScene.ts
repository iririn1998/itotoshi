import { Color, type Engine, Scene } from "excalibur";

/** HTML タイトルと重なるプレースホルダー（キャンバス側の「タイトルページ」） */
export class TitleScene extends Scene {
  onInitialize = (_engine: Engine): void => {
    this.backgroundColor = Color.Black;
  };
}
