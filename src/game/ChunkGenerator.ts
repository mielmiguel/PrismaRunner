import * as THREE from 'three'
import { CHUNK_LENGTH, PALETTE, VISIBLE_CHUNKS } from './constants'
import { createLogger } from '../utils/Logger'
import { createGridTexture } from './createGridTexture'

const log = createLogger('ChunkGenerator')

const RAILING_HEIGHT = 0.4
const RAILING_WIDTH = 0.12

export class ChunkGenerator {
  private readonly chunks: THREE.Mesh[] = []
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
      this.chunks.push(mesh)

      const leftRailing = new THREE.Mesh(railingGeom, railingMat)
      leftRailing.position.set(leftX, RAILING_HEIGHT / 2, 0)
      mesh.add(leftRailing)

      const rightRailing = new THREE.Mesh(railingGeom, railingMat)
      rightRailing.position.set(rightX, RAILING_HEIGHT / 2, 0)
      mesh.add(rightRailing)
    }

    log.info('chunks initialized', {
      count: this.chunks.length,
      length: CHUNK_LENGTH,
      railings: true,
    })
  }

  update(deltaTime: number, speed: number, cameraZ: number): void {
    const delta = speed * deltaTime

    let minZ = Number.POSITIVE_INFINITY
    for (const chunk of this.chunks) {
      chunk.position.z += delta
      if (chunk.position.z < minZ) {
        minZ = chunk.position.z
      }
    }

    const recycleThreshold = cameraZ + CHUNK_LENGTH

    for (const chunk of this.chunks) {
      if (chunk.position.z - CHUNK_LENGTH * 0.5 > recycleThreshold) {
        const newZ = minZ - CHUNK_LENGTH
        log.debug('recycle chunk', {
          fromZ: chunk.position.z,
          toZ: newZ,
          cameraZ,
        })
        chunk.position.z = newZ
        minZ = newZ
      }
    }
  }
}

