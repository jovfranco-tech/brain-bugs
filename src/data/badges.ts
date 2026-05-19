import type { Badge } from '../types';

// 8 badges matching the product spec
// IDs are stable — changing them would break saved progress
export const BADGES: Badge[] = [
  {
    id: 'first-solve',
    name: 'First Solve',
    description: 'You completed your very first Brain Bugs puzzle!',
    condition: 'Complete any puzzle',
    emoji: '🐛',
    color: '#3FD09E', darkColor: '#1F9A6E',
    requiresPuzzles: 1,
  },
  {
    id: 'star-collector',
    name: 'Persistence Star',
    description: 'Earned 5 stars — your persistence is paying off!',
    condition: 'Collect 5 stars total',
    emoji: '⭐',
    color: '#FFC83D', darkColor: '#B97808',
    requiresStars: 5,
  },
  {
    id: 'perfect-solve',
    name: 'Pattern Finder',
    description: 'Found the perfect pattern and solved a puzzle with 3 stars!',
    condition: 'Complete any puzzle with 3 stars',
    emoji: '🌟',
    color: '#FFD55E', darkColor: '#B97808',
  },
  {
    id: 'meadow-master',
    name: 'Meadow Master',
    description: 'Conquered all five Meadow Path puzzles!',
    condition: 'Complete all 5 Meadow levels',
    emoji: '🌿',
    color: '#3FD09E', darkColor: '#1F9A6E',
    requiresWorld: 'meadow',
  },
  {
    id: 'crystal-explorer',
    name: 'No Hint Win',
    description: 'Solved a puzzle entirely on your own — no hints needed!',
    condition: 'Complete any level using zero hints',
    emoji: '🧠',
    color: '#8E6BFF', darkColor: '#5A3BD1',
  },
  {
    id: 'robo-pioneer',
    name: 'Rotation Rookie',
    description: 'Learned the spin! Completed 3 puzzles using your rotation skills.',
    condition: 'Complete 3 puzzles',
    emoji: '🔄',
    color: '#5BC5FF', darkColor: '#2890D0',
    requiresPuzzles: 3,
  },
  {
    id: 'star-master',
    name: 'Brain Bug Champion',
    description: 'Collected 20 stars — you are a true Brain Bug champion!',
    condition: 'Collect 20 stars total',
    emoji: '🏆',
    color: '#FF8A4C', darkColor: '#D45F22',
    requiresStars: 20,
  },
  {
    id: 'speed-bug',
    name: 'Corner Thinker',
    description: 'Think from the corners — you have completed 5 puzzles!',
    condition: 'Complete 5 puzzles',
    emoji: '💡',
    color: '#FF6FA8', darkColor: '#C73C77',
    requiresPuzzles: 5,
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
