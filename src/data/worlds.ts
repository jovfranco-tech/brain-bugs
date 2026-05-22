import type { World } from '../types';

export const WORLDS: World[] = [
  {
    id: 'meadow',
    name: 'Sendero de la Pradera',
    description: '¡Una pradera soleada donde a los bichitos les encanta jugar!',
    emoji: '🌿',
    bgGradient: 'from-emerald-400 to-green-600',
    accentColor: '#3FD09E',
    requiredStars: 0,
    levels: [
      { id: 'meadow-l1', worldId: 'meadow', number: 1, name: 'Primeros Pasos',    puzzleId: 'meadow-1', maxStars: 3, requiredStars: 0  },
      { id: 'meadow-l2', worldId: 'meadow', number: 2, name: 'Campo de Flores',   puzzleId: 'meadow-2', maxStars: 3, requiredStars: 0  },
      { id: 'meadow-l3', worldId: 'meadow', number: 3, name: 'Laberinto de la Pradera',    puzzleId: 'meadow-3', maxStars: 3, requiredStars: 3  },
      { id: 'meadow-l4', worldId: 'meadow', number: 4, name: 'Salto de Esquina',     puzzleId: 'meadow-4', maxStars: 3, requiredStars: 5  },
      { id: 'meadow-l5', worldId: 'meadow', number: 5, name: 'Gran Extensión',   puzzleId: 'meadow-5', maxStars: 3, requiredStars: 8  },
    ],
  },
  {
    id: 'crystal',
    name: 'Cueva de Cristal',
    description: '¡Cristales brillantes iluminan el camino bajo tierra!',
    emoji: '💎',
    bgGradient: 'from-purple-500 to-indigo-700',
    accentColor: '#8E6BFF',
    requiredStars: 5,
    levels: [
      { id: 'crystal-l1', worldId: 'crystal', number: 1, name: 'Entrada de la Cueva', puzzleId: 'crystal-1', maxStars: 3, requiredStars: 5  },
      { id: 'crystal-l2', worldId: 'crystal', number: 2, name: 'Cuadrícula de Cristal',  puzzleId: 'crystal-2', maxStars: 3, requiredStars: 7  },
      { id: 'crystal-l3', worldId: 'crystal', number: 3, name: 'Caverna Profunda',   puzzleId: 'crystal-3', maxStars: 3, requiredStars: 9  },
      { id: 'crystal-l4', worldId: 'crystal', number: 4, name: 'Cámara de Gemas',   puzzleId: 'crystal-4', maxStars: 3, requiredStars: 11 },
      { id: 'crystal-l5', worldId: 'crystal', number: 5, name: 'Corazón de Cristal', puzzleId: 'crystal-5', maxStars: 3, requiredStars: 13 },
    ],
  },
  {
    id: 'robo',
    name: 'Arrecife Robot',
    description: '¡Un mundo submarino lleno de robots y coral!',
    emoji: '🤖',
    bgGradient: 'from-sky-400 to-blue-700',
    accentColor: '#5BC5FF',
    requiredStars: 15,
    levels: [
      { id: 'robo-l1', worldId: 'robo', number: 1, name: 'Entrada al Arrecife',     puzzleId: 'robo-1', maxStars: 3, requiredStars: 15 },
      { id: 'robo-l2', worldId: 'robo', number: 2, name: 'Torre de Coral',    puzzleId: 'robo-2', maxStars: 3, requiredStars: 17 },
      { id: 'robo-l3', worldId: 'robo', number: 3, name: 'Cuadrícula de Burbujas',    puzzleId: 'robo-3', maxStars: 3, requiredStars: 19 },
      { id: 'robo-l4', worldId: 'robo', number: 4, name: 'Núcleo de Robot',     puzzleId: 'robo-4', maxStars: 3, requiredStars: 22 },
      { id: 'robo-l5', worldId: 'robo', number: 5, name: 'Circuito Final',  puzzleId: 'robo-5', maxStars: 3, requiredStars: 24 },
    ],
  },
  {
    id: 'ocean',
    name: 'Océano Misterioso',
    description: '¡Explora las profundidades marinas y encuentra arrecifes llenos de vida!',
    emoji: '🌊',
    bgGradient: 'from-blue-500 to-indigo-800',
    accentColor: '#2B86C5',
    requiredStars: 25,
    levels: [
      { id: 'ocean-l1', worldId: 'ocean', number: 1, name: 'Arrecife Escondido', puzzleId: 'ocean-1', maxStars: 3, requiredStars: 25 },
      { id: 'ocean-l2', worldId: 'ocean', number: 2, name: 'Fosa de las Marianas', puzzleId: 'ocean-2', maxStars: 3, requiredStars: 27 },
      { id: 'ocean-l3', worldId: 'ocean', number: 3, name: 'Templo Sumergido', puzzleId: 'ocean-3', maxStars: 3, requiredStars: 29 },
      { id: 'ocean-l4', worldId: 'ocean', number: 4, name: 'Jardín de Anémonas', puzzleId: 'ocean-4', maxStars: 3, requiredStars: 31 },
      { id: 'ocean-l5', worldId: 'ocean', number: 5, name: 'Abismo Coralino', puzzleId: 'ocean-5', maxStars: 3, requiredStars: 33 },
    ],
  },
  {
    id: 'volcano',
    name: 'Volcán de Fuego',
    description: '¡Cuidado con la lava caliente! Un desafío ardiente para los bichos más valientes.',
    emoji: '🌋',
    bgGradient: 'from-orange-500 to-red-800',
    accentColor: '#FF4E50',
    requiredStars: 35,
    levels: [
      { id: 'volcano-l1', worldId: 'volcano', number: 1, name: 'Ruta de Lava', puzzleId: 'volcano-1', maxStars: 3, requiredStars: 35 },
      { id: 'volcano-l2', worldId: 'volcano', number: 2, name: 'Cámara de Fuego', puzzleId: 'volcano-2', maxStars: 3, requiredStars: 37 },
      { id: 'volcano-l3', worldId: 'volcano', number: 3, name: 'Cráter del Destino', puzzleId: 'volcano-3', maxStars: 3, requiredStars: 39 },
      { id: 'volcano-l4', worldId: 'volcano', number: 4, name: 'Río de Magma', puzzleId: 'volcano-4', maxStars: 3, requiredStars: 41 },
      { id: 'volcano-l5', worldId: 'volcano', number: 5, name: 'Gran Caldera', puzzleId: 'volcano-5', maxStars: 3, requiredStars: 43 },
    ],
  },
  {
    id: 'space',
    name: 'Espacio Estelar',
    description: '¡Viaja más allá de las estrellas en una gravedad cero y resuelve misterios galácticos!',
    emoji: '🚀',
    bgGradient: 'from-slate-900 to-purple-950',
    accentColor: '#F5576C',
    requiredStars: 45,
    levels: [
      { id: 'space-l1', worldId: 'space', number: 1, name: 'Órbita Lunar', puzzleId: 'space-1', maxStars: 3, requiredStars: 45 },
      { id: 'space-l2', worldId: 'space', number: 2, name: 'Lluvia de Asteroides', puzzleId: 'space-2', maxStars: 3, requiredStars: 47 },
      { id: 'space-l3', worldId: 'space', number: 3, name: 'Supernova', puzzleId: 'space-3', maxStars: 3, requiredStars: 49 },
      { id: 'space-l4', worldId: 'space', number: 4, name: 'Constelación Perdida', puzzleId: 'space-4', maxStars: 3, requiredStars: 51 },
      { id: 'space-l5', worldId: 'space', number: 5, name: 'El Fin del Universo', puzzleId: 'space-5', maxStars: 3, requiredStars: 53 },
    ],
  },
];

export const WORLD_MAP: Record<string, World> = Object.fromEntries(WORLDS.map(w => [w.id, w]));

export function getAllLevels() {
  return WORLDS.flatMap(w => w.levels);
}
