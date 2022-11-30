import Phaser from '../lib/phaser.js'

// import the carrot class here
import Carrot from '../game/Carrot.js'

// import the fire class here
import Fire from '../game/Fire.js'

// import the beer class here
import Beer from '../game/Beer.js'

export default class Game extends Phaser.Scene
{
    //carrotsCollected = 100

    /** @type {Phaser.Physics.Arcade.Sprite} */
    player

    /** @type {Phaser.Yypes.Input.Keyboard.CursorKeys} */
    cursors

    /** @type {Phaser.Physics.Arcade.Group} */
    carrots

    /** @type {Phaser.Physics.Arcade.Group} */
    fires

    /** @type {Phaser.Physics.Arcade.Group} */
    beers   

    /** @type {Phaser.GameObject.Text} */
    scoreText

    constructor()
    {
        super('game')
    }

    init()
    {
        this.score=0;
        this.mouseX = 0
        this.mouseY = 0
        this.mouseDown=false
        this.accMult = 4
        this.time =0
        this.carrotAmp=2
        this.carrotWaveLength=20
        this.duckJumpSpeed=50
    }

    preload()
    {
        this.load.image('background','assets/bg_layer1.png')
        this.load.image('platform', 'assets/grass.png')
        this.load.image('frogClosed','assets/frogClosed.png')
        this.load.image('frogOpened','assets/frogOpened.png')
        this.load.image('carrot', 'assets/butterfly.png')
        this.load.image('carrot2', 'assets/butterfly2.png')
        this.load.image('beer','assets/beer.png')
        this.load.image('punkt','assets/punkt.png')
        this.load.image('fire','assets/stork.png')
        this.load.audio('slurp','assets/sfx/slurp.mp3')
        this.load.audio('chew','assets/sfx/chew.mp3')
        this.load.audio('burp','assets/sfx/burp.mp3')
        this.load.audio('scream','assets/sfx/scream.mp3')
        this.load.audio('music','assets/sfx/Freky_Frog_song.m4a')
        this.cursors = this.input.keyboard.createCursorKeys()
    }

    create()
    {
        this.scale.displaySize.setAspectRatio( this.scale.width/this.scale.height );
        this.scale.refresh();

        this.add.image(160,320,'background').setScrollFactor(1,0)
        
        // create the group
        this.platforms = this.physics.add.staticGroup()

        // then create 5 platforms from the group
        for (let i=0;i<5;i++)
        {
            const x = Phaser.Math.Between(80,240)
            const y = 150 * i

            const platform = this.platforms.create(x,y,'platform')
            platform.scale = 1

            const body = platform.body
            body.updateFromGameObject()
        }

        //line
        this.grafik = this.add.graphics();

        // create a bunny sprite
        this.player = this.physics.add.sprite(160,320,'frogClosed').setScale(1)

        this.physics.add.collider(this.platforms,this.player)

        this.player.body.checkCollision.up = false
        this.player.body.checkCollision.left = false
        this.player.body.checkCollision.right = false

        this.cameras.main.startFollow(this.player)

        // set the horizontal dead zone to 1.5x game width
        this.cameras.main.setDeadzone(this.scale.width*1.5)

        // particle emitter
        /*
        this.partiklar = this.add.particles('punkt');
        this.partiklar.createEmitter({
            speed: 10,
            gravity: { x: 0, y: 200 },
            scale: { start: 0.1, end: 1 },
            tint: [ 0x0000FF, 0x00FF00, 0x0000FF],
            blendMode: 'ADD',
            follow: this.player
        });
        */

        // create carrots
        this.carrots = this.physics.add.group({
            classType: Carrot
        })

        this.physics.add.collider(this.platforms, this.carrots)
        this.physics.add.overlap(this.player, this.carrots, this.handleCollectCarrot, undefined, this)

        this.anims.create({
            key: 'flap',
            frames: [
                { key: 'carrot' },
                { key: 'carrot2', duration: 50 }
            ],
            frameRate: 8,
            repeat: -1
        });

        // create fires
        this.fires = this.physics.add.group({
            classType: Fire
        })

        this.physics.add.collider(this.platforms, this.fires)
        this.physics.add.overlap(this.player, this.fires, this.handleOverlapFire, undefined, this)   

        // create beers
        this.beers = this.physics.add.group({
            classType: Beer
        })

        this.physics.add.collider(this.platforms, this.beers)
        this.physics.add.overlap(this.player, this.beers, this.handleCollectBeer, undefined, this)   


        //Score text
        const style1 = {color: '#000',fontSize:24}
        this.scoreText = this.add.text(160,10,'Score: ' + this.score,style1).setScrollFactor(0).setOrigin(0.5,0)

        //Mouse down        
        this.input.on('pointerdown', function (pointer) {
            if (!this.mouseDown){
                //play slurp sound
                this.sound.play('slurp')
            }
            this.mouseX=pointer.x;
            this.mouseY=pointer.y;
            this.mouseDown=true;
            this.player.setTexture('frogOpened')
        }, this);

        //Mouse up
        this.input.on('pointerup', function (pointer) {
            this.mouseX=pointer.x;
            this.mouseY=pointer.y;
            this.mouseDown=false;
            this.grafik.clear();
            this.player.rotation=0;
            this.player.setTexture('frogClosed')
        }, this);

         //stop music
         this.sound.stopAll();
    }


