import Phaser from 'phaser';
import { gameContext } from '../core/gameContext';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }
  create(): void {
    const box = this.add.rectangle(400, 230, 540, 300, 0x000000, 0.8).setScrollFactor(0);
    box.setDepth(2000);
    const text = this.add.text(170, 130, 'Main Menu\nN: New Game (random seed)\nL: Load Slot 1\nEsc: Close Menu\nQ: Quit to Game Over', { color: '#fff', fontSize: '22px' }).setDepth(2001).setScrollFactor(0);
    this.input.keyboard?.once('keydown-N', () => { gameContext.seed = Math.floor(Math.random() * 1000000); this.scene.stop(); this.scene.get('Playing').scene.restart(); });
    this.input.keyboard?.once('keydown-L', () => { this.scene.stop(); this.scene.get('Playing').scene.restart(); });
    this.input.keyboard?.once('keydown-ESC', () => this.scene.stop());
    this.input.keyboard?.once('keydown-Q', () => { this.scene.stop(); this.scene.launch('GameOver'); });
    this.events.once('shutdown', () => text.destroy());
  }
}
