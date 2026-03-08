import Phaser from 'phaser';
import { GameOverScene } from './scenes/GameOverScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { PausedScene } from './scenes/PausedScene';
import { PlayingScene } from './scenes/PlayingScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 640,
  backgroundColor: '#2f4f4f',
  scene: [PlayingScene, MainMenuScene, PausedScene, GameOverScene],
  pixelArt: true
});

export default game;
