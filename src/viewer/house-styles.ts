/**
 * How the houses of each 3D town look: the plaster, and the colours of doors, shutters and window grilles.
 * Tunisian houses are not all white and blue: Sidi Bou Said is, but the Tunis medina has yellow, green, red-brown
 * and bare-wood doors, Djerba and the Sahel mix blue, green and wood, and the south builds in earth-coloured
 * plaster with palm-wood doors and small windows. Each house picks one of its town's joinery colours.
 */
export interface HouseStyle {
  /** Plaster colour (the vertex colours of each house vary it slightly). */
  base: string;
  /** Tone of the mottling on the plaster (r, g, b). */
  speck: [number, number, number];
  /** Door, shutter and window colours: one is picked per house, the first ones more often. */
  joinery: string[];
  /** Door surround: carved stone or plaster. */
  frame: string;
  door: 'arch' | 'rect';
  /** Black nail studs on the door (the classic Tunisian door); without them, plain planks. */
  studs: boolean;
  /** Bulging ironwork cages, flat iron grilles, or small square openings with wooden screens. */
  windows: 'cages' | 'grilles' | 'small';
  /** Surface relief of the wall: lime plaster, or earth (clay) plaster in the south. */
  relief: 'plaster' | 'clay';
  /** Chance of a wooden balcony (moucharabieh) on two-storey street fronts; 0 = none. */
  balconies: number;
}

const WOOD = '#7a5434', WOOD_D = '#5e3f27', GREEN = '#2f7a5a', BLUE = '#1d68b0', YELLOW = '#d9a531', OXBLOOD = '#8a3324', GREY = '#5b6266';

export const HOUSE_STYLES: Record<string, HouseStyle> = {
  /** Sidi Bou Said: lime-white and blue, by town rule since 1915. */
  sbs: { base: '#f7f6f2', speck: [236, 236, 232], joinery: [BLUE], frame: '#e6ddc8', door: 'arch', studs: true, windows: 'cages', relief: 'plaster', balconies: 1 },
  /** Tunis medina: white and cream walls; doors and window grilles in many colours, some bare wood. */
  medina: { base: '#f3efe6', speck: [230, 224, 210], joinery: [BLUE, GREEN, YELLOW, OXBLOOD, WOOD, '#3d8a9a'], frame: '#ddd0b4', door: 'arch', studs: true, windows: 'cages', relief: 'plaster', balconies: 1 },
  /** Kairouan: white medina, blue and green doors and grilles, some wood. */
  kairouan: { base: '#f6f3ec', speck: [234, 230, 220], joinery: [BLUE, GREEN, BLUE, WOOD, '#2f8a8a'], frame: '#e3d6bb', door: 'arch', studs: true, windows: 'grilles', relief: 'plaster', balconies: 0.5 },
  /** Sousse and the Sahel coast: white, with blue, green and wooden doors. */
  sahel: { base: '#f6f4ef', speck: [234, 232, 226], joinery: [BLUE, GREEN, WOOD, BLUE, GREY], frame: '#e4dac6', door: 'arch', studs: true, windows: 'grilles', relief: 'plaster', balconies: 0.4 },
  /** Carthage: white villas; doors and shutters blue, green, wood or grey. */
  coast: { base: '#f8f7f3', speck: [236, 236, 232], joinery: [BLUE, GREEN, WOOD, GREY, BLUE], frame: '#e8e2d4', door: 'rect', studs: false, windows: 'grilles', relief: 'plaster', balconies: 0.2 },
  /** Djerba: white houses (menzels), rectangular doors in blue, green or bare wood, small windows. */
  djerba: { base: '#f7f5ef', speck: [236, 233, 225], joinery: [BLUE, GREEN, WOOD, '#3f8fb0'], frame: '#ebe3d2', door: 'rect', studs: false, windows: 'small', relief: 'plaster', balconies: 0 },
  /** The south (Matmata, Tataouine): earth-coloured plaster, palm-wood doors, a little faded blue or green. */
  south: { base: '#d9bf94', speck: [200, 172, 128], joinery: [WOOD, WOOD_D, WOOD, '#4f7f86', '#6f8a5a'], frame: '#c9ab7c', door: 'rect', studs: false, windows: 'small', relief: 'clay', balconies: 0 },
  /** Villages of the north-west (Dougga, Bulla Regia, Sbeitla): cream and beige plaster, metal and wooden doors. */
  rural: { base: '#ece3d1', speck: [214, 202, 180], joinery: [WOOD, GREY, GREEN, BLUE, '#a2462e'], frame: '#d8ccb3', door: 'rect', studs: false, windows: 'grilles', relief: 'plaster', balconies: 0 },
};

/** The joinery colour a house uses (from its id): the first colours of the list come up more often. */
export function joineryIndex(style: HouseStyle, h: number) {
  const n = style.joinery.length;
  return Math.min(n - 1, Math.floor(Math.pow(h, 1.35) * n));
}
