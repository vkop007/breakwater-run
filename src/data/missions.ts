import type { MissionDefinition, MissionId, Objective, Point } from '../types/game'
import { RACE_ROUTE } from './district'
const goal = (kind: Objective['kind'], text: string, target: Point, vehicle?: string, radius = 8): Objective => ({ kind, text, target, vehicle, radius })
export const MISSIONS: Record<MissionId, MissionDefinition> = {
  delivery: {
    id: 'delivery', title: 'City Delivery', giver: 'Mara · Parcel & Pine', description: 'Collect three parcels, deliver them around Lantern Quay, then return the Hauler.', reward: 650,
    objectives: [
      goal('enter', 'Enter the delivery van', [-3.3, 0, -20], 'delivery-van'),
      goal('collect', 'Collect the first parcel from the depot', [-9, 0, -36], undefined, 2.5),
      goal('collect', 'Collect the second parcel', [-9, 0, -40], undefined, 2.5),
      goal('collect', 'Collect the third parcel', [-9, 0, -44], undefined, 2.5),
      goal('deliver', 'Deliver a parcel to Sunroom Market', [9, 0, -105]),
      goal('deliver', 'Deliver a parcel to Quayline Garage', [105, 0, 18]),
      goal('deliver', 'Deliver a parcel to Seabreeze Apartment', [9, 0, 22]),
      goal('return', 'Return the delivery van to Parcel & Pine', [-3.3, 0, -20], 'delivery-van'),
    ],
  },
  recovery: {
    id: 'recovery', title: 'The Missing Car', giver: 'Ivo · Quayline Garage', description: 'Find Ivo’s marked Pico and bring it home in one piece. The main road is faster; the side streets are quieter.', reward: 800,
    objectives: [goal('enter', 'Find and enter Ivo’s green Pico', [99.3, 0, -120], 'recovery-car'), goal('drive', 'Return Ivo’s car to the garage', [99.3, 0, 20], 'recovery-car')],
  },
  'hot-exit': {
    id: 'hot-exit', title: 'Hot Exit', giver: 'Remy · Freight Yard', description: 'Take the marked Kestrel, lose the police, and deliver it to Quayline.', reward: 1200, unlock: 'coupe', requiredMission: 'recovery',
    objectives: [goal('enter', 'Enter the marked Kestrel', [-99.3, 0, -192], 'hot-car'), goal('escape', 'Break sight and escape the police search', [-96, 0, -96], 'hot-car', 0), goal('drive', 'Deliver the Kestrel to Quayline Garage', [99.3, 0, 20], 'hot-car')],
  },
  race: {
    id: 'race', title: 'Harbor Circuit', giver: 'Lantern Quay Racing Club', description: 'Beat the rival through six checkpoints. Cash for a win; your best time stays on this device.', reward: 500, timeLimit: 120,
    objectives: RACE_ROUTE.slice(1).map((p, i) => goal('checkpoint', `Checkpoint ${i + 1} / ${RACE_ROUTE.length - 1}`, p, undefined, 11)),
  },
}
