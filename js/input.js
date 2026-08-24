// NE PAS MODIFIER — code de base de l'atelier

export class Input {
  constructor() {
    this.enabled = false;
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    window.addEventListener('keydown', (e) => this._onKey(e, true));
    window.addEventListener('keyup', (e) => this._onKey(e, false));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.keys.up = false;
      this.keys.down = false;
      this.keys.left = false;
      this.keys.right = false;
    }
  }

  _onKey(event, pressed) {
    if (!this.enabled) {
      return;
    }

    const keyMap = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };

    const dir = keyMap[event.key];
    if (dir) {
      event.preventDefault();
      this.keys[dir] = pressed;
    }
  }

  getDirection() {
    if (!this.enabled) {
      return null;
    }
    if (this.keys.up) return 'up';
    if (this.keys.down) return 'down';
    if (this.keys.left) return 'left';
    if (this.keys.right) return 'right';
    return null;
  }
}
