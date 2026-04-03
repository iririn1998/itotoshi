import type { Engine } from "excalibur";

/** マウス／タッチのいずれかが押されているか（正規化ポインター ID を走査） */
export const isAnyPointerDown = (engine: Engine): boolean => {
  const { pointers } = engine.input;
  for (let i = 0; i < 8; i++) {
    if (pointers.isDown(i)) return true;
  }
  return false;
};
