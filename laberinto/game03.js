const { init, GameLoop, Sprite, SpriteSheet, initKeys, keyPressed } = kontra;
const { canvas, context } = init('gameCanvas');
initKeys();

const TILE_SIZE = 32;
const PACMAN_SPEED = 2;

//  GENERACIÓN DE SPRITE SHEET DESDE SVG 
function svgToImage(svgString) {
  return new Promise((resolve) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.src = url;
  });
}

function getGhostSVG(color, frame) {
  // Alterna la forma de la falda inferior según el frame (0 o 1)
  const skirt = frame === 0
    ? 'L28,28 L23,24 L18,28 L14,24 L9,28 L4,24 L4,28 Z'
    : 'L28,24 L23,28 L18,24 L14,28 L9,24 L4,28 Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <path d="M4,16 A12,12 0 0,1 28,16 L28,28 ${skirt}" fill="${color}"/>
    <circle cx="11" cy="14" r="3.5" fill="white"/>
    <circle cx="21" cy="14" r="3.5" fill="white"/>
    <circle cx="12" cy="14" r="1.8" fill="#111"/>
    <circle cx="22" cy="14" r="1.8" fill="#111"/>
  </svg>`;
}

async function createGameSpriteSheet() {
  const svgs = [
    // Fila 0: Pac-Man cerrado y abierto (mirando a la derecha por defecto)
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="13" fill="#ffeb3b"/>
    </svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <path d="M16,16 L28,8 A13,13 0 1,0 28,24 Z" fill="#ffeb3b"/>
    </svg>`,
    // Fila 1: Fantasma Rojo
    getGhostSVG('#ff0000', 0),
    getGhostSVG('#ff0000', 1),
    // Fila 2: Fantasma Rosa
    getGhostSVG('#ffb8ff', 0),
    getGhostSVG('#ffb8ff', 1),
    // Fila 3: Fantasma Cian
    getGhostSVG('#00ffff', 0),
    getGhostSVG('#00ffff', 1)
  ];

  const images = await Promise.all(svgs.map(svgToImage));

  // Canvas oculto: 2 columnas (64px) x 4 filas (128px)
  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = TILE_SIZE * 2;
  sheetCanvas.height = TILE_SIZE * 4;
  const sheetCtx = sheetCanvas.getContext('2d');

  images.forEach((img, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    sheetCtx.drawImage(img, col * TILE_SIZE, row * TILE_SIZE);
  });

  return SpriteSheet({
    image: sheetCanvas,
    frameWidth: TILE_SIZE,
    frameHeight: TILE_SIZE,
    animations: {
      pacmanChomp: { frames: [0, 1], frameRate: 8 },
      ghostRed:    { frames: [2, 3], frameRate: 6 },
      ghostPink:   { frames: [4, 5], frameRate: 6 },
      ghostCyan:   { frames: [6, 7], frameRate: 6 }
    }
  });
}

//  MAPA Y LÓGICA 
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

function canMoveTo(col, row) {
  if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return false;
  return map[row][col] !== 1;
}




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

// Iniciamos tras construir el SpriteSheet asíncrono
createGameSpriteSheet().then((spriteSheet) => {
  const pacman = Sprite({
    // Usamos anchor: {x: 0.5, y: 0.5} para poder rotar Pac-Man sobre su centro
    x: 1 * TILE_SIZE + TILE_SIZE / 2,
    y: 1 * TILE_SIZE + TILE_SIZE / 2,
    anchor: { x: 0.5, y: 0.5 },
    animations: spriteSheet.animations,
    dx: 0,
    dy: 0,
    nextDir: { dx: 0, dy: 0 },
    update() {
      if (keyPressed('arrowup')) this.nextDir = { dx: 0, dy: -PACMAN_SPEED };
      else if (keyPressed('arrowdown')) this.nextDir = { dx: 0, dy: PACMAN_SPEED };
      else if (keyPressed('arrowleft')) this.nextDir = { dx: -PACMAN_SPEED, dy: 0 };
      else if (keyPressed('arrowright')) this.nextDir = { dx: PACMAN_SPEED, dy: 0 };

      // Como anchor es 0.5, restamos TILE_SIZE/2 para obtener la esquina superior izquierda
      const topLeftX = this.x - TILE_SIZE / 2;
      const topLeftY = this.y - TILE_SIZE / 2;
      const isAligned = (topLeftX % TILE_SIZE === 0) && (topLeftY % TILE_SIZE === 0);

      if (isAligned) {
        const col = topLeftX / TILE_SIZE;
        const row = topLeftY / TILE_SIZE;

        const nextCol = col + Math.sign(this.nextDir.dx);
        const nextRow = row + Math.sign(this.nextDir.dy);
        if ((this.nextDir.dx !== 0 || this.nextDir.dy !== 0) && canMoveTo(nextCol, nextRow)) {
          this.dx = this.nextDir.dx;
          this.dy = this.nextDir.dy;
        }

        const currNextCol = col + Math.sign(this.dx);
        const currNextRow = row + Math.sign(this.dy);
        if (!canMoveTo(currNextCol, currNextRow)) {
          this.dx = 0;
          this.dy = 0;
        }
      }

      // Orientar el sprite según el vector de movimiento
      if (this.dx > 0) this.rotation = 0;
      else if (this.dx < 0) this.rotation = Math.PI;
      else if (this.dy > 0) this.rotation = Math.PI / 2;
      else if (this.dy < 0) this.rotation = -Math.PI / 2;

      this.advance();

      // Solo animar la boca si se está moviendo
      if (this.dx !== 0 || this.dy !== 0) {
        this.currentAnimation.update();
      }
    }
  });

  pacman.playAnimation('pacmanChomp');

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
});