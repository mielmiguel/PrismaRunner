import * as THREE from 'three'
import { PALETTE } from './constants'

/** Procedural grid texture for track — stripes along Z create motion feel */
export function createGridTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')!
  const r = (c: number) => ((c >> 16) & 0xff) / 255
  const g = (c: number) => ((c >> 8) & 0xff) / 255
  const b = (c: number) => (c & 0xff) / 255

  ctx.fillStyle = `rgb(${Math.floor(r(PALETTE.ground) * 255)},${Math.floor(g(PALETTE.ground) * 255)},${Math.floor(b(PALETTE.ground) * 255)})`
  ctx.fillRect(0, 0, size, size)

  const lineColor = `rgb(${Math.floor(r(PALETTE.gridLine) * 255)},${Math.floor(g(PALETTE.gridLine) * 255)},${Math.floor(b(PALETTE.gridLine) * 255)})`
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 1

  const step = 16
  for (let i = 0; i <= size; i += step) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 8) // more repeats along Z (V) for motion stripes
  tex.needsUpdate = true
  return tex
}
