import Phaser from './lib/phaser.js'

import Game from './scenes/Game.js'

import GameOver from './scenes/GameOver.js'

export default new Phaser.Game({
    type: Phaser.AUTO,
    width: 320,
    height: 640,
    scene: [Game, GameOver],
    scale: {
        mode: Phaser.Scale.FIT,
        // Center vertically and horizontally
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 200
            },
            debug: false
        }
    }
})

console.dir(Phaser)