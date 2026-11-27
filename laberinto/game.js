const { init, GameLoop, Sprite, initKeys, keyPressed } = kontra;
const { canvas, context } = init('gameCanvas');
initKeys();

const TILE_SIZE = 32;
const PACMAN_SPEED = 2; // Divisor exacto de 32 (32 / 2 = 16 frames por celda)

const INITIAL_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,1,1,1,0,1,2,2,2,1,0,1,1,1,1],
  [1,2,2,2,0,1,2,2,2,1,0,2,2,2,1],
  [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
  [1,1,0,1,0,1,1,1,1,1,0,1,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let map = INITIAL_MAP.map(row => [...row]);

// Comprueba si una celda de la cuadrícula es transitable
function canMoveTo(col, row) {
  if (  row < 0 || row >= map.length || col < 0 || col >= map[0].length) return false;
  return map[row][col] !== 1;
}
