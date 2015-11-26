//坦克大战

//面向对象地定义精灵类，遍历精灵们让精灵们采取策略
//地图卷动
//组合多个图片成一个精灵
//鼠标的点击事件、鼠标的位置处理

//敌军坦克类
EnemyTank = function (index, game, player, bullets) {

    var x = game.world.randomX;
    var y = game.world.randomY;

    this.game = game;
    this.health = 3;
    this.player = player;
    this.bullets = bullets;
    this.fireRate = 1000;
    this.nextFire = 0;
    this.alive = true;

    this.shadow = game.add.sprite(x, y, 'enemy', 'shadow');//阴影
    this.tank = game.add.sprite(x, y, 'enemy', 'tank1');//车身
    this.turret = game.add.sprite(x, y, 'enemy', 'turret');//炮塔

    this.shadow.anchor.set(0.5);
    this.tank.anchor.set(0.5);
    this.turret.anchor.set(0.3, 0.5);

    this.tank.name = index.toString();
    game.physics.enable(this.tank, Phaser.Physics.ARCADE);
    this.tank.body.immovable = false;//是否不动 = false
    this.tank.body.collideWorldBounds = true;//碰撞世界边缘 = true
    this.tank.body.bounce.setTo(1, 1);//弹力

    this.tank.angle = game.rnd.angle();//角度

    game.physics.arcade.velocityFromRotation(this.tank.rotation, 100, this.tank.body.velocity);//旋转速度？

};

EnemyTank.prototype.damage = function() {//敌军坦克类的示例方法，受伤

    this.health -= 1;

    if (this.health <= 0)
    {
        this.alive = false;

        this.shadow.kill();
        this.tank.kill();
        this.turret.kill();

        return true;
    }

    return false;

}

EnemyTank.prototype.update = function() {//敌军坦克实例方法：更新

    this.shadow.x = this.tank.x;
    this.shadow.y = this.tank.y;
    this.shadow.rotation = this.tank.rotation;

    this.turret.x = this.tank.x;
    this.turret.y = this.tank.y;
    this.turret.rotation = this.game.physics.arcade.angleBetween(this.tank, this.player);//为炮塔指定方向：对着玩家坦克

    if (this.game.physics.arcade.distanceBetween(this.tank, this.player) < 300)//如果敌军坦克和玩家坦克距离300以内
    {
        if (this.game.time.now > this.nextFire && this.bullets.countDead() > 0)//在开火时间
        {
            this.nextFire = this.game.time.now + this.fireRate;

            var bullet = this.bullets.getFirstDead();//子弹

            bullet.reset(this.turret.x, this.turret.y);//子弹位置

            bullet.rotation = this.game.physics.arcade.moveToObject(bullet, this.player, 500);//子弹向我军打来
        }
    }

};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload () {

    game.load.atlas('tank', 'assets/tanks.png', 'assets/tanks.json');//加载图片及json，该json定义了用到的多张图片
    game.load.atlas('enemy', 'assets/enemy-tanks.png', 'assets/tanks.json');//加载图片及json，该json定义了用到的多张图片
    game.load.image('logo', 'assets/logo.png');
    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('earth', 'assets/scorched_earth.png');
    game.load.spritesheet('kaboom', 'assets/explosion.png', 64, 64, 23);
    
}

var land;

var shadow;
var tank;
var turret;

var enemies;
var enemyBullets;
var enemiesTotal = 0;
var enemiesAlive = 0;
var explosions;

var logo;

var currentSpeed = 0;
var cursors;

var bullets;
var fireRate = 100;
var nextFire = 0;

