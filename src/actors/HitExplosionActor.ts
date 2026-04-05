import {
  Actor,
  BoundingBox,
  ExcaliburGraphicsContext2DCanvas,
  Vector,
  type Engine,
} from "excalibur";
import { tuning } from "../game/tuning";

const ex = tuning.hitExplosion;
const exSt = ex.streak;
const exDeb = ex.debris;
const exRay = ex.primaryRays;
const exDraw = ex.draw;

type SparkStreak = {
  readonly angle: number;
  readonly speed: number;
  readonly tail: number;
  readonly width: number;
};

type Debris = {
  readonly angle: number;
  readonly speed: number;
  readonly size: number;
};

type PrimaryRay = {
  readonly angle: number;
  readonly maxLen: number;
  readonly width: number;
};

const easeOutCubic = (x: number): number => 1 - (1 - x) ** 3;
const easeOutQuad = (x: number): number => 1 - (1 - x) * (1 - x);

/**
 * 壁接触地点の爆発演出。白のみ（アルファで濃淡）で多層のフラッシュ・リング・火花を重ねる。
 */
export class HitExplosionActor extends Actor {
  private elapsedMs = 0;
  private readonly durationMs = ex.durationMs;
  private readonly streaks: SparkStreak[];
  private readonly debris: Debris[];
  private readonly primaryRays: PrimaryRay[];

  constructor(worldPos: Vector) {
    super({
      pos: worldPos.clone(),
      z: 8,
    });

    const n = ex.sparkStreakCount;
    const streaks: SparkStreak[] = [];
    const base = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const jitter = (Math.random() - 0.5) * base * exSt.angleJitterHalfSpan;
      streaks.push({
        angle: i * base + jitter,
        speed: ex.sparkSpeedMin + Math.random() * (ex.sparkSpeedMax - ex.sparkSpeedMin),
        tail: exSt.tailMinPx + Math.random() * exSt.tailJitterPx,
        width: Math.random() < exSt.thickProbability ? exSt.widthThickPx : exSt.widthThinPx,
      });
    }
    this.streaks = streaks;

    const dCount = ex.debrisCount;
    const debris: Debris[] = [];
    for (let i = 0; i < dCount; i++) {
      debris.push({
        angle: Math.random() * Math.PI * 2,
        speed:
          exDeb.speedBasePxPerSec + Math.random() * (ex.sparkSpeedMax * exDeb.speedSparkMaxFactor),
        size: exDeb.sizeMinPx + Math.random() * exDeb.sizeJitterPx,
      });
    }
    this.debris = debris;

