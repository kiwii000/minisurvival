import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  create(): void {
    this.scene.pause('Playing');
    this.add.rectangle(400, 220, 550, 260, 0x2a0000, 0.9).setDepth(2200).setScrollFactor(0);
    this.add.text(200, 150, 'Game Over\nR: Retry\nM: Main Menu', { fontSize: '32px', color: '#ffdddd' }).setDepth(2201).setScrollFactor(0);
    this.input.keyboard?.once('keydown-R', () => {
      this.scene.stop();
      this.scene.stop('Playing');
      this.scene.start('Playing');
    });
    this.input.keyboard?.once('keydown-M', () => { this.scene.launch('MainMenu'); });
  }
}
