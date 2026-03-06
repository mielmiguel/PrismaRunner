import * as THREE from 'three'
import { createLogger } from '../utils/Logger'
import { buildPreviewModel } from './SkinFactory'
import type { PlayerSkinId } from './SkinFactory'

const log = createLogger('SkinPreview')

const PREVIEW_SIZE = 80
const ROTATION_SPEED = 0.3 // rad/s

interface PreviewInstance {
  canvas: HTMLCanvasElement
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  model: THREE.Group
  rafId: number
}

const instances: PreviewInstance[] = []

function createPreview(skinId: PlayerSkinId, container: HTMLElement): PreviewInstance | null {
  const canvas = document.createElement('canvas')
  canvas.width = PREVIEW_SIZE
  canvas.height = PREVIEW_SIZE
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.display = 'block'
  canvas.style.borderRadius = '8px'

  container.innerHTML = ''
  container.appendChild(canvas)
  container.classList.remove('skin-card-preview--placeholder')

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1f2937)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 1.5, 3)
  camera.lookAt(0, 1, 0)

  const ambient = new THREE.AmbientLight(0x8899aa, 0.8)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xe2e8f0, 0.6)
  dir.position.set(2, 3, 2)
  scene.add(dir)

  const model = buildPreviewModel(skinId)
  model.position.set(0, 0, 0)
  scene.add(model)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setSize(PREVIEW_SIZE, PREVIEW_SIZE)
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))

  let rafId = 0
  const animate = () => {
    rafId = requestAnimationFrame(animate)
    model.rotation.y += ROTATION_SPEED * 0.016
    renderer.render(scene, camera)
  }
  animate()

  return { canvas, scene, camera, renderer, model, rafId }
}

export function initSkinPreviews(skinGrid: HTMLElement): void {
  const cards = skinGrid.querySelectorAll<HTMLElement>('.skin-card')
  const ids: PlayerSkinId[] = ['runner', 'tank', 'slim', 'cube']

  disposeSkinPreviews()

  cards.forEach((card, i) => {
    const skinId = ids[i]
    const previewEl = card.querySelector<HTMLElement>('.skin-card-preview')
    if (!previewEl || !skinId) return

    const inst = createPreview(skinId, previewEl)
    if (inst) instances.push(inst)
  })

  log.debug('skin previews initialized', { count: instances.length })
}

export function disposeSkinPreviews(): void {
  for (const inst of instances) {
    cancelAnimationFrame(inst.rafId)
    inst.renderer.dispose()
    inst.model.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh
        m.geometry?.dispose()
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose())
        } else {
          m.material?.dispose()
        }
      }
    })
  }
  instances.length = 0
}