    const rayCount = exRay.count;
    const rays: PrimaryRay[] = [];
    for (let i = 0; i < rayCount; i++) {
      rays.push({
        angle: (i / rayCount) * Math.PI * 2 + (Math.random() - 0.5) * exRay.angleJitterRad,
        maxLen: exRay.lenMinPx + Math.random() * (exRay.lenMaxPx - exRay.lenMinPx),
        width: i % 2 === 0 ? exRay.widthWidePx : exRay.widthNarrowPx,
      });
    }
    this.primaryRays = rays;
  }

  onInitialize = (): void => {
    const reach = ex.ringMaxRadiusPx + ex.sparkSpeedMax * (ex.durationMs / tuning.msPerSecond);
    this.graphics.localBounds = new BoundingBox(-reach, -reach, reach, reach);

    this.graphics.onPostDraw = (ctx) => {
      const t = Math.min(1, this.elapsedMs / this.durationMs);
      const masterFade = 1 - easeOutQuad(t);
      if (masterFade <= exDraw.masterFadeCutoff) {
        return;
      }
      if (!(ctx instanceof ExcaliburGraphicsContext2DCanvas)) {
        return;
      }
      const c = ctx.__ctx;
      const sec = this.elapsedMs / tuning.msPerSecond;

      c.save();
      c.lineCap = "round";
      c.lineJoin = "round";

      // --- 外周のソフトグロー（白・低アルファ） ---
      const glowR =
        ex.ringMaxRadiusPx *
        (exDraw.glowRadiusEaseMin + exDraw.glowRadiusEaseMax * easeOutCubic(t));
      const gg = c.createRadialGradient(0, 0, 0, 0, 0, glowR);
      gg.addColorStop(0, `rgba(255,255,255,${exDraw.glowCenterAlpha * masterFade})`);
      gg.addColorStop(exDraw.glowMidStop, `rgba(255,255,255,${exDraw.glowMidAlpha * masterFade})`);
      gg.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = gg;
      c.beginPath();
      c.arc(0, 0, glowR, 0, Math.PI * 2);
      c.fill();

      // --- 中心フラッシュ（最初の数フレームで強く、その後は素早く減衰） ---
      const flashPhase = Math.min(1, this.elapsedMs / exDraw.flashPhaseMs);
      const flashAlpha = (1 - easeOutCubic(flashPhase)) * masterFade;
      const coreR =
        exDraw.coreRadiusBasePx +
        exDraw.coreRadiusFlashScalePx * (1 - flashPhase) ** exDraw.coreRadiusExponent;
      const cg = c.createRadialGradient(0, 0, 0, 0, 0, coreR);
      cg.addColorStop(0, `rgba(255,255,255,${exDraw.coreAlphaCenter * flashAlpha})`);
      cg.addColorStop(exDraw.coreStop1, `rgba(255,255,255,${exDraw.coreAlpha1 * flashAlpha})`);
      cg.addColorStop(exDraw.coreStop2, `rgba(255,255,255,${exDraw.coreAlpha2 * flashAlpha})`);
      cg.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = cg;
      c.beginPath();
      c.arc(0, 0, coreR, 0, Math.PI * 2);
      c.fill();

      // --- 遅延ショックリング（複数波、白ストローク） ---
      for (let w = 0; w < ex.ringWaveCount; w++) {
        const start = w * ex.ringWaveStaggerMs;
        const wt = (this.elapsedMs - start) / (this.durationMs * exDraw.ringWaveDurationFactor);
        if (wt <= 0 || wt >= 1) {
          continue;
        }
        const eased = easeOutCubic(wt);
        const ringInner = exDraw.ringInnerMinPx;
        const ringR = ringInner + (ex.ringMaxRadiusPx - ringInner) * eased;
        const ringAlpha =
          (1 - wt) ** exDraw.ringAlphaExponent * masterFade * exDraw.ringStrokeAlphaScale;
        c.strokeStyle = `rgba(255,255,255,${ringAlpha})`;
        c.lineWidth = w === 0 ? exDraw.ringStrokeWidthPrimaryPx : exDraw.ringStrokeWidthSecondaryPx;
        c.beginPath();
        c.arc(0, 0, ringR, 0, Math.PI * 2);
        c.stroke();
      }

      // --- 太い主軸レイ（スターバースト） ---
      const rayT = Math.min(1, sec / exDraw.primaryRayExpandSec);
      const rayEase = easeOutCubic(rayT);
      const rayFade = (1 - Math.min(1, sec / exDraw.primaryRayFadeSec)) * masterFade;
      c.strokeStyle = `rgba(255,255,255,${exDraw.primaryRayStrokeAlphaScale * rayFade})`;
      for (const r of this.primaryRays) {
        const len = r.maxLen * rayEase;
        const x = Math.cos(r.angle) * len;
        const y = Math.sin(r.angle) * len;
        c.lineWidth = r.width;
        c.beginPath();
        c.moveTo(-x * exDraw.primaryRayTailPull, -y * exDraw.primaryRayTailPull);
        c.lineTo(x, y);
        c.stroke();
      }

      // --- 十字の強い一瞬のハイライト（白） ---
      const crossT = Math.min(1, this.elapsedMs / exDraw.crossPhaseMs);
      const crossAlpha =
        (1 - crossT) ** exDraw.crossAlphaExponent * masterFade * exDraw.crossAlphaScale;
      const crossLen = exDraw.crossLenBasePx + exDraw.crossLenFlashScalePx * (1 - crossT);
      c.strokeStyle = `rgba(255,255,255,${crossAlpha})`;
      c.lineWidth = exDraw.crossLineWidthPx;
      c.beginPath();
      c.moveTo(-crossLen, 0);
      c.lineTo(crossLen, 0);
      c.moveTo(0, -crossLen);
      c.lineTo(0, crossLen);
      c.stroke();

      // --- 細い火花ストリーク ---
      for (const s of this.streaks) {
        const dist = s.speed * sec;
        const x0 = Math.cos(s.angle) * dist;
        const y0 = Math.sin(s.angle) * dist;
        const tail = Math.max(0, dist - s.tail);
        const x1 = Math.cos(s.angle) * tail;
        const y1 = Math.sin(s.angle) * tail;
        const streakFade = (1 - Math.min(1, sec / exDraw.streakFadeSec)) * masterFade;
        c.strokeStyle = `rgba(255,255,255,${exDraw.streakStrokeAlphaScale * streakFade})`;
        c.lineWidth = s.width;
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x0, y0);
        c.stroke();
      }

      // --- 破片ドット ---
      c.fillStyle = `rgba(255,255,255,${exDraw.debrisFillAlphaScale * masterFade})`;
      for (const d of this.debris) {
        const dist = d.speed * sec;
        const px = Math.cos(d.angle) * dist;
        const py = Math.sin(d.angle) * dist;
        const dotFade = (1 - Math.min(1, sec / exDraw.debrisFadeSec)) * masterFade;
        c.globalAlpha = dotFade;
        c.beginPath();
        c.arc(px, py, d.size * (1 - t * exDraw.debrisSizeShrinkWithT), 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;

      c.restore();
    };
  };

  onPreUpdate = (_engine: Engine, delta: number): void => {
    this.elapsedMs += delta;
    if (this.elapsedMs >= this.durationMs) {
      this.kill();
    }
  };
}
