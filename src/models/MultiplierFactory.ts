import * as THREE from 'three'
import {
  LANE_WIDTH,
  PALETTE,
  MULTIPLIER_PULSE_SPEED,
  MULTIPLIER_PULSE_SCALE_MIN,
  MULTIPLIER_PULSE_SCALE_MAX,
  MULTIPLIER_EMISSIVE_INTENSITY_MIN,
  MULTIPLIER_EMISSIVE_INTENSITY_MAX,
} from '../game/constants'
import { createLogger } from '../utils/Logger'

const log = createLogger('MultiplierFactory')

/** Lane index: -1 left, 0 center, 1 right */
export type LaneIndex = -1 | 0 | 1

export interface MultiplierPickupResult {
  /** Root group; position set by caller (e.g. lane * LANE_WIDTH, height/2, zOffset). */
  group: THREE.Group
  /** Call each frame to animate pulse (scale + emissive). */
  update(delta: number): void
}

const CRYSTAL_HEIGHT = 0.7
const CRYSTAL_RADIUS = 0.35

/**
 * Creates a single multiplier pickup (crystal/star) with pulsing glow.
 * Add group to chunk and set position; call update(delta) each frame.
 */
export function createMultiplierPickup(): MultiplierPickupResult {
  const group = new THREE.Group()
  group.name = 'MultiplierPickup'

  const material = new THREE.MeshStandardMaterial({
    color: PALETTE.multiplierBase,
    metalness: 0.4,
    roughness: 0.35,
    emissive: PALETTE.multiplierEmissive,
    emissiveIntensity: MULTIPLIER_EMISSIVE_INTENSITY_MIN,
  })

  const cone = new THREE.ConeGeometry(CRYSTAL_RADIUS, CRYSTAL_HEIGHT, 4)
  const mesh = new THREE.Mesh(cone, material)
  mesh.rotation.x = Math.PI
  mesh.position.y = CRYSTAL_HEIGHT / 2
  mesh.castShadow = true
  group.add(mesh)

  const tip = new THREE.ConeGeometry(CRYSTAL_RADIUS * 0.6, CRYSTAL_HEIGHT * 0.5, 4)
  const tipMesh = new THREE.Mesh(tip, material)
  tipMesh.rotation.x = Math.PI
  tipMesh.position.y = CRYSTAL_HEIGHT * 0.75
  group.add(tipMesh)

  let pulsePhase = 0

  function update(delta: number): void {
    pulsePhase += delta * MULTIPLIER_PULSE_SPEED
    const t = 0.5 + 0.5 * Math.sin(pulsePhase)
    const scale =
      MULTIPLIER_PULSE_SCALE_MIN + t * (MULTIPLIER_PULSE_SCALE_MAX - MULTIPLIER_PULSE_SCALE_MIN)
    group.scale.setScalar(scale)
    material.emissiveIntensity =
      MULTIPLIER_EMISSIVE_INTENSITY_MIN +
      t * (MULTIPLIER_EMISSIVE_INTENSITY_MAX - MULTIPLIER_EMISSIVE_INTENSITY_MIN)
  }

  log.debug('multiplier pickup created')
  return { group, update }
}

/** Local position (relative to chunk) for collection check. */
export function getMultiplierLocalPosition(lane: LaneIndex, zOffset: number): { x: number; y: number; z: number } {
  return {
    x: lane * LANE_WIDTH,
    y: CRYSTAL_HEIGHT / 2,
    z: zOffset,
  }
}
