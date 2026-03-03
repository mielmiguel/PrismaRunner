export const LANE_WIDTH = 2
export const CHUNK_LENGTH = 20
export const VISIBLE_CHUNKS = 8

export const BASE_SPEED = 15 // world units per second

// S2 [Frontend] — player movement tuning
export const LANE_SWITCH_DURATION = 0.2 // seconds to move between lanes
export const JUMP_DURATION = 0.6 // total jump time in seconds
export const JUMP_HEIGHT = 3 // approximate jump apex height in world units

// S2 [Frontend] — input
export const SWIPE_MIN_DISTANCE_PX = 40 // minimal swipe length to register

export const CAMERA_Y = 6
export const CAMERA_Z = 10

// S1 [Designer] — neon/minimal palette
export const PALETTE = {
  ground: 0x0d1117,
  gridLine: 0x1f2937,
  railing: 0x22d3ee,
  skyTop: 0x0f172a,
  skyBottom: 0x020617,
  ambient: 0x8899aa,
  directional: 0xe2e8f0,

  // S2 [Designer] — player character palette
  playerWhite: 0xf9fafb,
  playerBlue: 0x38bdf8,
  playerDark: 0x020617,
  playerHat: 0xfacc6b,
} as const

// S2 [Designer] — animation tuning constants
export const RUN_CYCLE_BASE_FREQ = Math.PI * 2 // radians per second at BASE_SPEED
export const RUN_CYCLE_AMP_LEG = (40 * Math.PI) / 180 // leg swing amplitude in radians
export const RUN_CYCLE_AMP_ARM = (30 * Math.PI) / 180 // arm swing amplitude in radians

export const LANE_TILT_MAX_DEG = 15 // max body tilt on lane change (degrees)

export const JUMP_BEND_LEG_ANGLE = (25 * Math.PI) / 180 // how much legs bend at jump apex (radians)
export const JUMP_ARM_RAISE_ANGLE = (20 * Math.PI) / 180 // how much arms lift during jump (radians)
