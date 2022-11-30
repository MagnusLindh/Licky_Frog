import Phaser from '../lib/phaser.js'

export default class GameOver extends Phaser.Scene
{
    constructor()
    {
        super('game-over')
    }

    preload()
    {
        this.load.image('title','assets/title.png')
    }

    create()
    {
        const width=this.scale.width
        const height=this.scale.height
        this.add.image(width*0.5, height/3, 'title')
        this.add.text(width*0.5,2*height/3,"by Magnus Lindh",{fontSize:24}).setOrigin(0.5)

        this.input.on('pointerdown', () => {this.scene.start('game')})

        this.sound.play('music')
    }
}