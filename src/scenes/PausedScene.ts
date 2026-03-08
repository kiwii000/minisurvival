import Phaser from 'phaser';

export class PausedScene extends Phaser.Scene {
  constructor() { super('Paused'); }
  create(): void {
    const overlay = this.add.rectangle(400, 220, 520, 220, 0x111111, 0.85).setDepth(1500).setScrollFactor(0);
    this.add.text(210, 160, 'Paused\nEsc: Resume\nM: Main Menu', { fontSize: '28px', color: '#fff' }).setDepth(1501).setScrollFactor(0);
    this.scene.pause('Playing');
    this.input.keyboard?.once('keydown-ESC', () => { this.scene.resume('Playing'); this.scene.stop(); });
    this.input.keyboard?.once('keydown-M', () => { this.scene.launch('MainMenu'); });
    this.events.once('shutdown', () => overlay.destroy());
  }
}
