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

const pacman = Sprite({
  x: 1 * TILE_SIZE,
  y: 1 * TILE_SIZE,
  width: TILE_SIZE,
  height: TILE_SIZE,
  color: '#ffeb3b',
  dx: 0,
  dy: 0,
  nextDir: { dx: 0, dy: 0 },
  update() {
    // Leer intención del jugador
    if (keyPressed('arrowup')) this.nextDir = { dx: 0, dy: -PACMAN_SPEED };
    else if (keyPressed('arrowdown')) this.nextDir = { dx: 0, dy: PACMAN_SPEED };
    else if (keyPressed('arrowleft')) this.nextDir = { dx: -PACMAN_SPEED, dy: 0 };
    else if (keyPressed('arrowright')) this.nextDir = { dx: PACMAN_SPEED, dy: 0 };

    // Comprobar alineación exacta con la cuadrícula
    const isAligned = (this.x % TILE_SIZE === 0) && (this.y % TILE_SIZE === 0);

    if (isAligned) {
      const col = this.x / TILE_SIZE;
      const row = this.y / TILE_SIZE;

      // Intentar aplicar la dirección deseada si no hay pared
      const nextCol = col + Math.sign(this.nextDir.dx);
      const nextRow = row + Math.sign(this.nextDir.dy);
      if ((this.nextDir.dx !== 0 || this.nextDir.dy !== 0) && canMoveTo(nextCol, nextRow)) {
        this.dx = this.nextDir.dx;
        this.dy = this.nextDir.dy;
      }

      // Detenerse si la dirección actual choca contra una pared
      const currNextCol = col + Math.sign(this.dx);
      const currNextRow = row + Math.sign(this.dy);
      if (!canMoveTo(currNextCol, currNextRow)) {
        this.dx = 0;
        this.dy = 0;
      }
    }

    this.advance(); // Aplica x += dx e y += dy en Kontra
  },
  render() {
    // Dibujo temporal circular antes de añadir el SpriteSheet SVG
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x + TILE_SIZE / 2, this.y + TILE_SIZE / 2, TILE_SIZE / 2 - 3, 0, Math.PI * 2);
    context.fill();
  }
});

function drawMap() {
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const tile = map[row][col];
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      if (tile === 1) {
        context.fillStyle = '#1919a6';
        context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        context.strokeStyle = '#3b3bff';
        context.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      } else if (tile === 0) {
        context.fillStyle = '#ffb8ae';
        context.beginPath();
        context.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 4, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
}

const loop = GameLoop({
  update() {
    pacman.update();
  },
  render() {
    drawMap();
    pacman.render();
  }
});

loop.start();