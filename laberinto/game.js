const { init, GameLoop, Sprite, SpriteSheet, initKeys, keyPressed } = kontra;
const { canvas, context } = init('gameCanvas');
initKeys();

const TILE_SIZE = 32;
const PACMAN_SPEED = 2;
const GHOST_SPEED = 2;
const hudElement = document.getElementById('hud');

// 1. GENERACIÓN DE SPRITE SHEET DESDE SVG
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
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="13" fill="#ffeb3b"/>
    </svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <path d="M16,16 L28,8 A13,13 0 1,0 28,24 Z" fill="#ffeb3b"/>
    </svg>`,
    getGhostSVG('#ff0000', 0), getGhostSVG('#ff0000', 1),
    getGhostSVG('#ffb8ff', 0), getGhostSVG('#ffb8ff', 1),
    getGhostSVG('#00ffff', 0), getGhostSVG('#00ffff', 1)
  ];

  const images = await Promise.all(svgs.map(svgToImage));
  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = TILE_SIZE * 2;
  sheetCanvas.height = TILE_SIZE * 4;
  const sheetCtx = sheetCanvas.getContext('2d');

  images.forEach((img, index) => {
    sheetCtx.drawImage(img, (index % 2) * TILE_SIZE, Math.floor(index / 2) * TILE_SIZE);
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

// 2. LABERINTO Y ESTADO GLOBAL
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

let map = [];
let score = 0;
let lives = 3;
let pelletsRemaining = 0;
let gameState = 'PLAYING'; // 'PLAYING' | 'WIN' | 'GAMEOVER'

function updateHUD() {
  hudElement.textContent = `PUNTOS: ${score} | VIDAS: ${lives}`;
}

function resetMap() {
  map = INITIAL_MAP.map(row => [...row]);
  pelletsRemaining = 0;
  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[r].length; c++) {
      if (map[r][c] === 0) pelletsRemaining++;
    }
  }
}

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

function drawOverlay(title, subtitle, color) {
  context.fillStyle = 'rgba(0, 0, 0, 0.78)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = color;
  context.font = 'bold 36px "Courier New", monospace';
  context.textAlign = 'center';
  context.fillText(title, canvas.width / 2, canvas.height / 2 - 15);

  context.fillStyle = '#ffffff';
  context.font = '18px "Courier New", monospace';
  context.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 25);
}

// 3. FÁBRICA DE FANTASMAS
function createGhost(startCol, startRow, animName, spriteSheet) {
  const ghost = Sprite({
    startCol,
    startRow,
    x: startCol * TILE_SIZE,
    y: startRow * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
    animations: { [animName]: spriteSheet.animations[animName] },
    dx: 0,
    dy: -GHOST_SPEED,
    resetPosition() {
      this.x = this.startCol * TILE_SIZE;
      this.y = this.startRow * TILE_SIZE;
      this.dx = 0;
      this.dy = -GHOST_SPEED;
    },
    update() {
      const isAligned = (this.x % TILE_SIZE === 0) && (this.y % TILE_SIZE === 0);
      if (isAligned) {
        const c = this.x / TILE_SIZE;
        const r = this.y / TILE_SIZE;

        const dirs = [
          { dx: 0, dy: -GHOST_SPEED },
          { dx: 0, dy: GHOST_SPEED },
          { dx: -GHOST_SPEED, dy: 0 },
          { dx: GHOST_SPEED, dy: 0 }
        ];

        const validDirs = dirs.filter(d => canMoveTo(c + Math.sign(d.dx), r + Math.sign(d.dy)));
        const nonReverseDirs = validDirs.filter(d => !(d.dx === -this.dx && d.dy === -this.dy));
        const choices = nonReverseDirs.length > 0 ? nonReverseDirs : validDirs;

        if (choices.length > 0) {
          const chosen = choices[Math.floor(Math.random() * choices.length)];
          this.dx = chosen.dx;
          this.dy = chosen.dy;
        }
      }
      this.advance();
      this.currentAnimation.update();
    }
  });
  ghost.playAnimation(animName);
  return ghost;
}

// 4. INICIALIZACIÓN DEL JUEGO
createGameSpriteSheet().then((spriteSheet) => {
  const pacman = Sprite({
    x: 1 * TILE_SIZE + TILE_SIZE / 2,
    y: 1 * TILE_SIZE + TILE_SIZE / 2,
    anchor: { x: 0.5, y: 0.5 },
    animations: { pacmanChomp: spriteSheet.animations.pacmanChomp },
    dx: 0,
    dy: 0,
    nextDir: { dx: 0, dy: 0 },
    resetPosition() {
      this.x = 1 * TILE_SIZE + TILE_SIZE / 2;
      this.y = 1 * TILE_SIZE + TILE_SIZE / 2;
      this.dx = 0;
      this.dy = 0;
      this.nextDir = { dx: 0, dy: 0 };
      this.rotation = 0;
    },
    update() {
      if (keyPressed('arrowup')) this.nextDir = { dx: 0, dy: -PACMAN_SPEED };
      else if (keyPressed('arrowdown')) this.nextDir = { dx: 0, dy: PACMAN_SPEED };
      else if (keyPressed('arrowleft')) this.nextDir = { dx: -PACMAN_SPEED, dy: 0 };
      else if (keyPressed('arrowright')) this.nextDir = { dx: PACMAN_SPEED, dy: 0 };

      const topLeftX = this.x - TILE_SIZE / 2;
      const topLeftY = this.y - TILE_SIZE / 2;
      const isAligned = (topLeftX % TILE_SIZE === 0) && (topLeftY % TILE_SIZE === 0);

      if (isAligned) {
        const col = topLeftX / TILE_SIZE;
        const row = topLeftY / TILE_SIZE;

        // Comer pastilla si la celda actual tiene una
        if (map[row][col] === 0) {
          map[row][col] = 2;
          score += 10;
          pelletsRemaining--;
          updateHUD();

          if (pelletsRemaining === 0) {
            gameState = 'WIN';
            return;
          }
        }

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

      if (this.dx > 0) this.rotation = 0;
      else if (this.dx < 0) this.rotation = Math.PI;
      else if (this.dy > 0) this.rotation = Math.PI / 2;
      else if (this.dy < 0) this.rotation = -Math.PI / 2;

      this.advance();
      if (this.dx !== 0 || this.dy !== 0) {
        this.currentAnimation.update();
      }
    }
  });
  pacman.playAnimation('pacmanChomp');

  const ghosts = [
    createGhost(6, 7, 'ghostRed', spriteSheet),
    createGhost(7, 7, 'ghostPink', spriteSheet),
    createGhost(8, 7, 'ghostCyan', spriteSheet)
  ];

  function startNewGame() {
    score = 0;
    lives = 3;
    gameState = 'PLAYING';
    resetMap();
    pacman.resetPosition();
    ghosts.forEach(g => g.resetPosition());
    updateHUD();
  }

  startNewGame();

  const loop = GameLoop({
    update() {
      if (gameState !== 'PLAYING') {
        if (keyPressed('enter')) startNewGame();
        return;
      }

      pacman.update();
      ghosts.forEach(g => g.update());

      // Colisión entre Pac-Man (anchor 0.5) y cada fantasma (anchor 0,0)
      for (const ghost of ghosts) {
        const ghostCenterX = ghost.x + TILE_SIZE / 2;
        const ghostCenterY = ghost.y + TILE_SIZE / 2;
        const distance = Math.hypot(pacman.x - ghostCenterX, pacman.y - ghostCenterY);

        if (distance < TILE_SIZE * 0.65) {
          lives--;
          updateHUD();

          if (lives <= 0) {
            gameState = 'GAMEOVER';
          } else {
            pacman.resetPosition();
            ghosts.forEach(g => g.resetPosition());
          }
          break;
        }
      }
    },
    render() {
      drawMap();
      pacman.render();
      ghosts.forEach(g => g.render());

      if (gameState === 'WIN') {
        drawOverlay('¡VICTORIA!', `Puntos finales: ${score} - Pulsa ENTER`, '#4caf50');
      } else if (gameState === 'GAMEOVER') {
        drawOverlay('GAME OVER', `Puntos finales: ${score} - Pulsa ENTER`, '#f44336');
      }
    }
  });

  loop.start();
});