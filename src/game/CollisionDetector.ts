import * as THREE from 'three'
import { createLogger } from '../utils/Logger'
import {
  PLAYER_AABB_HALF_X,
  PLAYER_AABB_HALF_Y,
  PLAYER_AABB_HALF_Z,
} from './constants'
import type { ObstacleForCollision } from './ChunkGenerator'

const log = createLogger('CollisionDetector')

const _playerMin = new THREE.Vector3()
const _playerMax = new THREE.Vector3()
const _obstacleCenter = new THREE.Vector3()
const _obstacleMin = new THREE.Vector3()
const _obstacleMax = new THREE.Vector3()

/**
 * AABB check: player box vs each obstacle. For jumpable obstacles, no collision if player center Y is above obstacle top.
 * Returns true if any collision detected and logs it.
 */
export function checkCollision(
  playerX: number,
  playerY: number,
  playerZ: number,
  obstacles: ObstacleForCollision[],
): boolean {
  _playerMin.set(
    playerX - PLAYER_AABB_HALF_X,
    playerY - PLAYER_AABB_HALF_Y,
    playerZ - PLAYER_AABB_HALF_Z,
  )
  _playerMax.set(
    playerX + PLAYER_AABB_HALF_X,
    playerY + PLAYER_AABB_HALF_Y,
    playerZ + PLAYER_AABB_HALF_Z,
  )

  for (const obs of obstacles) {
    obs.object.getWorldPosition(_obstacleCenter)
    const h = obs.halfExtents
    _obstacleMin.set(
      _obstacleCenter.x - h.x,
      _obstacleCenter.y - h.y,
      _obstacleCenter.z - h.z,
    )
    _obstacleMax.set(
      _obstacleCenter.x + h.x,
      _obstacleCenter.y + h.y,
      _obstacleCenter.z + h.z,
    )

    if (obs.jumpable) {
      if (playerY > _obstacleMax.y) {
        continue
      }
    }

    const overlap =
      _playerMin.x <= _obstacleMax.x &&
      _playerMax.x >= _obstacleMin.x &&
      _playerMin.y <= _obstacleMax.y &&
      _playerMax.y >= _obstacleMin.y &&
      _playerMin.z <= _obstacleMax.z &&
      _playerMax.z >= _obstacleMin.z

    if (overlap) {
      log.info(
        `collision detected: player(${playerX.toFixed(2)}, ${playerY.toFixed(2)}, ${playerZ.toFixed(2)}) vs obstacle(${_obstacleCenter.x.toFixed(2)}, ${_obstacleCenter.y.toFixed(2)}, ${_obstacleCenter.z.toFixed(2)}, ${obs.type})`,
      )
      return true
    }
  }
  return false
}
