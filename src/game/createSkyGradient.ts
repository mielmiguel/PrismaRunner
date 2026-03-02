import * as THREE from 'three'
import { PALETTE } from './constants'

/** Vertical gradient texture for scene.background (top=sky, bottom=horizon) */
export function createSkyGradient(): THREE.CanvasTexture {
  const w = 256
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')!
  const top = new THREE.Color(PALETTE.skyTop)
  const bottom = new THREE.Color(PALETTE.skyBottom)

  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, `#${top.getHexString()}`)
  gradient.addColorStop(1, `#${bottom.getHexString()}`)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}
