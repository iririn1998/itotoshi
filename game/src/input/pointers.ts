import type { Engine } from "excalibur";

/** Excalibur の正規化ポインター ID を走査する上限（マウス＋マルチタッチ想定） */
const NORMALIZED_POINTER_ID_LIMIT = 8;

/** マウス／タッチのいずれかが押されているか（正規化ポインター ID を走査） */
export const isAnyPointerDown = (engine: Engine): boolean => {
  const { pointers } = engine.input;
  for (let i = 0; i < NORMALIZED_POINTER_ID_LIMIT; i++) {
    if (pointers.isDown(i)) return true;
  }
  return false;
};
