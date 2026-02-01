import {trait} from 'koota'

/** Ball camera settings */
export const BallCameraConfig = trait(() => ({
  /** Whether ball cam is enabled */
  enabled: true,
  /** Distance behind car */
  distance: 8,
  /** Height above car */
  height: 3,
  /** How fast camera follows car position */
  followSmoothing: 5,
  /** How fast camera looks toward ball */
  lookSmoothing: 8,
  /** Field of view */
  fov: 110,
  /** Minimum distance to ball before camera pulls back */
  minBallDistance: 10,
}))

/** Ball camera runtime state */
export const BallCameraState = trait(() => ({
  /** Smoothed camera position */
  positionX: 0,
  positionY: 5,
  positionZ: -10,
  /** Smoothed look-at position */
  lookAtX: 0,
  lookAtY: 1,
  lookAtZ: 0,
  /** Current yaw from car direction (for car cam mode) */
  yaw: 0,
}))

/** Tag for ball camera entity */
export const IsBallCamera = trait()
