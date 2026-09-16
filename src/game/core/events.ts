import type { Point } from '../../types/game'
export interface CrimeEvent { type: 'theft' | 'collision' | 'dangerous-driving' | 'restricted'; position: Point; severity: number }
const crimes: CrimeEvent[] = []
export function reportCrime(crime: CrimeEvent) { crimes.push(crime) }
export function takeCrimes() { return crimes.splice(0) }