    update(t,dt)
    {    
        //time is ticking
        this.time++;

        //platforms
        this.platforms.children.iterate(child => {
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = child

            const scrollY = this.cameras.main.scrollY
            if (platform.y >= scrollY +700)
            {
                platform.x = Phaser.Math.Between(80,240)
                platform.y = scrollY - Phaser.Math.Between(50,100)
                platform.body.updateFromGameObject()

                // add a 50% fire and 50% carrot
                var rand=Math.random();
                if (rand<0.2){
                    // create a beer above the platform being used
                    this.addBeerAbove(platform)
                } else if (rand<0.4){
                    // create a fire above the platform being used
                    this.addFireAbove(platform)
                } else if (rand<0.6){
                    // create a carrot above the platform being used
                    this.addCarrotAbove(platform)
                }
            }

        })

        //carrots
        this.carrots.children.iterate(child =>{
            const carrot = child
            //oscillating in x-dir
            carrot.x+=this.carrotAmp*Math.sin(this.time/this.carrotWaveLength)
        })

        //fires
        this.fires.children.iterate(child =>{
            const fire = child
            const touchingDown = fire.body.touching.down
            if (touchingDown){
                fire.body.velocity.y=-this.duckJumpSpeed
                if (this.player.x>fire.x){
                    fire.body.velocity.x=this.duckJumpSpeed
                    fire.flipX=true
                } else {
                    fire.body.velocity.x=-this.duckJumpSpeed
                    fire.flipX=false
                }               
            }
        })
        
        // is player touching something
        const touchingDown = this.player.body.touching.down
        
        // Clamp number between two values with the following line:
        const clamp = (num, min, max) => Math.min(Math.max(num, min), max); 
        const maxVel =200;    
        this.player.body.velocity.x = clamp(this.player.body.velocity.x,-maxVel,maxVel);
        this.player.body.velocity.y = clamp(this.player.body.velocity.y,-maxVel,maxVel);       

        /*
        if (touchingDown)
        {
            // this makes bunny jump
            this.player.setVelocityY(-300)

            //switch to jump texture
            this.player.setTexture('bunny-jump')

            //play jump sound
            this.sound.play('jump')
        }
        */

        
        if (touchingDown)
        {
            this.player.body.velocity.x*=0.9;
        }

        const vy = this.player.body.velocity.y
        /*
        if (vy>0 && this.player.texture.key != 'bunny-stand')
        {
            //switch back to jump when falling
            this.player.setTexture('bunny-stand')
        }
        */

        if (this.mouseDown)
        {
            var ax = this.mouseX-this.player.x;
            var ay = this.mouseY+this.cameras.main.scrollY-this.player.y;
            var r = Math.atan(ay/ax);
            var offset=64;
            var offsetY=offset*Math.sin(r);
            var offsetX;
            //acceleration and rotation
            this.player.body.acceleration.x=this.accMult*ax;
            this.player.body.acceleration.y=this.accMult*ay;
            this.player.rotation = r;
            //flip horizontally
            if (this.mouseX>this.player.x){
                this.player.flipX=true;
                offsetX=offset*Math.cos(r);
            } else {
                this.player.flipX=false;
                offsetX=-offset*Math.cos(r);
            }
            //line
            this.grafik.clear(); 
            this.grafik.lineStyle(8, 0xff0000, 1);   
            this.grafik.lineBetween(this.mouseX, this.mouseY+this.cameras.main.scrollY, this.player.x, this.player.y);   
        }
        else
        {
            // stop movement if not left or right
            this.player.body.acceleration.x=0;
            this.player.body.acceleration.y=0;
        }

        this.horizontalWrap(this.player)

        const bottomPlatform = this.findBottomMostPlatform()
        if (this.player.y > bottomPlatform.y + 200 || this.health<0)
        {
            //play scream sound
            this.sound.play('scream')
            this.scene.start('game-over')
        }
    }
    /**
     * @param {Phaser.GameObject.Sprite} sprite
     */
    horizontalWrap(sprite)
    {
        const halfWidth = sprite.displayWidth * 0.5
        const gameWidth = this.scale.width
        if (sprite.x < -halfWidth)
        {
            sprite.x = gameWidth + halfWidth
        }
        else if (sprite.x > gameWidth + halfWidth)
        {
            sprite.x = -halfWidth
        }
    }
    /**
    * @param {Phaser.GameObjects.Sprite} sprite
    */
    addCarrotAbove(sprite)
    {
        const y = sprite.y - sprite.displayHeight*2

        /** @type {Phaser.Physics.Arcade.Sprite} */
        //const carrot = this.carrots.get(sprite.x, y, 'carrot')
        const carrot = this.carrots.get(sprite.x, y, 'carrot').play('flap');

        //set active and visible
        carrot.setActive(true)
        carrot.setVisible(true)

        this.add.existing(carrot)

        //update the physics body size
        carrot.body.setSize(carrot.width, carrot.height)

        //make sure body is enabled in the physics world
        this.physics.world.enable(carrot)

        return carrot
    }
    /**
    * @param {Phaser.GameObjects.Sprite} sprite
    */
    addFireAbove(sprite)
    {
        const y = sprite.y - sprite.displayHeight*2

        /** @type {Phaser.Physics.Arcade.Sprite} */
        const fire = this.fires.get(sprite.x, y, 'fire')

        //set active and visible
        fire.setActive(true)
        fire.setVisible(true)

        this.add.existing(fire)

        //update the physics body size
        fire.body.setSize(fire.width, fire.height)

        //make sure body is enabled in the physics world
        this.physics.world.enable(fire)

        return fire
    }
    /**
    * @param {Phaser.GameObjects.Sprite} sprite
    */
     addBeerAbove(sprite)
     {
         const y = sprite.y - sprite.displayHeight*2
 
         /** @type {Phaser.Physics.Arcade.Sprite} */
         const beer = this.beers.get(sprite.x, y, 'beer')
 
         //set active and visible
         beer.setActive(true)
         beer.setVisible(true)
 
         this.add.existing(beer)
 
         //update the physics body size
         beer.body.setSize(beer.width, beer.height)
 
         //make sure body is enabled in the physics world
         this.physics.world.enable(beer)
 
         return beer
     }
    /**
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Carrot} carrot
     */
    handleCollectCarrot(player, carrot)
    {
        //hide from display
        this.carrots.killAndHide(carrot)

        //disable from physics world
        this.physics.world.disableBody(carrot.body)

        //increment by 2
        this.score++;
        this.score++;

        //create new text value and set it
        this.scoreText.text = "Score: " + this.score

        //play chew sound
        this.sound.play('chew')
    }
    /**
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Beer} beer
     */
     handleCollectBeer(player, beer)
     {
         //hide from display
         this.beers.killAndHide(beer)
 
         //disable from physics world
         this.physics.world.disableBody(beer.body)
 
        //increment by 1
        this.score++;

        //create new text value and set it
        this.scoreText.text = "Score: " + this.score

        //play burp sound
        this.sound.play('burp')
     }
    /**
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Fire} fire
     */
     handleOverlapFire(player, fire)
     {
        //play scream sound
        this.sound.play('scream')
        this.scene.start('game-over')
     }
    findBottomMostPlatform()
    {
        const platforms = this.platforms.getChildren()
        let bottomPlatform = platforms[0]
        for (let i=1; i<platforms.length;++i)
        {
            const platform = platforms[i]
            //discard any platforms that are above current
            if (platform.y<bottomPlatform.y)
            {
                continue
            }
            bottomPlatform = platform
        }
        return bottomPlatform
    }
}