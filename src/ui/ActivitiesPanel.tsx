import { MISSIONS } from '../data/missions'
import { LOCATIONS, distance } from '../data/district'
import { dispatch } from '../game/core/commands'
import { useAppStore } from '../stores/appStore'
import { useGameStore } from '../stores/gameStore'
import Modal from './Modal'
import GameFeedback from './GameFeedback'

export default function ActivitiesPanel() {
  const openPanel = useAppStore((state) => state.openPanel)
  const mission = useGameStore((state) => state.mission)
  const completed = useGameStore((state) => state.completed)
  const waypoint = useGameStore((state) => state.waypoint)
  const position = useGameStore((state) => state.player.position)
  const vehicle = useGameStore((state) => state.vehicle)
  const bestRace = useGameStore((state) => state.bestRace)
  const activeDefinition = mission ? MISSIONS[mission.id] : null
  return <Modal title="A little work. A little adventure." eyebrow="LANTERN QUAY / THE NOTICEBOARD" onClose={() => openPanel(null)} className="activities-modal"><p className="modal-intro">Visit a contact to start a job. Mark their location on your map, choose a ride, and make your own route.</p>
    {mission && activeDefinition && <section className={`active-job ${mission.status === 'failed' ? 'job-failed' : ''}`}><span className="eyebrow">{mission.status === 'failed' ? 'JOB INTERRUPTED' : 'YOUR CURRENT JOB'}</span><h3>{activeDefinition.title}</h3><p>{mission.status === 'failed' ? mission.reason : activeDefinition.objectives[mission.step]?.text}</p><div className="job-actions"><button className="text-button" onClick={() => dispatch({ type: 'restart-mission' })}>Restart job</button><button className="text-button" onClick={() => dispatch({ type: 'abandon-mission' })}>Abandon job</button></div></section>}
    <div className="activity-list">{Object.values(MISSIONS).map((job, index) => {
      const isActive = mission?.id === job.id
      const locked = !!job.requiredMission && !completed.includes(job.requiredMission)
      const location = LOCATIONS.find((place) => place.id === (job.id === 'recovery' ? 'garage' : job.id))!
      const contactDistance = distance(position, location.position)
      const nearby = contactDistance <= 24
      const needsVehicle = job.id === 'race' && !vehicle
      return <article className={`activity ${isActive ? 'is-active' : ''}`} key={job.id}><div className="activity-index">0{index + 1}</div><div className="activity-content"><div className="activity-heading"><span className="eyebrow">{job.giver}</span><strong>${job.reward.toLocaleString()}</strong></div><h3>{job.title}</h3><p>{job.description}</p><div className="activity-status">{locked ? `Complete ${MISSIONS[job.requiredMission!].title} to unlock` : isActive ? mission.status === 'failed' ? 'Interrupted — restart to try again' : 'In progress' : !nearby ? `Contact ${Math.round(contactDistance)} m away · mark the route below` : needsVehicle ? 'Bring a vehicle to enter the race' : completed.includes(job.id) ? 'Completed · available to replay' : 'Contact nearby · ready when you are'}{job.id === 'race' && bestRace !== null && <span>Personal best: {bestRace.toFixed(1)}s</span>}</div><div className="activity-actions"><button className="button-line" onClick={() => dispatch({ type: 'waypoint', position: location.position })}>{waypoint && distance(waypoint, location.position) < 1 ? 'Route marked' : 'Mark contact'} <span>{waypoint && distance(waypoint, location.position) < 1 ? '✓' : '↗'}</span></button><button className="activity-start" disabled={locked || !!mission || !nearby || needsVehicle} onClick={() => dispatch({ type: 'mission', id: job.id })}>{isActive ? 'Current job' : locked ? 'Locked' : !nearby ? 'Visit to start' : needsVehicle ? 'Vehicle required' : 'Start job'} <span>→</span></button></div></div></article>
    })}</div><GameFeedback /><p className="modal-footnote">Jobs save at safe checkpoints. The harbor race also records your best time.</p></Modal>
}
