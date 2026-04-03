/**
 * ゲーム全体の数値チューニング。バランスや解像度の変更は主にここを編集する。
 */
export const tuning = {
  /** Excalibur の delta（ミリ秒）を秒に直す除数 */
  msPerSecond: 1000,

  /**
   * 論理解像度（FitScreen 時の設計上の基準サイズ）。
   */
  gameViewport: {
    width: 800,
    height: 600,
  },

  /**
   * {@link LineActor} の既定値（初期位置・物理・軌跡・カメラ）。
   */
  lineActor: {
    /** 先端の初期 X（ワールド座標） */
    initialHeadX: 0,
    /**
     * 基準 Y（ワールド座標）。先端の初期位置とカメラの固定 Y。
     * カメラは X のみ先端に追従し、Y はこの値で固定している。
     */
    baselineWorldY: 300,
    /** カメラが先端より先に見る水平オフセット（px） */
    cameraLookaheadX: 200,

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
} as const;
