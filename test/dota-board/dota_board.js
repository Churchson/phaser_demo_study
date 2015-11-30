
var game = new Phaser.Game(608, 608, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

var names = [
    "ducheng", "chicheng", "liuyuxin", "shengyifang", "zhengjing",
    "qidafang", "wuyaochao", "zhuyanxin", "suojinlong", "wangzhe"
];

function preload() {

    //json定义的地图
    game.load.tilemap('map', 'assets/map.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('ground', 'assets/TileA5.png');
    game.load.image('house', 'assets/TileB.png');

    for(var i = 0; i < names.length; i++){
        var n = names[i];
        game.load.spritesheet(n, 'assets/' + n + '.gif', 50, 50);
    }

}

var map;
var tileset;
var groundLayer;
var houseLayer;
var player;
var facing = 'left';
var jumpTimer = 0;
var cursors;
var jumpButton;
var bg;

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.stage.backgroundColor = '#000000';

    //bg = game.add.tileSprite(0, 0, 800, 600, 'background');//背景
    //bg.fixedToCamera = true;//背景锁定镜头
    //使用json定义的地图
    map = game.add.tilemap('map');
    //指定地图元件图
    map.addTilesetImage('ground');
    map.addTilesetImage('house');

    groundLayer = map.createLayer('ground');
    houseLayer = map.createLayer('house');

    //  Un-comment this on to see the collision tiles
    // layer.debug = true;

    groundLayer.resizeWorld();
    houseLayer.resizeWorld();
    
    //map.setCollisionByExclusion([], true, houseLayer);

    people = game.add.group();

    for(var i = 0; i < names.length; i++){
        var n = names[i];
        var team = i < names.length / 2 ? 0 : 1;
        people.create(50 * i + 50, (team == 0 ? 500 : 0) + 50, n);
    }

    //people.setAll("scale.x", 0.64);
    //people.setAll("scale.y", 0.64);
    people.setAll("anchor.x", 0.5);
    people.setAll("anchor.y", 0.5);
    people.setAll("inputEnabled", true);
    people.forEach(function(p){
        p.events.onInputDown.add(function(){
            player = p;
        });
        game.physics.enable(p, Phaser.Physics.ARCADE);
        p.body.immovable = false;//是否不动 = false
        p.body.collideWorldBounds = true;//碰撞世界边缘 = true
    });

    game.physics.enable(people, Phaser.Physics.ARCADE);
    game.physics.enable(groundLayer, Phaser.Physics.ARCADE);
    game.physics.enable(houseLayer, Phaser.Physics.ARCADE);

    cursors = game.input.keyboard.createCursorKeys();
    jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

}

function update() {

    game.physics.arcade.collide(people, groundLayer);
    game.physics.arcade.collide(people, houseLayer);

    if(game.input.activePointer.isDown){
        if(player != null){
            game.add.tween(player).to({x : game.input.activePointer.x, y: game.input.activePointer.y}, 1, Phaser.Easing.Linear.None, true);
        }
    }
}

function render () {

    // game.debug.text(game.time.physicsElapsed, 32, 32);
    //game.debug.body(player);
    // game.debug.bodyInfo(player, 16, 24);

}
