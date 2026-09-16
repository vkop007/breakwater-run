export type Phase = 'loading' | 'menu' | 'setup' | 'playing' | 'paused'
export type Panel = 'settings' | 'controls' | 'credits' | 'map' | 'activities' | 'garage' | 'shop' | null
export type Quality = 'low' | 'medium' | 'high'
export type Viewpoint = 'harbor' | 'street' | 'overlook'
export type CharacterPreset = 'courier' | 'local' | 'roamer'
export interface Character {
  name: string
  preset: CharacterPreset
  clothingColor: string
  vehicleColor: string
}
export interface Settings {
  quality: Quality
  resolutionScale: number
  uiScale: number
  cameraSensitivity: number
  reducedMotion: boolean
  masterVolume: number
  effectsVolume: number
  ambienceVolume: number
  musicVolume: number
  dialogueVolume: number
  subtitles: boolean
  screenShake: boolean
}
