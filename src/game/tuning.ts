/**
 * ゲーム全体の数値チューニング。バランスや解像度の変更は主にここを編集する。
 */
const world = {
  /**
   * 基準 Y（ワールド座標）。先端の初期位置と {@link tuning.camera} の固定 Y で共有。
   */
  baselineY: 300,
} as const;

export const tuning = {
  /** Excalibur の delta（ミリ秒）を秒に直す除数 */
  msPerSecond: 1000,

  /**
   * 論理解像度（エンジン内部座標系の基準サイズ）。
   * 表示は FitContainer ＋ style.css の `--game-ar-w` / `--game-ar-h` と揃えること。
   */
  gameViewport: {
    width: 480,
    height: 600,
  },

  world,

  /**
   * {@link FollowCameraActor} がシーンカメラに適用する追従ルール。
   */
  camera: {
    /** 追従対象の先端より先に見る水平オフセット（px） */
    lookaheadX: 120,
    /** カメラの固定 Y（ワールド座標）。X のみ追従する */
    fixedWorldY: world.baselineY,
  },

  /**
   * {@link LineActor} の既定値（初期位置・物理・軌跡）。
   */
  lineActor: {
    /** 先端の初期 X（ワールド座標） */
    initialHeadX: 0,
    /** 先端の初期 Y（ワールド座標）。通常は {@link tuning.world.baselineY} と同じ */
    baselineWorldY: world.baselineY,

    initialVelocityX: 150,
    initialVelocityY: 0,

    gravity: 800,
    /** クリック／スペース中の上向き加速度（px/s²） */
    liftAcceleration: 2600,
    /** 上方向への最大速度（px/s）。y 正は下なので、これ以上は上に速くならない */
    maxAscendVy: -480,

    /** 軌跡線の太さ（px） */
    lineWidth: 1,
    /**
     * 保持する軌跡点の上限。長時間プレイでもメモリと描画ループが線形に伸びないようにする。
     */
    maxTrailPoints: 6000,
    /**
     * ビューポート境界に足す余白（px）。カメラの viewport より外側に完全に出たセグメントだけ先頭から捨てる。
     */
    trailViewportMargin: 64,
  },

  /**
   * 糸が通る隙間（上下の壁）を一定間隔で出現させるゲート。
   */
  threadHoles: {
    /** 新しいゲートを追加する間隔（ミリ秒） */
    spawnIntervalMs: 2200,
    /**
     * カメラビューポート右端（ワールド X）よりさらに右へずらす量（px）。
     * ゲートの左端 = viewport.right + この値（正なら常に右側の画面外）。
     */
    spawnBeyondViewportRightPx: 48,
    /** 壁の太さ（ワールド X 方向の幅） */
    wallThicknessX: 8,
    /** 上下の壁の間の隙間の高さ（ワールド Y、px） */
    gapHeightPx: 64,
    /** 隙間の中心 Y の基準。通常は {@link tuning.world.baselineY} と揃える */
    gapCenterWorldY: world.baselineY,
    /**
     * 各ゲート生成時に基準 Y へ加えるランダムオフセットの最大絶対値（px）。
     * 実際の中心は画面内に隙間全体が収まるようクランプされる。
     */
    gapCenterRandomOffsetMaxPx: 96,
    /** 画面外判定でビューポート左端からさらに左へ足す余白（ワールド px） */
    cullMarginWorldPx: 64,
    /**
     * 当たり判定で壁 AABB を膨らませる量（px）。{@link tuning.lineActor.lineWidth} の半分に加算する。
     */
    hitInflationPx: 2,
    /** 隙間を一度通過したときに加算するスコア */
    scorePerGapPass: 1,
  },

  /**
   * 壁接触でゲームオーバーになった位置の爆発演出（色は白系のみ）。
   */
  hitExplosion: {
    durationMs: 620,
    /** 細い火花ストリーク本数 */
    sparkStreakCount: 36,
    /** 小さな破片ドット数 */
    debrisCount: 28,
    /** ストリーク速度（px/s）レンジ */
    sparkSpeedMin: 120,
    sparkSpeedMax: 340,
    /** ショックリングの最大半径（px） */
    ringMaxRadiusPx: 72,
    /** 遅れて広がるリングの本数 */
    ringWaveCount: 4,
    /** リング波と波の間隔（ms） */
    ringWaveStaggerMs: 48,

    /** 火花ストリークの長さ・太さ（生成時） */
    streak: {
      tailMinPx: 10,
      tailJitterPx: 22,
      /** 隣接ストリーク間隔に対する角度ジッターの半幅（0〜1） */
      angleJitterHalfSpan: 0.5,
      thickProbability: 0.25,
      widthThickPx: 2.2,
      widthThinPx: 1.1,
    },
    /** 破片ドット（生成時） */
    debris: {
      speedBasePxPerSec: 40,
      /** {@link tuning.hitExplosion.sparkSpeedMax} に掛けて速度上限を作る係数 */
      speedSparkMaxFactor: 0.55,
      sizeMinPx: 1.2,
      sizeJitterPx: 2.4,
    },
    /** 太い主軸レイ（スターバースト、生成時） */
    primaryRays: {
      count: 10,
      angleJitterRad: 0.12,
      lenMinPx: 28,
      lenMaxPx: 38,
      widthWidePx: 3,
      widthNarrowPx: 2,
    },
    /** 壁接触爆発の Canvas 描画（グラデーション・減衰タイミング） */
    draw: {
      masterFadeCutoff: 0.02,

      glowRadiusEaseMin: 0.35,
      glowRadiusEaseMax: 0.85,
      glowCenterAlpha: 0.22,
      glowMidStop: 0.35,
      glowMidAlpha: 0.08,

      flashPhaseMs: 95,
      coreRadiusBasePx: 3,
      coreRadiusFlashScalePx: 42,
      coreRadiusExponent: 1.8,
      coreAlphaCenter: 0.98,
      coreStop1: 0.2,
      coreAlpha1: 0.55,
      coreStop2: 0.55,
      coreAlpha2: 0.12,

      ringInnerMinPx: 6,
      ringWaveDurationFactor: 0.72,
      ringAlphaExponent: 1.15,
      ringStrokeAlphaScale: 0.92,
      ringStrokeWidthPrimaryPx: 3,
      ringStrokeWidthSecondaryPx: 2,

      primaryRayExpandSec: 0.14,
      primaryRayFadeSec: 0.32,
      primaryRayStrokeAlphaScale: 0.95,
      primaryRayTailPull: 0.08,

      crossPhaseMs: 70,
      crossAlphaExponent: 2,
      crossAlphaScale: 0.75,
      crossLenBasePx: 8,
      crossLenFlashScalePx: 52,
      crossLineWidthPx: 2.5,

      streakStrokeAlphaScale: 0.88,
      streakFadeSec: 0.45,

      debrisFillAlphaScale: 0.9,
      debrisFadeSec: 0.5,
      debrisSizeShrinkWithT: 0.35,
    },
  },
} as const;
