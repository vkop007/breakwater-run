import { useState } from 'react'
import { VEHICLES } from '../data/vehicles'
import { LOCATIONS, distance } from '../data/district'
import { dispatch } from '../game/core/commands'
import { useAppStore } from '../stores/appStore'
import { useGameStore } from '../stores/gameStore'
import type { VehicleKind } from '../types/game'
import Modal from './Modal'
import GameFeedback from './GameFeedback'

const colors = [{ value: '#e96e40', name: 'Burnt orange' }, { value: '#397c7c', name: 'Sea green' }, { value: '#e2ba58', name: 'Sunflower' }, { value: '#e5dfcb', name: 'Warm ivory' }, { value: '#465d77', name: 'Harbor blue' }]
export default function ServicesPanel({ garage = false }: { garage?: boolean }) {
  const openPanel = useAppStore((state) => state.openPanel)
  const clothingColor = useAppStore((state) => state.character.clothingColor)
  const money = useGameStore((state) => state.money)
  const owned = useGameStore((state) => state.owned)
  const unlocked = useGameStore((state) => state.unlocked)
  const completed = useGameStore((state) => state.completed)
  const discovered = useGameStore((state) => state.discovered)
  const vehicle = useGameStore((state) => state.vehicle)
  const position = useGameStore((state) => state.player.position)
  const health = useGameStore((state) => state.player.health)
  const vehicleColors = useGameStore((state) => state.colors)
  const contact = LOCATIONS.filter((location) => ['home', 'garage', 'shop', 'gas'].includes(location.kind) && distance(position, location.position) < 35).sort((a, b) => distance(position, a.position) - distance(position, b.position))[0]
  const garageOpen = completed.includes('recovery')
  const atGarage = contact?.kind === 'garage'
  const workshop = atGarage && garageOpen
  const repair = workshop || contact?.kind === 'gas'
  const personal = contact?.kind === 'home' || contact?.kind === 'shop'
  const upgraded = discovered.includes('garage-upgrade')
  const [paint, setPaint] = useState(vehicle ? vehicleColors[vehicle.kind] : colors[0].value)
  const [clothing, setClothing] = useState(clothingColor)
  const unavailable = !contact || (garage && !atGarage)
  const locked = atGarage && !garageOpen
  return <Modal title={garage ? 'Give the road something new.' : contact?.kind === 'gas' ? 'Keep the good miles coming.' : 'Ready for another mile.'} eyebrow={contact ? `${contact.name.toUpperCase()} / ${atGarage ? 'IVO’S PLACE' : 'NEIGHBORHOOD SERVICES'}` : 'NEIGHBORHOOD SERVICES'} onClose={() => openPanel(null)} className="services-modal"><div className="services-balance"><span>Cash available</span><strong>${Math.round(money).toLocaleString()}</strong></div>
    {unavailable ? <section className="active-job"><span className="eyebrow">A LITTLE CLOSER FIRST</span><h3>Visit a neighborhood service.</h3><p>{garage ? 'Head to Quayline Garage to browse your rides.' : 'Find repairs at Sunline Service. Visit your apartment or Sunroom Market for health and clothing.'}</p><button className="button-line" onClick={() => openPanel('map')}>Find it on the map <span>↗</span></button></section> : locked ? <section className="active-job"><span className="eyebrow">A FAVOR BEFORE THE KEYS</span><h3>Help Ivo find his missing car.</h3><p>Complete The Missing Car to unlock purchases, paint, upgrades, and your garage.</p><button className="button-line" onClick={() => openPanel('activities')}>See Ivo’s job <span>↗</span></button></section> : <>
      {workshop && <><p className="modal-intro">A compact for the corners, a coupe for the coast, a van for everything else. Bring an owned ride outside when you’re ready to go.</p><div className="garage-vehicles">{(Object.keys(VEHICLES) as VehicleKind[]).map((kind) => { const config = VEHICLES[kind]; const available = unlocked.includes(kind); const purchased = owned.includes(kind); return <article className="garage-vehicle" key={kind}><span className="garage-color" style={{ background: vehicleColors[kind] }} /><div><span className="eyebrow">{kind === 'compact' ? 'CITY COMPACT' : kind === 'coupe' ? 'SPORT COUPE' : 'CARGO VAN'}</span><h3>{config.name}</h3><p>{Math.round(config.maxSpeed * 3.6 * (upgraded && purchased ? 1.1 : 1))} km/h · {purchased ? upgraded ? 'Owned · tuned' : 'In your garage' : `$${config.price.toLocaleString()}`}</p>{!available && <small>Complete Hot Exit to unlock</small>}</div><button className="garage-action" disabled={!available || (!purchased && money < config.price)} onClick={() => dispatch({ type: purchased ? 'select-vehicle' : 'purchase', kind })}>{!available ? 'Locked' : purchased ? 'Bring outside' : 'Buy'} <span>↗</span></button></article> })}</div></>}
      <section className="service-list" aria-label="Available services">
        {repair && <button className="service-row" disabled={money < 150 || vehicle?.health === 100} onClick={() => dispatch({ type: 'service', service: 'repair' })}><span><strong>Repair vehicle</strong><small>{vehicle?.health === 100 ? 'Your current ride is already in full condition.' : 'Park a ride nearby to restore it to full condition.'}</small></span><b>$150 <span>↗</span></b></button>}
        {personal && <button className="service-row" disabled={money < 50 || health >= 100} onClick={() => dispatch({ type: 'service', service: 'health' })}><span><strong>Rest & recover</strong><small>{health >= 100 ? 'You’re already at full health.' : 'Restore your health before heading out.'}</small></span><b>$50 <span>↗</span></b></button>}
        {workshop && <button className="service-row" disabled={money < 600 || upgraded} onClick={() => dispatch({ type: 'service', service: 'upgrade' })}><span><strong>{upgraded ? 'Engine tune installed' : 'Engine tune · one-time upgrade'}</strong><small>{upgraded ? 'Your legal, owned rides have 15% more acceleration and 10% more top speed.' : 'All your legal, owned rides gain 15% acceleration and 10% top speed. Park an owned ride nearby.'}</small></span><b>{upgraded ? 'Installed' : '$600'} {!upgraded && <span>↗</span>}</b></button>}
      </section>
      <div className="service-customizations">{(workshop ? ['paint'] as const : personal ? ['clothes'] as const : []).map((service) => <fieldset key={service}><legend className="field-label">{service === 'paint' ? `FRESH PAINT ${vehicle ? `/ ${vehicle.name.toUpperCase()}` : ''}` : 'A CHANGE OF CLOTHES'}</legend><div className="color-options">{colors.map((color) => <button key={color.value} className={`color-swatch ${(service === 'paint' ? paint : clothing) === color.value ? 'selected' : ''}`} style={{ backgroundColor: color.value }} aria-label={`${service === 'paint' ? 'Paint' : 'Clothes'}: ${color.name}`} aria-pressed={(service === 'paint' ? paint : clothing) === color.value} onClick={() => service === 'paint' ? setPaint(color.value) : setClothing(color.value)}>{(service === 'paint' ? paint : clothing) === color.value && <span>✓</span>}</button>)}</div><button className="button-line" disabled={money < (service === 'paint' ? 100 : 75) || (service === 'clothes' && clothing === clothingColor) || (service === 'paint' && !!vehicle && paint === vehicleColors[vehicle.kind])} onClick={() => dispatch({ type: 'service', service, color: service === 'paint' ? paint : clothing })}>{service === 'paint' ? 'Apply paint · $100' : clothing === clothingColor ? 'Current clothing' : 'Change clothing · $75'} <span>↗</span></button></fieldset>)}</div>
    </>}<GameFeedback /><p className="modal-footnote">{repair ? 'Park a vehicle within reach for repairs. Paint and tuning require a legal ride you own.' : 'Your apartment and Sunroom Market offer health recovery and clothing.'} Services use your in-game cash.</p></Modal>
}
