const { init, GameLoop } = kontra;
const { canvas, context } = init('gameCanvas');

const TILE_SIZE = 32;

// Mapa de 15x15 (1 = Pared, 0 = Pastilla, 2 = Vacío)
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

function drawMap() {
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const tile = map[row][col];
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;

      if (tile === 1) {
        // Dibujar pared
        context.fillStyle = '#1919a6';
        context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        context.strokeStyle = '#3b3bff';
        context.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      } else if (tile === 0) {
        // Dibujar pastilla
        context.fillStyle = '#ffb8ae';
        context.beginPath();
        context.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 4, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
}
