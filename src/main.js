import BootScene from './scenes/BootScene.js';
import PlayScene from './scenes/PlayScene.js';


const config = {
type: Phaser.AUTO,
width: 800,
height: 600,
pixelArt: true,
physics: {
default: 'arcade',
arcade: { debug: false }
},
scene: [BootScene, PlayScene]
};


new Phaser.Game(config);