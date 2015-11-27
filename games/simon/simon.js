// mods by Patrick OReilly
// Twitter: @pato_reilly Web: http://patricko.byethost9.com

//本例是个有“关卡”的游戏，但“关卡”只是逻辑上的
//每过一关后，修改适当的全局变量，并继续进行

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {
    game.load.spritesheet('item', 'assets/number-buttons.png', 160, 160);
}

var simon;//块的组
var N = 1;//第几关，第n关出n个数
var userCount = 0;//玩家答完第几关了
var currentCount = 0;//出题时出到第几个数了
var sequenceCount = 16;//总共16关
var sequenceList = [];//保存题目即内容
var simonSez = false;//电脑是否在出题
var timeCheck;//限时器，是个时间值，用于相减判断是否到了该进行下一话题的时间
var litSquare;//电脑出题时亮着的块的值即其下标
var winner;//玩家是否赢了
var loser;//玩家是否输了
var intro;//是否在入场时的闪烁中

function create() {

    //块组
    simon = game.add.group();
    var item;

    for (var i = 0; i < 3; i++)
    {
        item = simon.create(150 + 168 * i, 150, 'item', i);
        // Enable input.
        item.inputEnabled = true;
        item.input.start(0, true);
        item.events.onInputDown.add(select);//点下触发
        item.events.onInputUp.add(release);//松手触发
        item.events.onInputOut.add(moveOff);//移出触发
        simon.getAt(i).alpha = 0;
    }

    for (var i = 0; i < 3; i++)
    {
        item = simon.create(150 + 168 * i, 318, 'item', i + 3);
        // Enable input.
        item.inputEnabled = true;
        item.input.start(0, true);
        item.events.onInputDown.add(select);//点下触发
        item.events.onInputUp.add(release);//松手触发
        item.events.onInputOut.add(moveOff);//移出触发
        simon.getAt(i + 3).alpha = 0;
    }

    introTween();//动画
    setUp();//初始化值
    setTimeout(function(){simonSequence(); intro = false;}, 6000);

}

function restart() {

    N = 1;
    userCount = 0;
    currentCount = 0;
    sequenceList = [];
    winner = false;
    loser = false;
    introTween();
    setUp();
    setTimeout(function(){simonSequence(); intro=false;}, 6000);

}
//入场动画
function introTween() {

    intro = true;

    //为每个块添加动画
    for (var i = 0; i < 6; i++)
    {
        //动画甲
        var flashing = game.add.tween(simon.getAt(i)).to( { alpha: 1 }, 500, Phaser.Easing.Linear.None, true, 0, 4, true);
        //动画乙
        var final = game.add.tween(simon.getAt(i)).to( { alpha: .25 }, 500, Phaser.Easing.Linear.None, true);
        //连起来
        flashing.chain(final);
        //走你
        flashing.start();
    }

}

function update() {
    if (simonSez)//出题阶段
    {
        if (game.time.now - timeCheck > 700 - N * 40)//700 - N * 40是出两个数之间的间隔时间，随着N增长，越出越快，甚至700 - N * 40为负数即这个限制不起作用
        {
            simon.getAt(litSquare).alpha = .25;//出题块回复正常
            game.paused = true;

            //400 - N * 20毫秒后执行
            setTimeout(function()
            {
                if (currentCount < N)//还没出完
                {
                    game.paused = false;
                    simonSequence();//出下一个数
                }
                else//出完题了，让玩家答题
                {
                    simonSez = false;
                    game.paused = false;
                }
            }, 400 - N * 20);//出一个数之前的准备时间，当上面的700 - N * 40不起作用时，这里是唯一限制，最短是80毫秒！
        }
    }
}

//玩家选择块时的函数
function playerSequence(selected) {

    correctSquare = sequenceList[userCount];//正确数字
    userCount++;//玩家答到第几个数了加一
    thisSquare = simon.getIndex(selected);//玩家选择的块的值，即块在数组中的下标

    if (thisSquare == correctSquare)//选对了
    {
        if (userCount == N)//答到本关最后一个数了
        {
            if (N == sequenceCount)//到最后一关了
            {
                winner = true;//赢了
                setTimeout(function(){restart();}, 3000);
            }
            else//还有下一关
            {
                userCount = 0;//重设：玩家答了0个数了
                currentCount = 0;//重设：出题出了0个数了
                N++;//下一关
                simonSez = true;//出题
            }
        }
    }
    else
    {//选错了
        loser = true;
        setTimeout(function(){restart();}, 3000);
    }

}

//电脑出一个数时的函数
function simonSequence () {

    simonSez = true;
    litSquare = sequenceList[currentCount];
    simon.getAt(litSquare).alpha = 1;
    timeCheck = game.time.now;
    currentCount++;//出几个数了+1

}

//初始化题目
function setUp() {

    for (var i = 0; i < sequenceCount; i++)
    {
        thisSquare = game.rnd.integerInRange(0,5);
        sequenceList.push(thisSquare);
    }

}

//点下触发
function select(item, pointer) {

    if (!simonSez && !intro && !loser && !winner)
    {
        item.alpha = 1;
    }

}

//松手触发
function release(item, pointer) {

    if (!simonSez && !intro && !loser && !winner)
    {
        item.alpha = .25;
        playerSequence(item);
    }
}

//移出触发
function moveOff(item, pointer) {

    if (!simonSez && !intro && !loser && !winner)
    {
        item.alpha = .25;
    }

}

//与别的例子render只用于调试不同，本例中render加入了游戏进程，显示提示信息
function render() {

    if (!intro)
    {
        if (simonSez)
        {
            game.debug.text('Simon Sez', 360, 96, 'rgb(255,0,0)');
        }
        else
        {
            game.debug.text('Your Turn', 360, 96, 'rgb(0,255,0)');
        }
    }
    else
    {
        game.debug.text('Get Ready', 360, 96, 'rgb(0,0,255)');
    }

    if (winner)
    {
        game.debug.text('You Win!', 360, 32, 'rgb(0,0,255)');
    }
    else if (loser)
    {
        game.debug.text('You Lose!', 360, 32, 'rgb(0,0,255)');
    }

}
