//【小蜜蜂】游戏
//重复卷动的背景
//临时使用的精灵放在池里（如子弹、爆炸）
//播放动画（爆炸）
//精灵放到坐标上时，指定精灵左上角位于该坐标还是中心位于之
//用时间临界值来记录是不是该进行下一次循环了（如敌机发射子弹）
//手动restart游戏
//为一组所有精灵设置属性


var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {

    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('enemyBullet', 'assets/enemy-bullet.png');
    game.load.spritesheet('invader', 'assets/invader32x32x4.png', 32, 32);//敌机
    game.load.image('ship', 'assets/player.png');
    game.load.spritesheet('kaboom', 'assets/explode.png', 128, 128);//爆炸
    game.load.image('starfield', 'assets/starfield.png');
    game.load.image('background', 'assets/background2.png');

}

var player;
var aliens;
var bullets;
var bulletTime = 0;
var cursors;
var fireButton;
var explosions;
var starfield;
var score = 0;
var scoreString = '';
var scoreText;
var lives;
var enemyBullet;
var firingTimer = 0;
var stateText;
var livingEnemies = [];

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);

    //  The scrolling starfield background
    //重复质地的精灵，用于用作背景
    starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');

    //  Our bullet group
    //子弹组
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(30, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    // The enemy's bullets
    //敌人子弹组
    enemyBullets = game.add.group();
    enemyBullets.enableBody = true;
    enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    enemyBullets.createMultiple(30, 'enemyBullet');//批量创建精灵
    enemyBullets.setAll('anchor.x', 0.5);
    enemyBullets.setAll('anchor.y', 1);
    enemyBullets.setAll('outOfBoundsKill', true);//这两项设置使精灵出边界自动kill
    enemyBullets.setAll('checkWorldBounds', true);//这两项设置使精灵出边界自动kill

    //  The hero!
    //玩家
    player = game.add.sprite(400, 500, 'ship');
    player.anchor.setTo(0.5, 0.5);
    game.physics.enable(player, Phaser.Physics.ARCADE);

    //  The baddies!
    //敌机组
    aliens = game.add.group();
    aliens.enableBody = true;
    aliens.physicsBodyType = Phaser.Physics.ARCADE;
    //创建敌机
    createAliens();

    //  The score
    //得分
    scoreString = 'Score : ';
    scoreText = game.add.text(10, 10, scoreString + score, { font: '34px Arial', fill: '#fff' });

    //  Lives
    //还有几条命的精灵
    lives = game.add.group();
    game.add.text(game.world.width - 100, 10, 'Lives : ', { font: '34px Arial', fill: '#fff' });

    //  Text
    //提示文字
    stateText = game.add.text(game.world.centerX,game.world.centerY,' ', { font: '84px Arial', fill: '#fff' });
    //让文字的中心居于指定的图标
    stateText.anchor.setTo(0.5, 0.5);
    stateText.visible = false;

    //显示还有几条命的精灵
    for (var i = 0; i < 3; i++) 
    {
        var ship = lives.create(game.world.width - 100 + (30 * i), 60, 'ship');
        ship.anchor.setTo(0.5, 0.5);
        ship.angle = 90;
        ship.alpha = 0.4;
    }

    //  An explosion pool
    //爆炸组
    explosions = game.add.group();
    explosions.createMultiple(30, 'kaboom');
    explosions.forEach(setupInvader, this);//设爆炸精灵们的属性

    //  And some controls to play the game with
    cursors = game.input.keyboard.createCursorKeys();//触发按键
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);//触发按键
    
}

