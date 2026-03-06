export const LANE_WIDTH = 2
export const CHUNK_LENGTH = 20
export const VISIBLE_CHUNKS = 8

export const BASE_SPEED = 15 // world units per second
export const MAX_SPEED = 40
/** Speed increase per 10 seconds (world units/s). currentSpeed = min(BASE + elapsed/10 * SPEED_RAMP_PER_10S, MAX) */
export const SPEED_RAMP_PER_10S = 0.5

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

  // S3 [Designer] — obstacles
  obstacleTall: 0xc53030,
  obstacleLow: 0xeab308,
  obstacleWide: 0x1e293b,

  // S4 [Designer] — coins & multiplier
  coinGold: 0xe5b318,
  coinEmissive: 0xcc9900,
  multiplierBase: 0xa78bfa,
  multiplierEmissive: 0x8b5cf6,
} as const

// S6 [Designer] — skin colors (Runner, Tank, Slim, Cube)
export const SKIN_COLORS = {
  runner: 0x38bdf8,
  tank: 0xef4444,
  slim: 0x22c55e,
  cube: 0xa78bfa,
} as const

// S2 [Designer] — animation tuning constants
export const RUN_CYCLE_BASE_FREQ = Math.PI * 2 // radians per second at BASE_SPEED
export const RUN_CYCLE_AMP_LEG = (40 * Math.PI) / 180 // leg swing amplitude in radians
export const RUN_CYCLE_AMP_ARM = (30 * Math.PI) / 180 // arm swing amplitude in radians

export const LANE_TILT_MAX_DEG = 15 // max body tilt on lane change (degrees)

export const JUMP_BEND_LEG_ANGLE = (25 * Math.PI) / 180 // how much legs bend at jump apex (radians)
export const JUMP_ARM_RAISE_ANGLE = (20 * Math.PI) / 180 // how much arms lift during jump (radians)

// S3 [Frontend] — game over
export const GAME_OVER_CRASH_DELAY_MS = 800 // delay before showing game over after collision

// S3 [Frontend] — player AABB for collision (half-extents from center)
export const PLAYER_AABB_HALF_X = 0.5
export const PLAYER_AABB_HALF_Y = 1.2
export const PLAYER_AABB_HALF_Z = 0.25

// S4 [Frontend] — coins & multiplier
export const COIN_POINTS = 10
export const COIN_COLLECT_RADIUS = 1.2 // distance for pickup (XZ plane)
export const MULTIPLIER_DURATION_S = 10
export const MULTIPLIER_FACTOR = 2
export const BEST_SCORE_KEY = 'prismarunner_best_score'
export const SKIN_STORAGE_KEY = 'prismarunner_skin'

// S4 [Designer] — visual tuning
export const COIN_ROTATION_SPEED = Math.PI * 0.8 // rad/s
export const MULTIPLIER_PULSE_SPEED = Math.PI * 1.5
export const MULTIPLIER_PULSE_SCALE_MIN = 0.92
export const MULTIPLIER_PULSE_SCALE_MAX = 1.08
export const MULTIPLIER_EMISSIVE_INTENSITY_MIN = 0.2
export const MULTIPLIER_EMISSIVE_INTENSITY_MAX = 0.6
export const PICKUP_PULSE_DURATION_MS = 200
export const COIN_COLLECT_PARTICLE_DURATION_MS = 500
export const COIN_COLLECT_PARTICLE_COUNT = 6
