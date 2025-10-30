import * as Phaser from 'phaser';
import { Boot } from '../game/scenes/Boot';
import { Preloader } from '../game/scenes/Preloader';
import { MainMenu } from '../game/scenes/MainMenu';
import { Instructions } from '../game/scenes/instructions';
import { Game as MainGame } from '../game/scenes/Game';
import { GameOver } from '../game/scenes/GameOver';

// ---------------------------------------------
// Game Configuration
// ---------------------------------------------
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#028af8',

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },

  physics: {
    default: 'arcade',
    arcade: {
      debug: false, // set to true if you want to see physics boxes
      gravity: { x: 0, y: 0 }, // ✅ include both x and y to satisfy Vector2Like
    },
  },

  scene: [Boot, Preloader, MainMenu, Instructions, MainGame, GameOver],
};

// ---------------------------------------------
// Boot Function
// ---------------------------------------------
const StartGame = (parent: string) => {
  return new Phaser.Game({ ...config, parent });
};

export default StartGame;
