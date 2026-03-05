import * as THREE from 'three'
import { LANE_WIDTH, PALETTE } from '../game/constants'

export type ObstacleType = 'tall_block' | 'low_barrier' | 'wide_block'

export interface ObstacleHalfExtents {
  x: number
  y: number
  z: number
}

export interface ObstacleResult {
  object: THREE.Object3D
  type: ObstacleType
  jumpable: boolean
  halfExtents: ObstacleHalfExtents
}

/** Lane index: -1 left, 0 center, 1 right */
export type LaneIndex = -1 | 0 | 1

/**
 * Creates an obstacle of the given type at the given lane position (local to parent chunk).
 * Position: x = lane * LANE_WIDTH, y = halfHeight so base on ground, z = offset along chunk.
 */
export function createObstacle(
  type: ObstacleType,
  lane: LaneIndex,
  zOffsetInChunk: number,
  options?: { secondLane?: LaneIndex },
): ObstacleResult {
  let width: number
  let height: number
  let depth: number
  let jumpable: boolean

  switch (type) {
    case 'tall_block':
      width = LANE_WIDTH * 0.85
      height = 2.2
      depth = LANE_WIDTH * 0.6
      jumpable = false
      break
    case 'low_barrier':
      width = LANE_WIDTH * 0.9
      height = 0.6
      depth = LANE_WIDTH * 0.5
      jumpable = true
      break
    case 'wide_block':
      width = LANE_WIDTH * 2 * 0.9
      height = 1.8
      depth = LANE_WIDTH * 0.6
      jumpable = false
      break
    default:
      width = LANE_WIDTH * 0.9
      height = 1
      depth = LANE_WIDTH * 0.5
      jumpable = false
  }

  const halfExtents: ObstacleHalfExtents = {
    x: width / 2,
    y: height / 2,
    z: depth / 2,
  }

  const geometry = new THREE.BoxGeometry(width, height, depth)
  let color: number
  let emissiveIntensity: number
  switch (type) {
    case 'tall_block':
      color = PALETTE.obstacleTall
      emissiveIntensity = 0.08
      break
    case 'low_barrier':
      color = PALETTE.obstacleLow
      emissiveIntensity = 0.12
      break
    case 'wide_block':
      color = PALETTE.obstacleWide
      emissiveIntensity = 0
      break
    default:
      color = 0x444444
      emissiveIntensity = 0
  }
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: type === 'low_barrier' ? 0.85 : 0.6,
    metalness: type === 'wide_block' ? 0.3 : 0.2,
    emissive: color,
    emissiveIntensity,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true

  const centerX = options?.secondLane != null
    ? (lane + options.secondLane) * 0.5 * LANE_WIDTH
    : lane * LANE_WIDTH
  mesh.position.set(centerX, height / 2, zOffsetInChunk)

  mesh.userData.obstacleType = type
  mesh.userData.jumpable = jumpable
  mesh.userData.halfExtents = halfExtents

  return {
    object: mesh,
    type,
    jumpable,
    halfExtents,
  }
}