//创造敌机
function createAliens () {

    for (var y = 0; y < 4; y++)
    {
        for (var x = 0; x < 10; x++)
        {
            var alien = aliens.create(x * 48, y * 50, 'invader');
            alien.anchor.setTo(0.5, 0.5);
            alien.animations.add('fly', [ 0, 1, 2, 3 ], 20, true);//定义动画，循环为true
            alien.play('fly');//播放动画
            alien.body.moves = false;
        }
    }

    aliens.x = 100;
    aliens.y = 50;

    //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
    
    //x:200：变化结尾
    //2000：多久完成动画
    //..None：
    //true：自动开始
    //0：延迟
    //1000：重复次数
    //true：自动相反播放
    var tween = game.add.tween(aliens).to( { x: 200 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    //  When the tween loops it calls descend
    //动画完成一次循环时执行descend方法，即飞机整体下移
    tween.onLoop.add(descend, this);
}

//设爆炸精灵
function setupInvader (invader) {

    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.animations.add('kaboom');//定义动画

}

//下移
function descend() {

    aliens.y += 10;

}

function update() {

    //  Scroll the background
    //背景滚动
    starfield.tilePosition.y += 2;

    if (player.alive)
    {
        //  Reset the player, then check for movement keys
        player.body.velocity.setTo(0, 0);

        if (cursors.left.isDown)
        {
            player.body.velocity.x = -200;
        }
        else if (cursors.right.isDown)
        {
            player.body.velocity.x = 200;
        }

        //  Firing?
        if (fireButton.isDown)
        {
            fireBullet();
        }

        if (game.time.now > firingTimer)
        {
            enemyFires();
        }

        //  Run collision
        game.physics.arcade.overlap(bullets, aliens, collisionHandler, null, this);//子弹打中敌机发生事件
        game.physics.arcade.overlap(enemyBullets, player, enemyHitsPlayer, null, this);//敌机子弹打中玩家发生事件
    }

}

function render() {

    // for (var i = 0; i < aliens.length; i++)
    // {
    //     game.debug.body(aliens.children[i]);
    // }

}

//子弹打中敌机发生事件
function collisionHandler (bullet, alien) {

    //  When a bullet hits an alien we kill them both
    bullet.kill();
    alien.kill();

    //  Increase the score
    score += 20;
    scoreText.text = scoreString + score;

    //  And create an explosion :)
    var explosion = explosions.getFirstExists(false);//获得一个可用的爆炸精灵
    explosion.reset(alien.body.x, alien.body.y);//设置爆炸精灵位置
    explosion.play('kaboom', 30, false, true);//爆炸精灵动画，kaboom动画名称，30每秒帧数，false是否循环，true播放完销毁

    if (aliens.countLiving() == 0)
    {
        score += 1000;
        scoreText.text = scoreString + score;

        enemyBullets.callAll('kill',this);
        stateText.text = " You Won, \n Click to restart";
        stateText.visible = true;

        //the "click to restart" handler
        //为敲击添加只发生一次的事件
        game.input.onTap.addOnce(restart,this);
    }

}

//敌机击中玩家
function enemyHitsPlayer (player,bullet) {
    
    bullet.kill();

    //代表命的精灵获得第一个
    live = lives.getFirstAlive();
    //销毁该精灵
    if (live)
    {
        live.kill();
    }

    //  And create an explosion :)
    var explosion = explosions.getFirstExists(false);
    explosion.reset(player.body.x, player.body.y);
    explosion.play('kaboom', 30, false, true);

    // When the player dies
    //如果没命了
    if (lives.countLiving() < 1)
    {
        player.kill();
        //对一个组调用方法
        enemyBullets.callAll('kill');

        stateText.text=" GAME OVER \n Click to restart";
        stateText.visible = true;

        //the "click to restart" handler
        //为敲击添加只发生一次的事件
        game.input.onTap.addOnce(restart,this);
    }

}

//敌人发射子弹
function enemyFires () {

    //  Grab the first bullet we can from the pool
    //子弹
    enemyBullet = enemyBullets.getFirstExists(false);

    livingEnemies.length=0;

    aliens.forEachAlive(function(alien){

        // put every living enemy in an array
        livingEnemies.push(alien);
    });


    if (enemyBullet && livingEnemies.length > 0)
    {
        //从存活敌机列表中选一个随机的
        var random=game.rnd.integerInRange(0,livingEnemies.length-1);
        // randomly select one of them
        var shooter=livingEnemies[random];
        // And fire the bullet from this enemy
        //敌机子弹出现
        enemyBullet.reset(shooter.body.x, shooter.body.y);
        //敌机子弹向玩家移动！
        game.physics.arcade.moveToObject(enemyBullet,player,120);
        //敌机发射限时器
        firingTimer = game.time.now + 2000;
    }

}

//发射子弹
function fireBullet () {

    //  To avoid them being allowed to fire too fast we set a time limit
    if (game.time.now > bulletTime)
    {
        //  Grab the first bullet we can from the pool
        bullet = bullets.getFirstExists(false);//从组中获得一个精灵，false表示获取游戏中不存在的精灵

        if (bullet)
        {
            //  And fire it
            bullet.reset(player.x, player.y + 8);//设置精灵位置
            bullet.body.velocity.y = -400;//设置精灵移动
            bulletTime = game.time.now + 200;//重设发射限制时间
        }
    }

}

//这个方法没用上，因为设置了超出边界自动销毁
function resetBullet (bullet) {

    //  Called if the bullet goes out of the screen
    bullet.kill();

}

function restart () {

    //  A new level starts
    
    //resets the life count
    //所有的命复活
    lives.callAll('revive');
    //  And brings the aliens back from the dead :)
    //重建敌机们
    aliens.removeAll();
    createAliens();

    //revives the player
    //玩家复活
    player.revive();
    //hides the text
    //隐藏提示文本
    stateText.visible = false;

}
