#!/usr/bin/env node
/**
 * S7 [Designer] — generates minimal valid placeholder audio files.
 * Replace with real royalty-free assets from OpenGameArt, Freesound, Pixabay.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const AUDIO = join(ROOT, 'public', 'audio')
const SFX = join(AUDIO, 'sfx')

// Minimal valid WAV: 44.1kHz mono 16-bit, 0.1 sec silence
function createMinimalWav() {
  const sampleRate = 44100
  const numSamples = Math.floor(sampleRate * 0.1)
  const dataSize = numSamples * 2
  const buf = Buffer.alloc(44 + dataSize)
  let o = 0
  const w = (bytes) => { buf.set(bytes, o); o += bytes.length }
  w([0x52, 0x49, 0x46, 0x46]) // RIFF
  buf.writeUInt32LE(36 + dataSize, o); o += 4
  w([0x57, 0x41, 0x56, 0x45]) // WAVE
  w([0x66, 0x6d, 0x74, 0x20]) // fmt 
  buf.writeUInt32LE(16, o); o += 4
  buf.writeUInt16LE(1, o); o += 2   // PCM
  buf.writeUInt16LE(1, o); o += 2   // mono
  buf.writeUInt32LE(sampleRate, o); o += 4
  buf.writeUInt32LE(sampleRate * 2, o); o += 4
  buf.writeUInt16LE(2, o); o += 2
  buf.writeUInt16LE(16, o); o += 2
  w([0x64, 0x61, 0x74, 0x61]) // data
  buf.writeUInt32LE(dataSize, o); o += 4
  return buf
}

const wav = createMinimalWav()

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true })
}

ensureDir(SFX)

const files = [
  { dir: AUDIO, name: 'music' },
  { dir: SFX, name: 'jump' },
  { dir: SFX, name: 'coin' },
  { dir: SFX, name: 'multiplier' },
  { dir: SFX, name: 'crash' },
  { dir: SFX, name: 'ui_click' },
]

for (const { dir, name } of files) {
  writeFileSync(join(dir, `${name}.wav`), wav)
}

console.log('Generated placeholder audio (.wav). Replace with real .mp3+.ogg from OpenGameArt/Freesound.')
