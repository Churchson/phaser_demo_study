// mods by Patrick OReilly 
// twitter: @pato_reilly

//从这个例子学到：瓷砖地图的用法
//关键类：Tilemap
//做地图是棋盘类的游戏可以参考
var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {
    //载入瓷砖地图的定义
    game.load.tilemap('matching', 'assets/phaser_tiles.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles', 'assets/phaser_tiles.png');//, 100, 100, -1, 1, 1);    
}

var timeCheck = 0;
var flipFlag = false;

var startList = new Array();//用于生成下面的瓷砖数组，长度为36，起初内容为1..18, 1..18
var squareList = new Array();//游戏中的瓷砖数组，长度为36，元素为瓷砖值，值范围为1到18

var masterCounter = 0;
var squareCounter = 0;
var square1Num;//翻开的第一块瓷砖的值
var square2Num;//..
var savedSquareX1;//第一块瓷砖坐标
var savedSquareY1;//..
var savedSquareX2;//..
var savedSquareY2;//..

var map;
var tileset;
var layer;

var marker;
var currentTile;//当前瓷砖
var currentTilePosition;//当前瓷砖位置（即序号数字）

var tileBack = 25;//第25号瓷砖，即灰板
var timesUp = '+';
var youWin = '+';

var myCountdownSeconds;


function create() {
    //添加瓷砖地图
    map = game.add.tilemap('matching');

    map.addTilesetImage('Desert', 'tiles');

    //tileset = game.add.tileset('tiles');

    //创建层
    layer = map.createLayer('Ground');//.tilemapLayer(0, 0, 600, 600, tileset, map, 0);

    //layer.resizeWorld();

    //绿色的选择框
    marker = game.add.graphics();
    marker.lineStyle(2, 0x00FF00, 1);
    marker.drawRect(0, 0, 100, 100);
    
    //随机瓷砖
    randomizeTiles();

}

function update() {
    
    countDownTimer();
    
    if (layer.getTileX(game.input.activePointer.worldX) <= 5) // to prevent the marker from going out of bounds
    {
        marker.x = layer.getTileX(game.input.activePointer.worldX) * 100;
        marker.y = layer.getTileY(game.input.activePointer.worldY) * 100;
    }

    if (flipFlag == true) //有俩在检查的瓷砖
    {
        if (game.time.totalElapsedSeconds() - timeCheck > 0.5)
        {
            flipBack();//翻回去
        }
    }
    else
    {
        processClick();
    }
}
   
//限时
function countDownTimer() {
  
    var timeLimit = 120;
  
    mySeconds = game.time.totalElapsedSeconds();
    myCountdownSeconds = timeLimit - mySeconds;
    
    if (myCountdownSeconds <= 0) 
        {
        // time is up
        timesUp = 'Time is up!';    
    }
}

function processClick() {
   
    //当前瓷砖及其位置
    currentTile = map.getTile(layer.getTileX(marker.x), layer.getTileY(marker.y));
    currentTilePosition = ((layer.getTileY(game.input.activePointer.worldY)+1)*6)-(6-(layer.getTileX(game.input.activePointer.worldX)+1));
        
    if (game.input.mousePointer.isDown)
        {
        // check to make sure the tile is not already flipped
        if (currentTile.index == tileBack)//如果点开的是灰板
        {
            // get the corresponding item out of squareList
            currentNum = squareList[currentTilePosition-1];//当前瓷砖编号
            flipOver();//翻开
            squareCounter++;//尝试匹配牌子+1
            // is the second tile of pair flipped?
            if  (squareCounter == 2) 
            {//翻开俩了
                // reset squareCounter
                squareCounter = 0;
                square2Num = currentNum;
                // check for match
                if (square1Num == square2Num)//正确！
                {
                    masterCounter++;//正确组数加一
                    
                    if (masterCounter == 18) 
                    {
                        // go "win"
                        youWin = 'Got them all!';
                    }                       
                }
                else
                {//错误！在一段时间后被翻回，先记录瓷砖2的坐标供翻回使用
                    savedSquareX2 = layer.getTileX(marker.x);
                    savedSquareY2 = layer.getTileY(marker.y);
                    flipFlag = true;//应该翻回的标识
                    timeCheck = game.time.totalElapsedSeconds();//翻回时间的限定
                }   
            }   
            else
            {//只翻开一个，记录瓷砖1的坐标和值
                savedSquareX1 = layer.getTileX(marker.x);
                savedSquareY1 = layer.getTileY(marker.y);
                square1Num = currentNum;
            }           
        }           
    }    
}
 
