import type { Engine } from "excalibur";

/**
 * ラウンド開始／リトライ直前に呼ぶ。
 * ゲームオーバー中に canvas へ pointerup が届かず Excalibur 側だけ「押下のまま」残るのを捨て、
 * キーボードの取り残しも {@link Engine.input.clear} で揃える。
 */
export const syncInputAfterRoundReset = (engine: Engine): void => {
  engine.input.clear();
  const { pointers } = engine.input;
  pointers.currentFramePointerDown.clear();
  pointers.lastFramePointerDown.clear();
};
