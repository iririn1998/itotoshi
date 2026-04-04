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
   * 論理解像度（FitScreen 時の設計上の基準サイズ）。
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
    wallThicknessX: 14,
    /** 上下の壁の間の隙間の高さ（ワールド Y、px） */
    gapHeightPx: 112,
    /** 隙間の中心 Y。通常は {@link tuning.world.baselineY} と揃えて先端の基準線付近に穴を開ける */
    gapCenterWorldY: world.baselineY,
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
  },
} as const;
