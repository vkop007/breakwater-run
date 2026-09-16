import { useRef, useState, type MouseEvent } from 'react'
import { CHUNK_SIZE, LOCATIONS, distance } from '../data/district'
import { MISSIONS } from '../data/missions'
import { dispatch } from '../game/core/commands'
import { useAppStore } from '../stores/appStore'
import { useGameStore } from '../stores/gameStore'
import Modal from './Modal'

const roads = [-2, -1, 0, 1, 2].map((n) => n * CHUNK_SIZE)
const symbols: Record<string, string> = { home: 'H', garage: 'G', shop: '+', gas: 'S', park: 'P', race: 'R', mission: '!' }
function DistrictMap({ full = false, zoom = 1 }: { full?: boolean; zoom?: number }) {
  const player = useGameStore((state) => state.player)
  const mission = useGameStore((state) => state.mission)
  const waypoint = useGameStore((state) => state.waypoint)
  const wanted = useGameStore((state) => state.wanted)
  const discovered = useGameStore((state) => state.discovered)
  const rotate = useGameStore((state) => state.mapRotate)
  const group = useRef<SVGGElement>(null)
  const radius = full ? 250 / zoom : 90
  const center = full && zoom === 1 ? [0, 0] : [player.position[0], player.position[2]]
  const objective = mission?.status === 'active' ? MISSIONS[mission.id].objectives[mission.step] : null
  const angle = rotate ? player.heading * 180 / Math.PI - 180 : 0
  const setWaypoint = (event: MouseEvent<SVGSVGElement>) => {
    const matrix = group.current?.getScreenCTM()
    if (!full || !matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    dispatch({ type: 'waypoint', position: [Math.max(-238, Math.min(238, point.x)), 0, Math.max(-238, Math.min(238, point.y))] })
  }
  return <svg className={`district-map ${full ? 'full-map' : 'mini-map'}`} viewBox={`${center[0] - radius} ${center[1] - radius} ${radius * 2} ${radius * 2}`} role="img" aria-label={full ? 'Map of Lantern Quay. Click to set a waypoint, or use the landmark buttons below.' : 'Nearby streets, player, landmarks, and destination'} onClick={setWaypoint}>
    <rect x={-800} y={-800} width={1600} height={1600} fill="#accac0" />
    <g ref={group} transform={`rotate(${angle} ${center[0]} ${center[1]})`}>
      <rect x={-240} y={-240} width={480} height={480} fill="#e7e7d4" />
      {roads.map((x) => <g key={x}><rect x={x - 9} y={-240} width={18} height={480} fill="#bbc4b6" /><rect x={-240} y={x - 9} width={480} height={18} fill="#bbc4b6" /><path d={`M ${x},-240 V 240 M -240,${x} H 240`} fill="none" stroke="#edf0df" strokeWidth=".7" strokeDasharray="3 5" /></g>)}
      {roads.flatMap((x) => roads.map((z) => <rect key={`${x}:${z}`} x={x + 17} y={z + 15} width={44} height={48} rx={2} fill={x === 0 && z === 0 ? '#b9ce9d' : '#d5dac5'} />))}
      <path d="M -235,225 H 225 V -235" stroke="#6f9a96" strokeWidth={3} fill="none" />
      {wanted.state === 'search' && <circle cx={wanted.lastKnown[0]} cy={wanted.lastKnown[2]} r={48} fill="#c9574530" stroke="#ad5347" strokeWidth={1} strokeDasharray="4 3" />}
      {waypoint && <><path d={`M ${player.position[0]},${player.position[2]} L ${waypoint[0]},${waypoint[2]}`} stroke="#b86440" strokeWidth={1} strokeDasharray="3 3" /><path d={`M ${waypoint[0]},${waypoint[2] - 5} l 5,5 -5,5 -5,-5 Z`} fill="#ec774b" stroke="#7c3e2d" strokeWidth={1} /></>}
      {LOCATIONS.map((place) => <g key={place.id} transform={`translate(${place.position[0]} ${place.position[2]}) rotate(${-angle})`} opacity={discovered.includes(place.id) ? 1 : .55}><circle r={full ? 8 : 4.5} fill={place.color} stroke="#214f48" strokeWidth={.8} /><text y={full ? 3 : 1.8} textAnchor="middle" fontSize={full ? 9 : 5} fontFamily="sans-serif" fontWeight="bold" fill="#173d36">{symbols[place.kind]}</text><title>{place.name}{discovered.includes(place.id) ? '' : ' · undiscovered'}</title></g>)}
      {objective && objective.kind !== 'escape' && <g transform={`translate(${objective.target[0]} ${objective.target[2]})`}><circle r={8} fill="none" stroke="#a96917" strokeWidth={2} /><circle r={3} fill="#f4c767" /><title>{objective.text}</title></g>}
      <g transform={`translate(${player.position[0]} ${player.position[2]}) rotate(${180 - player.heading * 180 / Math.PI})`}><circle r={6} fill="#f7f3e7" opacity=".8" /><path d="M 0,-6 L 4.5,5 0,3 -4.5,5 Z" fill="#163e39" stroke="#fff9ea" strokeWidth={1} /><title>Your position</title></g>
    </g>
  </svg>
}
export function MiniMap() {
  const openPanel = useAppStore((state) => state.openPanel)
  const waypoint = useGameStore((state) => state.waypoint)
  const position = useGameStore((state) => state.player.position)
  return <button className="minimap-button" onClick={() => openPanel('map')} aria-label="Open district map"><DistrictMap /><span className="minimap-caption"><strong>LANTERN QUAY</strong><span>{waypoint ? `${Math.round(distance(position, waypoint))} m` : 'Map'} <kbd>M</kbd></span></span></button>
}
export default function MapPanel() {
  const openPanel = useAppStore((state) => state.openPanel)
  const mapRotate = useGameStore((state) => state.mapRotate)
  const setMapRotate = useGameStore((state) => state.setMapRotate)
  const discovered = useGameStore((state) => state.discovered)
  const [zoom, setZoom] = useState(1)
  const [destination, setDestination] = useState('')
  return <Modal title="Find your own way." eyebrow="PORT SOLARA / DISTRICT MAP" onClose={() => openPanel(null)} className="map-modal"><div className="map-toolbar"><p>Click a street to mark your next stop.</p><div className="map-tools"><button aria-label="Zoom out map" disabled={zoom === 1} onClick={() => setZoom(1)}>−</button><span>{zoom}×</span><button aria-label="Zoom in map" disabled={zoom === 2} onClick={() => setZoom(2)}>+</button><button aria-pressed={mapRotate} onClick={() => setMapRotate(!mapRotate)}>{mapRotate ? 'Heading up' : 'North up'}</button></div></div><div className="map-content"><div><DistrictMap full zoom={zoom} /><div className="map-legend"><span><i className="legend-player" /> You</span><span><i className="legend-objective" /> Objective</span><span><i className="legend-waypoint" /> Waypoint</span><span><i className="legend-search" /> Police search</span></div></div><div className="map-landmarks" aria-label="Landmark destinations">{LOCATIONS.map((location) => <button key={location.id} onClick={() => { dispatch({ type: 'waypoint', position: location.position }); setDestination(location.name) }}><span className="landmark-symbol" style={{ background: location.color }}>{symbols[location.kind]}</span><span><strong>{location.name}</strong><small>{discovered.includes(location.id) ? 'Discovered' : 'Explore this location'}</small></span><span aria-hidden="true">↗</span></button>)}</div></div><p className="modal-footnote" role="status">{destination ? `Waypoint set to ${destination}.` : 'Your map marks contacts and services. Discover each place by visiting it.'}</p></Modal>
}