function create () {

    //  Resize our game world to be a 2000 x 2000 square
    game.world.setBounds(-1000, -1000, 2000, 2000);

    //  Our tiled scrolling background
    land = game.add.tileSprite(0, 0, 800, 600, 'earth');//地表精灵
    land.fixedToCamera = true;//锁定于镜头

    //  The base of our tank
    tank = game.add.sprite(0, 0, 'tank', 'tank1');//我军坦克
    tank.anchor.setTo(0.5, 0.5);
    tank.animations.add('move', ['tank1', 'tank2', 'tank3', 'tank4', 'tank5', 'tank6'], 20, true);

    //  This will force it to decelerate and limit its speed
    game.physics.enable(tank, Phaser.Physics.ARCADE);
    tank.body.drag.set(0.2);
    tank.body.maxVelocity.setTo(400, 400);//最大速度
    tank.body.collideWorldBounds = true;//碰撞世界边缘

    //炮塔
    //  Finally the turret that we place on-top of the tank body
    turret = game.add.sprite(0, 0, 'tank', 'turret');
    turret.anchor.setTo(0.3, 0.5);

    //敌人子弹的组
    //  The enemies bullet group
    enemyBullets = game.add.group();
    enemyBullets.enableBody = true;
    enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    enemyBullets.createMultiple(100, 'bullet');
    
    enemyBullets.setAll('anchor.x', 0.5);
    enemyBullets.setAll('anchor.y', 0.5);
    enemyBullets.setAll('outOfBoundsKill', true);
    enemyBullets.setAll('checkWorldBounds', true);

    //敌人坦克
    //  Create some baddies to waste :)
    enemies = [];

    enemiesTotal = 20;
    enemiesAlive = 20;

    for (var i = 0; i < enemiesTotal; i++)
    {
        enemies.push(new EnemyTank(i, game, tank, enemyBullets));
    }

    //  A shadow below our tank
    //玩家坦克的阴影
    shadow = game.add.sprite(0, 0, 'tank', 'shadow');
    shadow.anchor.setTo(0.5, 0.5);

    //  Our bullet group
    //玩家子弹组
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(30, 'bullet', 0, false);
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 0.5);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    //  Explosion pool
    //爆炸组
    explosions = game.add.group();

    for (var i = 0; i < 10; i++)
    {
        var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
        explosionAnimation.anchor.setTo(0.5, 0.5);
        explosionAnimation.animations.add('kaboom');
    }

    tank.bringToTop();
    turret.bringToTop();

    logo = game.add.sprite(0, 200, 'logo');
    logo.fixedToCamera = true;

    game.input.onDown.add(removeLogo, this);//鼠标按下隐藏欢迎界面

    game.camera.follow(tank);//镜头跟踪玩家
    game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
    game.camera.focusOnXY(0, 0);

    cursors = game.input.keyboard.createCursorKeys();

}

function removeLogo () {

    game.input.onDown.remove(removeLogo, this);
    logo.kill();

}

function update () {

    //敌军子弹打中我方
    game.physics.arcade.overlap(enemyBullets, tank, bulletHitPlayer, null, this);

    enemiesAlive = 0;

    //循环敌方活着的坦克
    for (var i = 0; i < enemies.length; i++)
    {
        if (enemies[i].alive)
        {
            enemiesAlive++;
            game.physics.arcade.collide(tank, enemies[i].tank);//我方坦克碰撞敌方坦克的处理
            game.physics.arcade.overlap(bullets, enemies[i].tank, bulletHitEnemy, null, this);//我方子弹击中敌方坦克的处理
            enemies[i].update();//敌方坦克类的实例方法，让该坦克行动
        }
    }

    //左右键旋转坦克方向
    if (cursors.left.isDown)
    {
        tank.angle -= 4;
    }
    else if (cursors.right.isDown)
    {
        tank.angle += 4;
    }

    //上箭头满速
    if (cursors.up.isDown)
    {
        //  The speed we'll travel at
        currentSpeed = 300;
    }
    else//缓缓减速（惯性）
    {
        if (currentSpeed > 0)
        {
            currentSpeed -= 4;
        }
    }

    if (currentSpeed > 0)
    {
        //向指定角度移动，参数：角度，速度，？（与文档不一致）
        game.physics.arcade.velocityFromRotation(tank.rotation, currentSpeed, tank.body.velocity);
    }

    //卷动背景，保证“整体幕布”从(0,0)开始
    land.tilePosition.x = -game.camera.x;
    land.tilePosition.y = -game.camera.y;

    //  Position all the parts and align rotations
    shadow.x = tank.x;
    shadow.y = tank.y;
    shadow.rotation = tank.rotation;

    turret.x = tank.x;
    turret.y = tank.y;

    //让炮塔方向指向鼠标
    turret.rotation = game.physics.arcade.angleToPointer(turret);

    //鼠标点击
    if (game.input.activePointer.isDown)
    {
        //  Boom!
        //开火
        fire();
    }

}
//子弹打中玩家坦克
function bulletHitPlayer (tank, bullet) {
    //……玩家无敌
    bullet.kill();

}
//子弹打中敌人坦克，敌人受到伤害，有可能死
function bulletHitEnemy (tank, bullet) {

    bullet.kill();

    var destroyed = enemies[tank.name].damage();

    if (destroyed)
    {
        var explosionAnimation = explosions.getFirstExists(false);
        explosionAnimation.reset(tank.x, tank.y);
        explosionAnimation.play('kaboom', 30, false, true);
    }

}

//开火，有时间间隔限制，使用nextFire限制
function fire () {

    if (game.time.now > nextFire && bullets.countDead() > 0)
    {
        nextFire = game.time.now + fireRate;

        var bullet = bullets.getFirstExists(false);

        bullet.reset(turret.x, turret.y);

        //让子弹移动向鼠标方向，并调整角度
        bullet.rotation = game.physics.arcade.moveToPointer(bullet, 1000, game.input.activePointer, 500);
    }

}

function render () {

    // game.debug.text('Active Bullets: ' + bullets.countLiving() + ' / ' + bullets.length, 32, 32);
    game.debug.text('Enemies: ' + enemiesAlive + ' / ' + enemiesTotal, 32, 32);

}

