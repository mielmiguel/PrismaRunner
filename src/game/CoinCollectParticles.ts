import * as THREE from 'three'
import { PALETTE } from './constants'
import { COIN_COLLECT_PARTICLE_COUNT, COIN_COLLECT_PARTICLE_DURATION_MS } from './constants'
import { createLogger } from '../utils/Logger'

const log = createLogger('CoinCollectParticles')

const PARTICLE_DURATION_S = COIN_COLLECT_PARTICLE_DURATION_MS / 1000
const PARTICLE_RADIUS = 0.08
const PARTICLE_SEGMENTS = 6
const PARTICLE_SPEED_Y = 3
const PARTICLE_SPREAD = 0.4

interface Particle {
  mesh: THREE.Mesh
  life: number
  velocity: THREE.Vector3
}

/**
 * Low-poly gold particles that burst upward from a position and fade out.
 * Call spawn() when a coin is collected; call update(delta) each frame.
 */
export class CoinCollectParticles {
  private readonly scene: THREE.Scene
  private readonly particles: Particle[] = []
  private geometry: THREE.BufferGeometry | null = null
  private material: THREE.Material | null = null

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.geometry = new THREE.SphereGeometry(PARTICLE_RADIUS, PARTICLE_SEGMENTS, 4)
    this.material = new THREE.MeshBasicMaterial({
      color: PALETTE.coinGold,
      transparent: true,
      opacity: 0.95,
    })
  }

  spawn(worldX: number, worldY: number, worldZ: number): void {
    if (!this.geometry || !this.material) return
    for (let i = 0; i < COIN_COLLECT_PARTICLE_COUNT; i++) {
      const mat = this.material.clone()
      const mesh = new THREE.Mesh(this.geometry, mat)
      mesh.position.set(worldX, worldY, worldZ)
      const vx = (Math.random() - 0.5) * PARTICLE_SPREAD
      const vy = 0.8 + Math.random() * 0.6
      const vz = (Math.random() - 0.5) * PARTICLE_SPREAD
      this.particles.push({
        mesh,
        life: PARTICLE_DURATION_S,
        velocity: new THREE.Vector3(vx, vy * PARTICLE_SPEED_Y, vz),
      })
      this.scene.add(mesh)
    }
    log.debug('coin particles spawned', { x: worldX, y: worldY, z: worldZ })
  }

  update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= delta
      p.mesh.position.x += p.velocity.x * delta
      p.mesh.position.y += p.velocity.y * delta
      p.mesh.position.z += p.velocity.z * delta
      const t = 1 - p.life / PARTICLE_DURATION_S
      const opacity = 1 - t
      const scale = 1 - t * 0.5
      p.mesh.scale.setScalar(scale)
      if ((p.mesh.material as THREE.MeshBasicMaterial).opacity !== undefined) {
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, opacity)
      }
      if (p.life <= 0) {
        this.scene.remove(p.mesh)
        ;(p.mesh.material as THREE.Material).dispose()
        this.particles.splice(i, 1)
      }
    }
  }

  dispose(): void {
    for (const p of this.particles) {
      this.scene.remove(p.mesh)
    }
    this.particles.length = 0
    this.geometry?.dispose()
    this.geometry = null
    this.material?.dispose()
    this.material = null
  }
}
