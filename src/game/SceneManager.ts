import * as THREE from 'three'
import { CAMERA_Y, CAMERA_Z, PALETTE } from './constants'
import { createLogger } from '../utils/Logger'
import { createSkyGradient } from './createSkyGradient'

const log = createLogger('SceneManager')

export class SceneManager {
  public readonly scene: THREE.Scene
  public readonly camera: THREE.PerspectiveCamera
  public readonly renderer: THREE.WebGLRenderer
  private readonly canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    this.scene.background = createSkyGradient()

    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
    this.camera.position.set(0, CAMERA_Y, CAMERA_Z)
    this.camera.lookAt(0, 0, -20)

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.handleResize()

    this.setupLights()

    window.addEventListener('resize', () => this.handleResize())

    log.info('initialized', {
      size: { width: window.innerWidth, height: window.innerHeight },
      pixelRatio: this.renderer.getPixelRatio(),
      palette: 'neon-minimal',
    })
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(PALETTE.ambient, 0.5)
    this.scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(PALETTE.directional, 1.0)
    dirLight.position.set(8, 15, 8)
    dirLight.castShadow = false
    this.scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0x6699cc, 0.25)
    fillLight.position.set(-5, 5, -10)
    this.scene.add(fillLight)
  }

  private handleResize(): void {
    const width = this.canvas.clientWidth || window.innerWidth
    const height = this.canvas.clientHeight || window.innerHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    log.info('resize', { width, height })
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
  }
}

