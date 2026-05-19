import type { Badge } from '../types';

// 8 badges matching the product spec
// IDs are stable — changing them would break saved progress
export const BADGES: Badge[] = [
  {
    id: 'first-solve',
    name: 'Primera Victoria',
    description: '¡Completaste tu primer rompecabezas de Brain Bugs!',
    condition: 'Completa cualquier rompecabezas',
    emoji: '🐛',
    color: '#3FD09E', darkColor: '#1F9A6E',
    requiresPuzzles: 1,
  },
  {
    id: 'star-collector',
    name: 'Estrella de Persistencia',
    description: '¡Ganaste 5 estrellas! Tu persistencia está dando frutos.',
    condition: 'Colecciona 5 estrellas en total',
    emoji: '⭐',
    color: '#FFC83D', darkColor: '#B97808',
    requiresStars: 5,
  },
  {
    id: 'perfect-solve',
    name: 'Buscador de Patrones',
    description: '¡Encontraste el patrón perfecto y resolviste un rompecabezas con 3 estrellas!',
    condition: 'Completa cualquier rompecabezas con 3 estrellas',
    emoji: '🌟',
    color: '#FFD55E', darkColor: '#B97808',
  },
  {
    id: 'meadow-master',
    name: 'Maestro de la Pradera',
    description: '¡Conquistaste los cinco rompecabezas de la Pradera!',
    condition: 'Completa los 5 niveles del Sendero de la Pradera',
    emoji: '🌿',
    color: '#3FD09E', darkColor: '#1F9A6E',
    requiresWorld: 'meadow',
  },
  {
    id: 'crystal-explorer',
    name: 'Sin Pistas',
    description: '¡Resolviste un rompecabezas completamente por tu cuenta, sin usar pistas!',
    condition: 'Completa cualquier nivel sin usar pistas',
    emoji: '🧠',
    color: '#8E6BFF', darkColor: '#5A3BD1',
  },
  {
    id: 'robo-pioneer',
    name: 'Novato del Giro',
    description: '¡Aprendiste a girar! Completaste 3 rompecabezas usando tu habilidad de rotar.',
    condition: 'Completa 3 rompecabezas',
    emoji: '🔄',
    color: '#5BC5FF', darkColor: '#2890D0',
    requiresPuzzles: 3,
  },
  {
    id: 'star-master',
    name: 'Campeón de Brain Bugs',
    description: '¡Coleccionaste 20 estrellas! Eres un verdadero campeón de Brain Bugs.',
    condition: 'Colecciona 20 estrellas en total',
    emoji: '🏆',
    color: '#FF8A4C', darkColor: '#D45F22',
    requiresStars: 20,
  },
  {
    id: 'speed-bug',
    name: 'Pensador de Esquinas',
    description: 'Pensar desde las esquinas: ¡has completado 5 rompecabezas!',
    condition: 'Completa 5 rompecabezas',
    emoji: '💡',
    color: '#FF6FA8', darkColor: '#C73C77',
    requiresPuzzles: 5,
  },
  {
    id: 'daily-challenge',
    name: 'Campeón Diario',
    description: '¡Completaste tu primer Desafío Diario de BRAIN BUGS y obtuviste doble XP!',
    condition: 'Resuelve un Desafío Diario',
    emoji: '📅',
    color: '#FF5722', darkColor: '#E64A19',
  },
];

export const BADGE_MAP: Record<string, Badge> = Object.fromEntries(BADGES.map(b => [b.id, b]));

/**
 * Returns IDs of newly unlocked badges based on current progress.
 * Always call this BEFORE awarding new badges, then award the result.
 */
export function checkNewBadges(
  earned: string[],
  totalStars: number,
  puzzlesSolved: number,
  completedWorlds: string[],
): string[] {
  const candidates: string[] = [];
  for (const badge of BADGES) {
    if (earned.includes(badge.id)) continue;
    if (badge.requiresStars   && totalStars    < badge.requiresStars)   continue;
    if (badge.requiresPuzzles && puzzlesSolved < badge.requiresPuzzles) continue;
    if (badge.requiresWorld   && !completedWorlds.includes(badge.requiresWorld)) continue;
    // badges with no numeric requirement are awarded externally (perfect-solve, crystal-explorer)
    if (!badge.requiresStars && !badge.requiresPuzzles && !badge.requiresWorld) continue;
    candidates.push(badge.id);
  }
  return candidates;
}
