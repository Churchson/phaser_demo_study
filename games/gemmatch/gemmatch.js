//此游戏有bug但不重要，目的是研究技术
// Example by https://twitter.com/awapblog

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create });

var GEM_SIZE = 64;//钻石内容边长
var GEM_SPACING = 2;//钻石边距宽度
var GEM_SIZE_SPACED = GEM_SIZE + GEM_SPACING;//钻石总边长
var BOARD_COLS;
var BOARD_ROWS;
var MATCH_MIN = 3; // min number of same color gems required in a row to be considered a match

var gems;
var selectedGem = null;
var selectedGemStartPos;
var selectedGemTween;
var tempShiftedGem = null;
var tempShiftedGemTween;
var allowInput;

function preload() {

    game.load.spritesheet("GEMS", "assets/diamonds32x5.png", GEM_SIZE, GEM_SIZE);

}

function create() {

    // fill the screen with as many gems as possible
    //用钻石填满屏幕
    spawnBoard();

    // currently selected gem starting position. used to stop player form moving gems too far.
    selectedGemStartPos = { x: 0, y: 0 };
    
    // used to disable input while gems are dropping down and respawning
    allowInput = true;

    game.input.addMoveCallback(slideGem, this);//移动精灵事件

}

function releaseGem() {
    console.log("放");

    // when the mouse is released with a gem selected
    // 1) check for matches
    // 2) remove matched gems
    // 3) drop down gems above removed gems
    // 4) refill the board

    console.log("尝试消灭");
    checkAndKillGemMatches(selectedGem);//检查钻石并消灭之

    if (tempShiftedGem !== null)
    {
        console.log("尝试消灭原");
        checkAndKillGemMatches(tempShiftedGem);//检查钻石并消灭之
    }

    removeKilledGems();//将消灭的钻石移到画面外面

    var dropGemDuration = dropGems();//让钻石掉落，这样空格将集中在每列顶部

    // delay board refilling until all existing gems have dropped down
    game.time.events.add(dropGemDuration * 100, refillBoard);//将每列顶部的空格填充为新钻石

    allowInput = false;

    selectedGem = null;
    tempShiftedGem = null;

}

//拖拽动作触发
function slideGem(pointer, x, y, fromClick) {
    // check if a selected gem should be moved and do it
    if(selectedGem){
        console.log("拖");
    }

    if (selectedGem && pointer.isDown)
    {
        var cursorGemPosX = getGemPos(x);//释放位置x
        var cursorGemPosY = getGemPos(y);//释放位置y

        if (checkIfGemCanBeMovedHere(selectedGemStartPos.x, selectedGemStartPos.y, cursorGemPosX, cursorGemPosY))
        {//移动合法
            if (cursorGemPosX !== selectedGem.posX || cursorGemPosY !== selectedGem.posY)
            {//确实要移动而不是不动
                // move currently selected gem
                if (selectedGemTween !== null)
                {
                    game.tweens.remove(selectedGemTween);
                }

                selectedGemTween = tweenGemPos(selectedGem, cursorGemPosX, cursorGemPosY);

                gems.bringToTop(selectedGem);

                // if we moved a gem to make way for the selected gem earlier, move it back into its starting position
                if (tempShiftedGem !== null)
                {
                    tweenGemPos(tempShiftedGem, selectedGem.posX , selectedGem.posY);
                    swapGemPosition(selectedGem, tempShiftedGem);
                }

                // when the player moves the selected gem, we need to swap the position of the selected gem with the gem currently in that position 
                // tempShiftedGem释放目标的原住民
                tempShiftedGem = getGem(cursorGemPosX, cursorGemPosY);

                if (tempShiftedGem === selectedGem)
                {
                    tempShiftedGem = null;
                }
                else
                {
                    tweenGemPos(tempShiftedGem, selectedGem.posX, selectedGem.posY);//侵略者和原住民换位置
                    swapGemPosition(selectedGem, tempShiftedGem);//侵略者和原住民换位置
                }
            }
        }
    }
}

// fill the screen with as many gems as possible
//将钻石填满屏幕
function spawnBoard() {

    BOARD_COLS = Phaser.Math.floor(game.world.width / GEM_SIZE_SPACED);//多少列
    BOARD_ROWS = Phaser.Math.floor(game.world.height / GEM_SIZE_SPACED);//多少行

    gems = game.add.group();//钻石组

    for (var i = 0; i < BOARD_COLS; i++)
    {
        for (var j = 0; j < BOARD_ROWS; j++)
        {
            var gem = gems.create(i * GEM_SIZE_SPACED, j * GEM_SIZE_SPACED, "GEMS");
            gem.name = 'gem' + i.toString() + 'x' + j.toString();//gem1x1之类
            gem.inputEnabled = true;
            gem.events.onInputDown.add(selectGem, this);//鼠标按下事件
            gem.events.onInputUp.add(releaseGem, this);//鼠标松开事件
            randomizeGemColor(gem);//钻石随机颜色
            //让钻石知道自己的位置数据
            setGemPos(gem, i, j); // each gem has a position on the board
        }
    }

}

