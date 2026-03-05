import * as THREE from 'three'
import { CHUNK_LENGTH, PALETTE, VISIBLE_CHUNKS } from './constants'
import { createLogger } from '../utils/Logger'
import { createGridTexture } from './createGridTexture'
import {
  createObstacle,
  type ObstacleResult,
  type ObstacleType,
  type LaneIndex,
} from '../models/ObstacleFactory'

const log = createLogger('ChunkGenerator')

const RAILING_HEIGHT = 0.4
const RAILING_WIDTH = 0.12

interface ChunkSlot {
  type: ObstacleType
  lane: LaneIndex
  zOffset: number
  secondLane?: LaneIndex
}

interface ChunkPattern {
  name: string
  slots: ChunkSlot[]
}

const PATTERNS: ChunkPattern[] = [
  { name: 'empty', slots: [] },
  { name: 'tall_center', slots: [{ type: 'tall_block', lane: 0, zOffset: 10 }] },
  { name: 'tall_left', slots: [{ type: 'tall_block', lane: -1, zOffset: 10 }] },
  { name: 'tall_right', slots: [{ type: 'tall_block', lane: 1, zOffset: 10 }] },
  { name: 'low_center', slots: [{ type: 'low_barrier', lane: 0, zOffset: 10 }] },
  { name: 'low_left', slots: [{ type: 'low_barrier', lane: -1, zOffset: 8 }] },
  { name: 'low_right', slots: [{ type: 'low_barrier', lane: 1, zOffset: 10 }] },
  { name: 'wide_left', slots: [{ type: 'wide_block', lane: -1, zOffset: 10, secondLane: 0 }] },
  { name: 'wide_right', slots: [{ type: 'wide_block', lane: 0, zOffset: 10, secondLane: 1 }] },
  { name: 'narrow_pass_left', slots: [{ type: 'tall_block', lane: 1, zOffset: 10 }] },
  { name: 'narrow_pass_right', slots: [{ type: 'tall_block', lane: -1, zOffset: 10 }] },
  { name: 'narrow_pass_center', slots: [{ type: 'low_barrier', lane: 0, zOffset: 10 }] },
  { name: 'two_low', slots: [{ type: 'low_barrier', lane: -1, zOffset: 6 }, { type: 'low_barrier', lane: 1, zOffset: 12 }] },
]

interface ChunkData {
  mesh: THREE.Mesh
  obstacles: ObstacleResult[]
}

export interface ObstacleForCollision {
  object: THREE.Object3D
  type: ObstacleType
  jumpable: boolean
  halfExtents: { x: number; y: number; z: number }
}

export class ChunkGenerator {
  private readonly chunks: ChunkData[] = []
  private readonly scene: THREE.Scene
  private readonly laneWidth: number

  constructor(scene: THREE.Scene, laneWidth: number) {
    this.scene = scene
    this.laneWidth = laneWidth
    this.initChunks()
  }

  private initChunks(): void {
    const totalWidth = this.laneWidth * 3

    const geometry = new THREE.PlaneGeometry(totalWidth, CHUNK_LENGTH)
    geometry.rotateX(-Math.PI / 2)

    const gridTex = createGridTexture()
    const material = new THREE.MeshStandardMaterial({
      color: PALETTE.ground,
      map: gridTex,
      roughness: 0.85,
      metalness: 0.15,
    })

    const railingGeom = new THREE.BoxGeometry(RAILING_WIDTH, RAILING_HEIGHT, CHUNK_LENGTH)
    const railingMat = new THREE.MeshStandardMaterial({
      color: PALETTE.railing,
      roughness: 0.3,
      metalness: 0.6,
      emissive: PALETTE.railing,
      emissiveIntensity: 0.15,
    })

    const leftX = -totalWidth / 2 - RAILING_WIDTH / 2
    const rightX = totalWidth / 2 + RAILING_WIDTH / 2

    for (let i = 0; i < VISIBLE_CHUNKS; i++) {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(0, 0, -i * CHUNK_LENGTH)
      mesh.receiveShadow = true
      this.scene.add(mesh)

      const leftRailing = new THREE.Mesh(railingGeom, railingMat)
      leftRailing.position.set(leftX, RAILING_HEIGHT / 2, 0)
      mesh.add(leftRailing)

      const rightRailing = new THREE.Mesh(railingGeom, railingMat)
      rightRailing.position.set(rightX, RAILING_HEIGHT / 2, 0)
      mesh.add(rightRailing)

      const chunkData: ChunkData = { mesh, obstacles: [] }
      this.chunks.push(chunkData)
      this.spawnPatternForChunk(chunkData)
    }

    log.info('chunks initialized', {
      count: this.chunks.length,
      length: CHUNK_LENGTH,
      railings: true,
    })
  }

  /** Obstacles in chunks that are near camera (for collision). */
  getActiveObstacles(_cameraZ: number): ObstacleForCollision[] {
    const result: ObstacleForCollision[] = []
    for (const { obstacles } of this.chunks) {
      for (const o of obstacles) {
        result.push({
          object: o.object,
          type: o.type,
          jumpable: o.jumpable,
          halfExtents: o.halfExtents,
        })
      }
    }
    return result
  }

  update(deltaTime: number, speed: number, cameraZ: number): void {
    const delta = speed * deltaTime

    let minZ = Number.POSITIVE_INFINITY
    for (const { mesh } of this.chunks) {
      mesh.position.z += delta
      if (mesh.position.z < minZ) {
        minZ = mesh.position.z
      }
    }

    const recycleThreshold = cameraZ + CHUNK_LENGTH

    for (const chunk of this.chunks) {
      const { mesh } = chunk
      if (mesh.position.z - CHUNK_LENGTH * 0.5 > recycleThreshold) {
        const newZ = minZ - CHUNK_LENGTH
        log.debug('recycle chunk', {
          fromZ: mesh.position.z,
          toZ: newZ,
          cameraZ,
        })
        mesh.position.z = newZ
        minZ = newZ

        this.clearChunkObstacles(chunk)
        this.spawnPatternForChunk(chunk)
      }
    }
  }

  private spawnPatternForChunk(chunk: ChunkData): void {
    const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)]
    log.debug('pattern selected: "' + pattern.name + '"')
    for (const slot of pattern.slots) {
      const result = createObstacle(slot.type, slot.lane, slot.zOffset, {
        secondLane: slot.secondLane,
      })
      chunk.mesh.add(result.object)
      chunk.obstacles.push(result)
    }
    if (pattern.slots.length > 0) {
      log.debug('obstacles spawned: ' + pattern.slots.length)
    }
  }

  private clearChunkObstacles(chunk: ChunkData): void {
    for (const o of chunk.obstacles) {
      const obj = o.object
      chunk.mesh.remove(obj)
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh
        m.geometry?.dispose()
        if (m.material) {
          const mat = Array.isArray(m.material) ? m.material : [m.material]
          mat.forEach((mm) => mm.dispose())
        }
      }
    }
    chunk.obstacles.length = 0
  }
}
