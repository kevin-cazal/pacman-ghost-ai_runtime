// NE PAS MODIFIER — code de base de l'atelier

import { TILE_SIZE, COLS, ROWS, COLORS } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;
  }

  clear() {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawMap(map) {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tile = map.getTile(x, y);
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile === '#') {
          this.ctx.fillStyle = COLORS.wall;
          this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        } else if (tile === '.') {
          this.ctx.fillStyle = COLORS.pill;
          this.ctx.beginPath();
          this.ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 2, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (tile === 'O') {
          this.ctx.fillStyle = COLORS.superPill;
          this.ctx.beginPath();
          this.ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 6, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }

  drawPacman(pacman) {
    const cx = pacman.pixelX + TILE_SIZE / 2;
    const cy = pacman.pixelY + TILE_SIZE / 2;
    const radius = TILE_SIZE / 2 - 2;
    const facing = pacman.direction || pacman.facingDirection || 'left';

    const rotation = {
      right: 0,
      down: Math.PI / 2,
      left: Math.PI,
      up: -Math.PI / 2,
    }[facing] ?? 0;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(rotation);
    this.ctx.fillStyle = COLORS.pacman;
    this.ctx.beginPath();

    const mouthClosed = 0.08;
    const mouthOpen = 0.45;
    let mouthAngle;
    if (pacman.direction) {
      mouthAngle = mouthClosed + (Math.sin(pacman.mouthPhase) * 0.5 + 0.5) * (mouthOpen - mouthClosed);
    } else {
      mouthAngle = 0.15;
    }

    this.ctx.arc(0, 0, radius, mouthAngle, Math.PI * 2 - mouthAngle);
    this.ctx.lineTo(0, 0);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawGhost(ghost) {
    const cx = ghost.pixelX + TILE_SIZE / 2;
    const cy = ghost.pixelY + TILE_SIZE / 2;
    const radius = TILE_SIZE / 2 - 2;

    const color =
      ghost.state === 'scared'
        ? COLORS.ghostScared
        : ghost.state === 'patrol'
          ? COLORS.ghostPatrol
          : COLORS.ghost;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - 2, radius, Math.PI, 0);
    this.ctx.lineTo(cx + radius, cy + radius - 2);
    this.ctx.lineTo(cx + radius / 2, cy + radius - 6);
    this.ctx.lineTo(cx, cy + radius - 2);
    this.ctx.lineTo(cx - radius / 2, cy + radius - 6);
    this.ctx.lineTo(cx - radius, cy + radius - 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(cx - 4, cy - 2, 3, 0, Math.PI * 2);
    this.ctx.arc(cx + 4, cy - 2, 3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(cx - 4, cy - 2, 1.5, 0, Math.PI * 2);
    this.ctx.arc(cx + 4, cy - 2, 1.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawHUD(score, pillsLeft, message, messageColor = 'win') {
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = '14px system-ui, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${score}`, 8, 18);
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Pac-gommes: ${pillsLeft}`, this.canvas.width - 8, 18);

    if (message) {
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = COLORS[messageColor] || COLORS.text;
      this.ctx.font = 'bold 20px system-ui, sans-serif';
      this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
    }
  }
}
