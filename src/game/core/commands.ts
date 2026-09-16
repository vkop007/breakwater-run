import type { GameCommand } from '../../types/game'
type Handler = (command: GameCommand) => void
const handlers = new Set<Handler>()
export function dispatch(command: GameCommand) { handlers.forEach((handler) => handler(command)) }
export function onCommand(handler: Handler) { handlers.add(handler); return () => { handlers.delete(handler) } }
