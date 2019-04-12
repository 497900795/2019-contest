var Game = function() {
    var cvs = document.getElementById('canvas');
    cvs.height = 640;
    cvs.width = 640;
    var ctx = cvs.getContext('2d');
    //所有需要用的资源
    var material = {
		"block" : "images/block.gif",
		"wall" : "images/wall.png",
		"box" : "images/box.png",
		"ball" : "images/ball.png",
		"up" : "images/up.png",
		"down" : "images/down.png",
		"left" : "images/left.png",
		"right" : "images/right.png",
    }
    //预加载
    var imgs = {}; 
    for(var i in material) {
        var image = new Image();
        image.src = material[i];
        imgs[i] = image;
    }
   
    //硬性修改图片宽高
    this.w = 40;
    this.h = 40;
    //当前游戏属性
    this.curMap = [];//当前地图
    this.curLevel = 0;//当前关卡，默认为1
	this.curMan = imgs.down;//当前小人的图片，小人四个方向对应四张图片，默认向下
    this.moveSteps = 0;//移动了多少次
    this.difficult = 0;//难度
    //最大步数,对应不同难度
    this.steps = [1000, 500, 200];

    this.peoplePos = {
        x: 0,
        y: 0
    }

    //加载关卡
    this.loadLevel = function() {
        //移动步数清零
        this.moveSteps = 0;
        //设置移动信息
        document.getElementsByClassName('move-steps')[0].innerHTML = "您已经走了0步";
        document.getElementsByClassName('rest-steps')[0].innerHTML = `剩余${this.steps[this.difficult]}步`
        //清空
        this.curMap = [];
        for(var i = 0; i < levels[this.curLevel].length; i++) {
            this.curMap.push([]);
            for(var j = 0; j < levels[this.curLevel][i].length; j++) {
                this.curMap[i].push(levels[this.curLevel][i][j]);
            }
        }
    }

    //绘图
    this.draw = function() {
        //绘制地板
        for(var i = 0; i < 16; i++) {
            for(var j = 0; j < 16; j++) {
                ctx.drawImage(imgs.block, this.w*j, this.h*i, this.w, this.h);
            }
        }
        
        //绘制元素
        for(var i = 0; i < 16; i++) {
            for(var j = 0; j < 16; j++) {
                var curPic;
                //1 => 墙壁
                //2 => 目标
                //3 => 箱子
                //4 => 人
                switch(this.curMap[i][j]) {
                    case 0:
                        continue;
                    case 1:
                        curPic = imgs.wall;
                        break;
                    case 2:
                        curPic = imgs.ball;
                        break;;
                    case 3:
                        curPic = imgs.box;
                        break;
                    case 4:
                        curPic = this.curMan;
                        //确定小人位置
                        this.peoplePos.x = j;
                        this.peoplePos.y = i;
                        break;
                    case 5:
                        curPic = imgs.box;
                        break;
                }
                ctx.drawImage(curPic, this.w*j, this.h*i, this.w, this.h);
            }
        }
    }

    //跳关
    this.jumpLevel = function() {
        var nextLevel = document.getElementsByClassName('jmp-level')[0].value;
        this.curLevel = nextLevel - 1;
        this.loadLevel();
        this.draw();
    }

    //移动
    this.move = function(dir) {
        var pre1 , pre2;
        switch(dir) {
            case 'left':
                this.curMan = imgs.left;
                pre1 = {x: this.peoplePos.x-1, y: this.peoplePos.y};
                pre2 = {x: this.peoplePos.x-2, y: this.peoplePos.y};
                break;
            case 'right':
                this.curMan = imgs.right;
                pre1 = {x: this.peoplePos.x+1, y: this.peoplePos.y};
                pre2 = {x: this.peoplePos.x+2, y: this.peoplePos.y};
                break;
            case 'up':
                this.curMan = imgs.up;
                pre1 = {x: this.peoplePos.x, y: this.peoplePos.y-1};
                pre2 = {x: this.peoplePos.x, y: this.peoplePos.y-2};
                break;
            case 'down':
                this.curMan = imgs.down;
                pre1 = {x: this.peoplePos.x, y: this.peoplePos.y+1};
                pre2 = {x: this.peoplePos.x, y: this.peoplePos.y+2};
                break;
        }
        //可以走
        if(this.ensureMove(pre1, pre2)) {
            //计步
            this.moveSteps++;
             //设置移动信息
            document.getElementsByClassName('move-steps')[0].innerHTML = `您已经走了${this.moveSteps}步`;
            document.getElementsByClassName('rest-steps')[0].innerHTML = `剩余${this.steps[this.difficult] - this.moveSteps}步`;
            this.draw();
        }

        if(this.judegeWin()) {
            //异步处理，保证在移动后弹出提示框
            setTimeout(() => {
                alert('胜利');
                this.chgLevel(1);
            }, 0);
        }

        if(this.judegeLose()) {
            console.log(this.moveSteps)
            var self = this;
            setTimeout(() => {
                alert('失败');
                this.reStart();
            }, 0);
        }
    }

    //确认可以移动
    this.ensureMove = function(p1, p2) {
        //出界
        if(p1.x < 0 || p1.x > 15 || p1.y < 0 || p1.y > 15) {
            return false;
        }
        //撞墙
        if(this.curMap[p1.y][p1.x] == 1) {
            return false;
        }
        //推到了箱子
        if(this.curMap[p1.y][p1.x] == 3) {
            //前边是箱子或者墙
            if(this.curMap[p2.y][p2.x] == 3 || this.curMap[p2.y][p2.x] == 1) {
                return false;
            }
            //可以推就把箱子移动
            this.curMap[p2.y][p2.x] = 3;
        }
        //一般情况
        this.curMap[p1.y][p1.x] = 4;
        //之前的位置,要从levels直接拉取
        var v = levels[this.curLevel][this.peoplePos.y][this.peoplePos.x];
        //不是目标
        if (v != 2) {
            //放了箱子的目标
			if (v == 5) {
				v = 2;
            }
            else {
				v = 0;
			}
        }
        //更新
        this.curMap[this.peoplePos.y][this.peoplePos.x] = v;
		perPosition = p1;
		//若果小动了 返回true 指代能够移动小人
		return true;
    }

    //判断胜利
    this.judegeWin = function() {
        for(var i = 0; i < this.curMap.length; i++) {
            for(var j = 0; j < this.curMap[i].length; j++) {
                //console.log(this.curMap[i][j])
                //原生地图和新地图比较,目标位置不是箱子就没有完成
                if(this.curMap[i][j] != 3 && levels[this.curLevel][i][j] == 2 ||
                    this.curMap[i][j] != 3 && levels[this.curLevel][i][j] == 5) {
                    return false;
                }
            }
        }
        return true;
    }

    this.judegeLose = function() {
        //步数用完救输了
        if(this.moveSteps == this.steps[this.difficult]) {
            return true;
        }
        else {
            return false;
        }
    }

    //去相邻level
    this.chgLevel = function(n) {
        if(n == -1) {
            this.curLevel--;
            this.loadLevel();
        }
        else {
            this.curLevel++;
            this.loadLevel();
        }
        this.draw();
    }

    //重玩本关
    this.reStart = function() {
        this.loadLevel();
        this.draw();
    }

    //修改难度
    this.chgDifficult = function(n) {
        //修改难度
        this.difficult = n;
        //重开
        this.reStart();
    }
}

window.onload = function() {
    //初始界面是第一关
    var game = new Game();
    //跳关
    var el = document.getElementsByClassName('en-jmp')[0];
    el.onclick = function() {
        game.jumpLevel();
    }

    //上一关
    el = document.getElementsByClassName('pre-level')[0];
    el.onclick = function() {
        game.chgLevel(-1);
        game.draw();
    }

    //下一关
    el = document.getElementsByClassName('next-level')[0];
    el.onclick = function() {
        game.chgLevel(1);
        game.draw();
    }

    //重新开始
    el = document.getElementsByClassName('re-start')[0];
    el.onclick = function() {
        game.reStart();
    }

    //修改难度
    var els = document.getElementsByClassName('to-difficult');
    for(let i = 0; i < els.length; i++) {
        els[i].onclick = function() {
            game.chgDifficult(i);
        }
    }

    //移动事件
    window.onkeydown = function(ev) {
        if(ev.key.toLowerCase() == 'w') {
            game.move('up');
        }
        else if(ev.key.toLowerCase() == 'd') {
            game.move('right');
        }
        else if(ev.key.toLowerCase() == 's') {
            game.move('down');
        }
        else if(ev.key.toLowerCase() == 'a') {
            game.move('left');
        }
    }
}



