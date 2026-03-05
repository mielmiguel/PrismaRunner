import * as THREE from 'three'
import { LANE_WIDTH, PALETTE, COIN_ROTATION_SPEED } from '../game/constants'

/** Lane index: -1 left, 0 center, 1 right (same as ObstacleFactory) */
export type LaneIndex = -1 | 0 | 1

export interface CoinSlot {
  lane: LaneIndex
  zOffset: number
}

export interface CoinFactoryResult {
  mesh: THREE.InstancedMesh
  /** Local positions (relative to chunk parent) for collision/collection. y = coin height. */
  localPositions: { x: number; y: number; z: number }[]
}

const COIN_RADIUS = 0.35
const COIN_HEIGHT = 0.12

/**
 * Creates one InstancedMesh for all coins in a chunk (one draw call).
 * Gold cylinder with emissive; call updateCoinRotation each frame for Y spin.
 */
export function createCoins(slots: CoinSlot[]): CoinFactoryResult {
  if (slots.length === 0) {
    const geometry = new THREE.CylinderGeometry(COIN_RADIUS, COIN_RADIUS, COIN_HEIGHT, 12)
    const material = new THREE.MeshStandardMaterial({
      color: PALETTE.coinGold,
      metalness: 0.7,
      roughness: 0.25,
      emissive: PALETTE.coinEmissive,
      emissiveIntensity: 0.25,
    })
    const mesh = new THREE.InstancedMesh(geometry, material, 0)
    return { mesh, localPositions: [] }
  }

  const geometry = new THREE.CylinderGeometry(COIN_RADIUS, COIN_RADIUS, COIN_HEIGHT, 12)
  const material = new THREE.MeshStandardMaterial({
    color: PALETTE.coinGold,
    metalness: 0.7,
    roughness: 0.25,
    emissive: PALETTE.coinEmissive,
    emissiveIntensity: 0.25,
  })
  const mesh = new THREE.InstancedMesh(geometry, material, slots.length)
  mesh.count = slots.length

  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  const quat = new THREE.Quaternion()
  const scale = new THREE.Vector3(1, 1, 1)
  const localPositions: { x: number; y: number; z: number }[] = []

  for (let i = 0; i < slots.length; i++) {
    const { lane, zOffset } = slots[i]
    const x = lane * LANE_WIDTH
    const y = COIN_HEIGHT / 2
    const z = zOffset
    position.set(x, y, z)
    matrix.identity()
    matrix.compose(position, quat, scale)
    mesh.setMatrixAt(i, matrix)
    localPositions.push({ x, y, z })
  }

  mesh.instanceMatrix.needsUpdate = true
  return { mesh, localPositions }
}

/** Cumulative Y rotation (rad) for visual spin. Store per-chunk and pass here. */
export function updateCoinRotation(mesh: THREE.InstancedMesh, delta: number, rotationY: number): number {
  const nextRotationY = rotationY + delta * COIN_ROTATION_SPEED
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  const quat = new THREE.Quaternion()
  const scale = new THREE.Vector3(1, 1, 1)
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, matrix)
    position.setFromMatrixPosition(matrix)
    quat.setFromEuler(new THREE.Euler(0, nextRotationY, 0))
    matrix.compose(position, quat, scale)
    mesh.setMatrixAt(i, matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
  return nextRotationY
}

/**
 * Hide a single coin instance (e.g. after collection) by setting scale to 0.
 */
export function setCoinInstanceVisible(mesh: THREE.InstancedMesh, index: number, visible: boolean): void {
  const matrix = new THREE.Matrix4()
  mesh.getMatrixAt(index, matrix)
  const position = new THREE.Vector3()
  position.setFromMatrixPosition(matrix)
  matrix.identity()
  matrix.compose(
    position,
    new THREE.Quaternion(),
    new THREE.Vector3(visible ? 1 : 0, visible ? 1 : 0, visible ? 1 : 0),
  )
  mesh.setMatrixAt(index, matrix)
  mesh.instanceMatrix.needsUpdate = true
}
