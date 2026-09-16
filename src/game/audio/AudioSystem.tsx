import { useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { runtime } from '../core/runtime'

// All sounds are synthesized locally; there are no external recordings or requests.
export default function AudioSystem() {
  useEffect(() => {
    let context: AudioContext | null = null
    let master: GainNode, effects: GainNode, ambience: GainNode, music: GainNode
    let engine: OscillatorNode, engineGain: GainNode, siren: OscillatorNode, sirenGain: GainNode
    let rainGain: GainNode, cityGain: GainNode, stepAt = 0, beatAt = 0, lastShake = 0
    let lastNotification = 0, beat = 0
    const gain = (destination: AudioNode, volume: number) => {
      const node = context!.createGain(); node.gain.value = volume; node.connect(destination); return node
    }
    const tone = (frequency: number, duration: number, volume: number, output: GainNode, type: OscillatorType = 'sine') => {
      if (!context || context.state !== 'running') return
      const osc = context.createOscillator(), envelope = gain(output, 0), now = context.currentTime
      osc.type = type; osc.frequency.value = frequency; osc.connect(envelope)
      envelope.gain.setValueAtTime(0, now); envelope.gain.linearRampToValueAtTime(volume, now + .015)
      envelope.gain.exponentialRampToValueAtTime(.0001, now + duration)
      osc.start(now); osc.stop(now + duration + .02); osc.onended = () => { osc.disconnect(); envelope.disconnect() }
    }
    const init = () => {
      if (context || typeof AudioContext === 'undefined') return
      context = new AudioContext()
      master = gain(context.destination, 0); effects = gain(master, 0); ambience = gain(master, 0); music = gain(master, 0)
      engine = context.createOscillator(); engine.type = 'sawtooth'; engineGain = gain(effects, 0)
      const engineFilter = context.createBiquadFilter(); engineFilter.frequency.value = 320
      engine.connect(engineFilter).connect(engineGain); engine.start()
      siren = context.createOscillator(); sirenGain = gain(effects, 0); siren.connect(sirenGain); siren.start()
      const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
      const samples = buffer.getChannelData(0)
      let value = 0
      for (let i = 0; i < samples.length; i++) { value = .98 * value + (Math.random() * 2 - 1) * .02; samples[i] = value * 4 }
      const noise = context.createBufferSource(); noise.buffer = buffer; noise.loop = true
      const rain = context.createBiquadFilter(); rain.type = 'highpass'; rain.frequency.value = 550
      rainGain = gain(ambience, 0); noise.connect(rain).connect(rainGain)
      const city = context.createBiquadFilter(); city.frequency.value = 180; cityGain = gain(ambience, .2)
      noise.connect(city).connect(cityGain); noise.start()
    }
    const gesture = (event: Event) => {
      init()
      if (context?.state === 'suspended' && useAppStore.getState().phase === 'playing') void context.resume()
      if (event.type === 'pointerdown' && context && event.target instanceof Element && event.target.closest('button')) tone(620, .07, .035, effects)
    }
    window.addEventListener('pointerdown', gesture); window.addEventListener('keydown', gesture)
    const interval = window.setInterval(() => {
      if (!context) return
      const playing = useAppStore.getState().phase === 'playing' && !document.hidden
      if (!playing) { if (context.state === 'running') void context.suspend(); window.speechSynthesis?.cancel(); return }
      if (context.state !== 'running') { void context.resume(); return }
      const settings = useSettingsStore.getState(), state = useGameStore.getState(), now = context.currentTime
      const set = (param: AudioParam, value: number) => param.setTargetAtTime(value, now, .08)
      set(master.gain, settings.masterVolume); set(effects.gain, settings.effectsVolume); set(ambience.gain, settings.ambienceVolume); set(music.gain, settings.musicVolume)
      const car = runtime.occupied ? runtime.vehicles.get(runtime.occupied) : null
      set(engine.frequency, car ? 38 + Math.abs(car.speed) * 3.4 : 38); set(engineGain.gain, car && car.health > 0 ? .045 : 0)
      const policeDistance = Math.min(250, ...[...runtime.vehicles.values()].filter((v) => v.id.startsWith('police')).map((v) => Math.hypot(v.position[0] - runtime.position[0], v.position[2] - runtime.position[2])))
      set(siren.frequency, 570 + Math.sin(runtime.elapsed * 5) * 170); set(sirenGain.gain, state.wanted.level > 0 ? Math.max(0, 1 - policeDistance / 120) * .045 : 0)
      set(rainGain.gain, state.weather === 'rain' ? .9 : 0)
      const park = runtime.position[0] > 12 && runtime.position[0] < 45 && runtime.position[2] > 12 && runtime.position[2] < 45
      set(cityGain.gain, park ? .08 : .24)
      if (!car && runtime.grounded && runtime.moving !== 'idle' && now > stepAt) {
        tone(100 + Math.random() * 40, .075, .1, effects, 'triangle'); stepAt = now + (runtime.moving === 'sprinting' ? .24 : runtime.moving === 'walking' ? .48 : .32)
      }
      if (runtime.shake > lastShake + .04) tone(65, .22, .22, effects, 'sawtooth')
      lastShake = runtime.shake
      if (car?.brake && Math.abs(car.speed) > 6 && now > stepAt) { tone(650, .12, .025, effects, 'triangle'); stepAt = now + .25 }
      if (now > beatAt && settings.musicVolume > 0) {
        const notes = [130.81, 164.81, 196, 246.94, 146.83, 174.61, 220, 261.63]
        tone(notes[beat++ % notes.length], 1.6, .025, music, 'triangle'); beatAt = now + .65
      }
      for (const n of state.notifications) {
        if (n.id <= lastNotification) continue
        lastNotification = n.id
        if (/^(Mara|Ivo|Remy|Courier):/.test(n.text) && 'speechSynthesis' in window && settings.dialogueVolume > 0 && settings.masterVolume > 0) {
          const speech = new SpeechSynthesisUtterance(n.text.replace(/^[^:]+:\s*/, ''))
          speech.volume = settings.dialogueVolume * settings.masterVolume; speech.rate = .96
          window.speechSynthesis.cancel(); window.speechSynthesis.speak(speech)
        } else if (n.tone === 'success') { tone(523.25, .3, .065, effects); tone(783.99, .55, .035, effects) }
        else if (n.tone === 'warning') tone(185, .18, .045, effects, 'triangle')
      }
    }, 80)
    return () => { clearInterval(interval); window.removeEventListener('pointerdown', gesture); window.removeEventListener('keydown', gesture); window.speechSynthesis?.cancel(); if (context) void context.close() }
  }, [])
  return null
}