//翻开
function flipOver() {
    //第几号瓷砖，放到哪里
    //currentNum为数字，表示在phaser_tiles.json里定义的第几块瓷砖，也即phaser_tiles大图里的第几块
    map.putTile(currentNum, layer.getTileX(marker.x), layer.getTileY(marker.y));
}

//扣上
function flipBack() {
    flipFlag = false;
    map.putTile(tileBack, savedSquareX1, savedSquareY1);
    map.putTile(tileBack, savedSquareX2, savedSquareY2);
}
 
//产生随机瓷砖
//squareList保存的是乱序的数组，如[18,2,3,...2,18,3]，为1到18每个数字出现2次，代表每对瓷砖在地图上的位置
function randomizeTiles() {

    for (num = 1; num <= 18; num++)
    {
        startList.push(num);
    }
    for (num = 1; num <= 18; num++)
    {
        startList.push(num);
    }

    // for debugging
    myString1 = startList.toString();
  
    // randomize squareList
    for (i = 1; i <=36; i++)
    {
        var randomPosition = game.rnd.integerInRange(0,startList.length - 1);//startList的一个随机位置

        var thisNumber = startList[ randomPosition ];//该位置的值

        squareList.push(thisNumber);//squareList添加该值
        var a = startList.indexOf(thisNumber);//startList去掉该值（去掉的是第一次出现的那个）

        startList.splice( a, 1);//startList去掉该值（去掉的是第一次出现的那个）
    }
    
    // for debugging
    myString2 = squareList.toString();
  
    for (col = 0; col < 6; col++)
    {
        for (row = 0; row < 6; row++)
        {
            //添加瓷砖
            map.putTile(tileBack, col, row);
        }
    }
}

function getHiddenTile() {
    thisTile = squareList[currentTilePosition-1];
    return thisTile;
}

function render() {

    game.debug.text(timesUp, 620, 208, 'rgb(0,255,0)');
    game.debug.text(youWin, 620, 240, 'rgb(0,255,0)');

    //game.debug.text('Time: ' + myCountdownSeconds, 620, 15, 'rgb(0,255,0)');

    //game.debug.text('squareCounter: ' + squareCounter, 620, 272, 'rgb(0,0,255)');
    game.debug.text('Matched Pairs: ' + masterCounter, 620, 304, 'rgb(0,0,255)');

    //game.debug.text('startList: ' + myString1, 620, 208, 'rgb(255,0,0)');
    //game.debug.text('squareList: ' + myString2, 620, 240, 'rgb(255,0,0)');


    game.debug.text('Tile: ' + map.getTile(layer.getTileX(marker.x), layer.getTileY(marker.y)).index, 620, 48, 'rgb(255,0,0)');

    game.debug.text('LayerX: ' + layer.getTileX(marker.x), 620, 80, 'rgb(255,0,0)');
    game.debug.text('LayerY: ' + layer.getTileY(marker.y), 620, 112, 'rgb(255,0,0)');

    game.debug.text('Tile Position: ' + currentTilePosition, 620, 144, 'rgb(255,0,0)');
    game.debug.text('Hidden Tile: ' + getHiddenTile(), 620, 176, 'rgb(255,0,0)');
}