// select a gem and remember its starting position
function selectGem(gem, pointer) {
    console.log("点");

    if (allowInput)
    {
        selectedGem = gem;
        selectedGemStartPos.x = gem.posX;
        selectedGemStartPos.y = gem.posY;
    }

}

// find a gem on the board according to its position on the board
//从理论位置找钻石
function getGem(posX, posY) {

    return gems.iterate("id", calcGemId(posX, posY), Phaser.Group.RETURN_CHILD);

}

// convert world coordinates to board position
//根据坐标，得知是第几行、第几列
function getGemPos(coordinate) {

    return Phaser.Math.floor(coordinate / GEM_SIZE_SPACED);

}

// set the position on the board for a gem
//设置理论位置
function setGemPos(gem, posX, posY) {

    gem.posX = posX;
    gem.posY = posY;
    gem.id = calcGemId(posX, posY);

}

// the gem id is used by getGem() to find specific gems in the group
// each position on the board has a unique id
//钻石的id，由理论x和理论y组成，用于根据坐标找钻石
function calcGemId(posX, posY) {

    return posX + posY * BOARD_COLS;

}

// since the gems are a spritesheet, their color is the same as the current frame number
//获得钻石颜色，其实就是帧数
function getGemColor(gem) {

    return gem.frame;

}

// set the gem spritesheet to a random frame
function randomizeGemColor(gem) {
    //设置随机颜色，即随机设第几帧
    gem.frame = game.rnd.integerInRange(0, gem.animations.frameTotal - 1);

}

// gems can only be moved 1 square up/down or left/right
//检查移动是否合法
function checkIfGemCanBeMovedHere(fromPosX, fromPosY, toPosX, toPosY) {

    if (toPosX < 0 || toPosX >= BOARD_COLS || toPosY < 0 || toPosY >= BOARD_ROWS)
    {//移出边界外当然不行
        return false;
    }

    if (fromPosX === toPosX && fromPosY >= toPosY - 1 && fromPosY <= toPosY + 1)
    {//同一行且紧邻，可以
        return true;
    }

    if (fromPosY === toPosY && fromPosX >= toPosX - 1 && fromPosX <= toPosX + 1)
    {//同一列且紧邻，可以
        return true;
    }
    //其他不行
    return false;
}

// count how many gems of the same color lie in a given direction
// eg if moveX=1 and moveY=0, it will count how many gems of the same color lie to the right of the gem
// stops counting as soon as a gem of a different color or the board end is encountered
//统计某个方向上颜色连续的钻石数量
function countSameColorGems(startGem, moveX, moveY) {

    var curX = startGem.posX + moveX;
    var curY = startGem.posY + moveY;
    var count = 0;

    while (curX >= 0 && curY >= 0 && curX < BOARD_COLS && curY < BOARD_ROWS && getGemColor(getGem(curX, curY)) === getGemColor(startGem))
    {
        count++;
        curX += moveX;
        curY += moveY;
    }

    return count;

}

// swap the position of 2 gems when the player drags the selected gem into a new location
//交换两个钻石的理论位置
function swapGemPosition(gem1, gem2) {

    var tempPosX = gem1.posX;
    var tempPosY = gem1.posY;
    setGemPos(gem1, gem2.posX, gem2.posY);
    setGemPos(gem2, tempPosX, tempPosY);

}

// count how many gems of the same color are above, below, to the left and right
// if there are more than 3 matched horizontally or vertically, kill those gems
// if no match was made, move the gems back into their starting positions
//检查连续数量并进行消灭
function checkAndKillGemMatches(gem, matchedGems) {

    if (gem !== null)
    {
        var countUp = countSameColorGems(gem, 0, -1);
        var countDown = countSameColorGems(gem, 0, 1);
        var countLeft = countSameColorGems(gem, -1, 0);
        var countRight = countSameColorGems(gem, 1, 0);
        
        var countHoriz = countLeft + countRight + 1;//横向连续颜色钻石个数
        var countVert = countUp + countDown + 1;//纵向连续颜色钻石个数

        if (countVert >= MATCH_MIN)
        {//纵向达标
            killGemRange(gem.posX, gem.posY - countUp, gem.posX, gem.posY + countDown);
        }

        if (countHoriz >= MATCH_MIN)
        {//横向达标
            killGemRange(gem.posX - countLeft, gem.posY, gem.posX + countRight, gem.posY);
        }

        //都不达标
        if (countVert < MATCH_MIN && countHoriz < MATCH_MIN)
        {
            if (gem !== tempShiftedGem)//修改后，判断正在检查的不是原住民
            {
                if (selectedGemTween !== null)
                {
                    game.tweens.remove(selectedGemTween);
                }

                selectedGemTween = tweenGemPos(gem, selectedGemStartPos.x, selectedGemStartPos.y);

                if (tempShiftedGem !== null)
                {
                    tweenGemPos(tempShiftedGem, gem.posX, gem.posY);
                }

                //恢复换位
                swapGemPosition(gem, tempShiftedGem);
            }
        }
    }

}

// kill all gems from a starting position to an end position
//消灭指定区域内的全部钻石
function killGemRange(fromX, fromY, toX, toY) {

    fromX = Phaser.Math.clamp(fromX, 0, BOARD_COLS - 1);
    fromY = Phaser.Math.clamp(fromY , 0, BOARD_ROWS - 1);
    toX = Phaser.Math.clamp(toX, 0, BOARD_COLS - 1);
    toY = Phaser.Math.clamp(toY, 0, BOARD_ROWS - 1);

    for (var i = fromX; i <= toX; i++)
    {
        for (var j = fromY; j <= toY; j++)
        {
            var gem = getGem(i, j);
            gem.kill();
        }
    }

}

// move gems that have been killed off the board
//将消灭的钻石移到画面外面
function removeKilledGems() {

    gems.forEach(function(gem) {
        if (!gem.alive) {
            setGemPos(gem, -1,-1);
        }
    });

}

//移动钻石
// animated gem movement
function tweenGemPos(gem, newPosX, newPosY, durationMultiplier) {

    if (durationMultiplier === null || typeof durationMultiplier === 'undefined')
    {
        durationMultiplier = 1;
    }

    return game.add.tween(gem).to({x: newPosX  * GEM_SIZE_SPACED, y: newPosY * GEM_SIZE_SPACED}, 100 * durationMultiplier, Phaser.Easing.Linear.None, true);

}

// look for gems with empty space beneath them and move them down
//钻石掉落
function dropGems() {

    var dropRowCountMax = 0;//掉落最多的列的总掉落数

    //从左往右
    for (var i = 0; i < BOARD_COLS; i++)
    {
        var dropRowCount = 0;//本列的掉落数
        //从下往上检查
        for (var j = BOARD_ROWS - 1; j >= 0; j--)
        {
            var gem = getGem(i, j);//根据理论位置找而不是画面位置

            if (gem === null)
            {//发现空格，记录总空格数量
                dropRowCount++;
            }//发现钻石，将它扔下去
            else if (dropRowCount > 0)
            {
                setGemPos(gem, gem.posX, gem.posY + dropRowCount);//改变理论位置，这会使钻石原位置变空，而原空格变满
                tweenGemPos(gem, gem.posX, gem.posY, dropRowCount);//改变画面位置，播放动画让钻石从原位置移动到目标位置
            }
        }

        dropRowCountMax = Math.max(dropRowCount, dropRowCountMax);
    }

    return dropRowCountMax;

}

// look for any empty spots on the board and spawn new gems in their place that fall down from above
//将每列顶部的空白格填充新钻石
function refillBoard() {

    var maxGemsMissingFromCol = 0;

    for (var i = 0; i < BOARD_COLS; i++)
    {
        var gemsMissingFromCol = 0;//统计该列最大缺失数

        for (var j = BOARD_ROWS - 1; j >= 0; j--)
        {
            var gem = getGem(i, j);

            if (gem === null)
            {
                gemsMissingFromCol++;
                gem = gems.getFirstDead();
                gem.reset(i * GEM_SIZE_SPACED, -gemsMissingFromCol * GEM_SIZE_SPACED);//放到世界外面，即该列顶上
                randomizeGemColor(gem);//设随机颜色
                setGemPos(gem, i, j);//设钻石该在的位置
                tweenGemPos(gem, gem.posX, gem.posY, gemsMissingFromCol * 2);
            }
        }

        maxGemsMissingFromCol = Math.max(maxGemsMissingFromCol, gemsMissingFromCol);//缺失最多的列的缺失数
    }

    game.time.events.add(maxGemsMissingFromCol * 2 * 100, boardRefilled);//延时时间：缺失数*200

}

// when the board has finished refilling, re-enable player input
function boardRefilled() {

    allowInput = true;

}
