var CANVAS_WIDTH = 600;
var CANVAS_HEIGHT = 400;
var FPS = 25;
var INC = 0.5;
var ACCUMULATOR = 0;
var start_enemy_speed = 11.0;
var enemy_speed;
var context2D;
var pages = [];
var edit;
var game;
var PLAYER_WIDTH = 100;
var ENEMY_WIDTH = 200;
var PLAYER_HEIGHT = 240;
var pre_load_timer = 0;
var current_score = 0;
var QU_DELTA = 15;
var DAN_DELTA = 20;
var REL_PATH = "/assets/aikidos/";

var enemy_type = 0;
var start_hit_frame = 5;
var end_hit_frame = 60;

var sound_enabled = 0;
var sound_fade_to = 0;
var sound_current = 0;
var PLAYER_FIRST_IMAGE;

var current_game_type;
var score_data;

var show_masters = false;
var novice_highlight = false;
var master_highlight = false;
var choose_url = false;
var records_back = false;
var records_url = false;
var records_master = false;
var records_novice = false;
var current_table = 0;
var game_url = false;
var game_mouse = false;
var game_q = false;
var game_w = false;
var game_e = false;
var game_r = false;
var play_again = false;
var goto_list = false;
var add_new_score = false;
var add_score = false;
var new_name = "";

var table_list;
var table_pos;
var table_page_count;
var table_scroll_delta;
var on_scroll, on_scroll_move;

var req = null;
var sreq = null;
var isIE = false;
var first_table = false;
function load_table() {
  url = REL_PATH + "proxy.php";

  if (req == null) {
    first_table = true;
    if (window.XMLHttpRequest) {
      req = new XMLHttpRequest();
      req.onreadystatechange = processReqChange;
      req.open("GET", url, true);
      req.send(null);
    } else if (window.ActiveXObject) {
      isIE = true;
      req = new ActiveXObject("Microsoft.XMLHTTP");
      if (req) {
        req.onreadystatechange = processReqChange;
        req.open("GET", url, true);
        req.send();
      }
    }
  } else {
    req.abort();
    first_table = true;
    req.open("GET", url, true);
    if (isIE) req.send();
    else req.send(null);
  }
}

function processReqChange() {
  if (req.readyState == 4) {
    if (req.status == 200) {
      table_list = eval("(" + req.responseText + ")");
      table_page_count = [
        get_keys_count(table_list[0]) - 7,
        get_keys_count(table_list[1]) - 7,
      ];
      table_scroll_delta = [
        table_page_count[0] > 0 ? 130 / table_page_count[0] : 0,
        table_page_count[1] > 0 ? 130 / table_page_count[1] : 0,
      ];
    }
  }
}

function get_keys_count(obj) {
  var count = 0;
  for (var k in obj) {
    if (obj.hasOwnProperty(k)) {
      ++count;
    }
  }
  return count;
}

function CResourceImage(src) {
  this._src = src;

  CResourceImage.prototype.load = function (on_load) {
    this._image = new Image();
    this._image.alt = "Image";
    this._image.onload = function () {
      on_load.on_res_load.call(on_load);
    };
    //	this._image.addEventListener('load',function() { on_load.on_res_load.call(on_load) },false);
    this._image.src = this._src;
  };
}

function CResourceAudio(src) {
  this._src = src;

  CResourceAudio.prototype.load = function (on_load) {};

  var loop_handler = function () {
    this.currentTime = 0;
    this.play();
  };

  CResourceAudio.prototype.set_loop = function (loop) {
    if (typeof this._audio.loop == "boolean") {
      this._audio.loop = loop;
    } else {
      if (loop) this._audio.addEventListener("ended", loop_handler, false);
      else this._audio.removeEventListener("ended", loop_handler, false);
    }
  };
}

function CResourceManager() {
  this.res_list = [];
  this.loaded = 0;

  CResourceManager.prototype.add_image = function (res) {
    this.res_list[this.res_list.length] = new CResourceImage(res);
  };

  /*	CResourceManager.prototype.add_audio=function(res){
		this.res_list[this.res_list.length]=new CResourceAudio(res);
	};
*/
  CResourceManager.prototype.on_res_load = function () {
    this.loaded++;

    if (this.loaded == this.res_list.length) this.on_load();
  };

  CResourceManager.prototype.load = function (on_load) {
    this.on_load = on_load;
    for (var i = this.loaded; i < this.res_list.length; i++) {
      this.res_list[i].load(this);
    }
  };
}

var resource_manager = new CResourceManager();
var current_frame_player = 0,
  current_frame_enemy = 0,
  stage = -2,
  pre_stage = 0,
  success_attack = -1,
  enemy_pos = CANVAS_WIDTH,
  emo = 0;
var ticks = 0;
var timer;

function update() {
  if (sound_fade_to != sound_current) {
    var smaller = sound_fade_to < sound_current;
    sound_current = sound_current + (smaller ? -0.01 : 0.01);
    if (
      (sound_current < sound_fade_to && smaller) ||
      (sound_current > sound_fade_to && !smaller)
    )
      sound_current = sound_fade_to;
    //	resource_manager.res_list[39]._audio.volume=sound_current;
    //resource_manager.res_list[40]._audio.volume=sound_current;
  }
  if (stage == 0) {
    current_frame_player++;
    if (current_frame_player == 24) {
      current_frame_player = 0;
      emo = 0;
    }

    if (pre_stage == 0) {
      enemy_pos -= enemy_speed;
    }

    current_frame_enemy++;

    if (current_game_type == 0) {
      game_mouse =
        enemy_pos > 196 + start_hit_frame && enemy_pos < 196 + end_hit_frame;
    }
    if (current_game_type == 1) {
      if (enemy_type == 0)
        game_q =
          enemy_pos > 196 + start_hit_frame && enemy_pos < 196 + end_hit_frame;
      if (enemy_type == 1)
        game_w =
          enemy_pos > 196 + start_hit_frame && enemy_pos < 196 + end_hit_frame;
      if (enemy_type == 2)
        game_e =
          enemy_pos > 196 + start_hit_frame && enemy_pos < 196 + end_hit_frame;
      if (enemy_type == 3)
        game_r =
          enemy_pos > 196 + start_hit_frame && enemy_pos < 196 + end_hit_frame;
    }

    if (pre_stage == 0 && enemy_pos <= 196) {
      pre_stage = 1;
      current_frame_enemy = 0;
      enemy_pos = 196;
    }

    if (current_frame_enemy == (pre_stage == 0 ? 12 : 0)) {
      if (pre_stage == 1) {
        current_frame_player = 0;
        ACCUMULATOR = 0;
        if (success_attack == -1) success_attack = 0;
        stage = success_attack + 1;
      }
      current_frame_enemy = 0;
    }

    if (success_attack != 0) {
      current_score++;
    }
  } else if (stage == 1) {
    ACCUMULATOR += INC;
    if (ACCUMULATOR >= 1) {
      current_frame_player++;
      ACCUMULATOR = 0;
    }
    if (current_frame_player == 24) {
      current_frame_player = 0;
      stage = 3;
    }
  } else if (stage == 2) {
    ACCUMULATOR += INC;
    if (ACCUMULATOR >= 1) {
      current_frame_player++;
      ACCUMULATOR = 0;
    }
    if (
      (enemy_type == 2 && current_frame_player == 36) ||
      (enemy_type != 2 && current_frame_player == 24)
    ) {
      if (success_attack == 1) {
        enemy_pos = CANVAS_WIDTH;
        current_frame_player = 0;
        success_attack = -1;
        stage = 0;
        pre_stage = 0;
        enemy_speed += 0.3;
        enemy_type = (Math.random() * 4) | 0;
        if (enemy_type == 4) enemy_type = 3;

        emo = (1 + Math.random() * 3) | 0;
        if (emo == 4) emo = 3;
      } else stage = 3;
    }

    if (success_attack != 0) current_score++;
  }
}

var LoadingElement = {
  position: 0,
  RGB: { r: 0, g: 0, b: 0, a: 1.0 },
  desc: { x: 300, y: 490, length: 1.0, count: 50, radius: 30, speed: 1.0 },
};
LoadingElement.draw = function () {
  var step = (2 * Math.PI * this.desc.length) / this.desc.count;
  var x, y, part;
  for (i = 0; i < this.desc.count; i++) {
    part = Math.max(1 - i / this.desc.count, 0.2);

    context2D.fillStyle =
      "rgba(" +
      this.RGB.r +
      "," +
      this.RGB.g +
      "," +
      this.RGB.b +
      "," +
      (this.RGB.a - i / (this.desc.count - 1)) +
      ")";
    context2D.beginPath();

    x = Math.cos(this.position - step * i - Math.PI / 2) * this.desc.radius;
    y = Math.sin(this.position - step * i - Math.PI / 2) * this.desc.radius;

    context2D.arc(
      this.desc.x + x,
      this.desc.y + y,
      this.desc.radius * 0.14 * part,
      0,
      2 * Math.PI,
      false
    );

    context2D.closePath();
    context2D.fill();
  }
  this.position += ((2 * Math.PI) / FPS) * this.desc.speed;
};

var load_angle = 0;

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == "undefined") {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
  }
  if (fill) {
    ctx.fill();
  }
}

function get_digit_count(number) {
  if (number == 0) return 1;

  var digit_score = number;
  var c = 0;

  while (digit_score) {
    digit_score = (digit_score / 10) | 0;
    c++;
  }

  return c;
}

function draw_number(res, x, y, w, h, score) {
  var digit_score = score;
  var pow10;
  var digit;
  var i = 1;

  if (score == 0)
    context2D.drawImage(
      resource_manager.res_list[res]._image,
      0,
      0,
      w,
      h,
      x - w,
      y,
      w,
      h
    );
  else
    while (digit_score) {
      digit_score = (digit_score / 10) | 0;
      pow10 = Math.pow(10, i);
      digit =
        ((score - ((score / pow10) | 0) * pow10) / Math.pow(10, i - 1)) | 0;
      context2D.drawImage(
        resource_manager.res_list[res]._image,
        digit * w,
        0,
        w,
        h,
        x - w * i,
        y,
        w,
        h
      );
      i++;
    }
}

function render() {
  context2D.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context2D.fillStyle = "#000000";
  context2D.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (stage == -2 || pre_load_timer >= 0) {
    context2D.drawImage(resource_manager.res_list[1]._image, 0, 0);

    context2D.save();
    context2D.translate(414 + 15.5, 343 + 14);
    context2D.rotate(load_angle);
    context2D.drawImage(resource_manager.res_list[0]._image, -15.5, -14);
    context2D.restore();
    load_angle -= Math.PI / 20;

    pre_load_timer += 1000 / FPS;

    if (pre_load_timer > 2000 && stage == -1) pre_load_timer = -1;
  } else if (stage == -1) {
    context2D.drawImage(resource_manager.res_list[2]._image, 0, 0);
    if (show_masters)
      context2D.drawImage(resource_manager.res_list[6]._image, 0, 354);
    if (novice_highlight)
      context2D.drawImage(resource_manager.res_list[7]._image, 0, 105);
    if (master_highlight)
      context2D.drawImage(resource_manager.res_list[8]._image, 280, 122);
    if (choose_url)
      context2D.drawImage(resource_manager.res_list[9]._image, 476, 354);
  } else if (stage == -3) {
    context2D.drawImage(resource_manager.res_list[3]._image, 0, 0);
    if (records_back)
      context2D.drawImage(resource_manager.res_list[32]._image, 10, 361);
    if (records_url)
      context2D.drawImage(resource_manager.res_list[31]._image, 490, 361);

    if (current_table == 0)
      context2D.drawImage(resource_manager.res_list[27]._image, 30, 140);
    else if (records_master)
      context2D.drawImage(resource_manager.res_list[26]._image, 30, 140);
    else context2D.drawImage(resource_manager.res_list[25]._image, 30, 140);

    if (current_table == 1)
      context2D.drawImage(resource_manager.res_list[30]._image, 190, 140);
    else if (records_novice)
      context2D.drawImage(resource_manager.res_list[29]._image, 190, 140);
    else context2D.drawImage(resource_manager.res_list[28]._image, 190, 140);

    var iCount = get_keys_count(table_list[current_table]);
    if (iCount > 0) {
      context2D.font = "11pt Calibri,sans-serif";
      context2D.fillStyle = "#000";
      context2D.textBaseline = "top";
      var item;
      var qu;
      var dan;
      for (var i = 0; i < 7; i++) {
        item = table_list[current_table][table_pos[current_table] + i];

        context2D.fillText(
          table_pos[current_table] + i + 1 + ".",
          43,
          166 + i * 24
        );
        context2D.fillText(item.player_name, 80, 166 + i * 24);
        context2D.textAlign = "center";

        qu = ((item.player_score / QU_DELTA) | 0) + 1;
        qu = Math.max(11 - qu, 1);
        dan = 0;
        if (current_table == 0 && item.player_score - 10 * QU_DELTA >= 0) {
          dan = (((item.player_score - 10 * QU_DELTA) / DAN_DELTA) | 0) + 1;
          dan = Math.min(dan, 10);
        }

        context2D.fillText(
          dan == 0 ? qu + " кю" : dan + " дан",
          337,
          166 + i * 24
        );
        context2D.textAlign = "left";
        context2D.fillText(item.player_score, 425, 166 + i * 24);

        if (table_pos[current_table] + i + 1 >= iCount) break;
      }

      if (table_page_count[current_table] > 0) {
        var x = 554,
          y =
            164 + table_pos[current_table] * table_scroll_delta[current_table];
        context2D.fillStyle = on_scroll ? "#ff8080" : "#fc5a4f";
        context2D.fillRect(x, y, 12, 42);
      }
    } else {
      LoadingElement.draw();
    }
    /*
		context2D.fillStyle='#112233';
		roundRect(context2D,10,10,100,100,3,true,false);*/
  } else {
    context2D.drawImage(
      resource_manager.res_list[current_game_type == 0 ? 4 : 5]._image,
      0,
      0
    );
    if (current_game_type == 0) {
      if (game_mouse)
        context2D.drawImage(resource_manager.res_list[21]._image, 20, 339);
    }
    if (current_game_type == 1) {
      if (game_q)
        context2D.drawImage(resource_manager.res_list[17]._image, 20, 350);
      if (game_w)
        context2D.drawImage(resource_manager.res_list[18]._image, 55, 350);
      if (game_e)
        context2D.drawImage(resource_manager.res_list[19]._image, 90, 350);
      if (game_r)
        context2D.drawImage(resource_manager.res_list[20]._image, 125, 350);
    }

    if (game_url) {
      context2D.drawImage(resource_manager.res_list[10]._image, 494, 364);
    }

    var score = ((current_score * FPS) / 1000) | 0;

    draw_number(12, 580, 20, 24, 32, score);

    var qu = ((score / QU_DELTA) | 0) + 1;
    qu = Math.max(11 - qu, 1);
    var dan = 0;
    if (current_game_type == 1 && score - 10 * QU_DELTA >= 0) {
      dan = (((score - 10 * QU_DELTA) / DAN_DELTA) | 0) + 1;
      dan = Math.min(dan, 10);
    }

    if (current_game_type == 0 || dan == 0) {
      draw_number(15, 43, 20, 16, 21, qu);
      context2D.drawImage(resource_manager.res_list[14]._image, 53, 20);
    } else {
      draw_number(15, 43, 20, 16, 21, dan);
      context2D.drawImage(resource_manager.res_list[35]._image, 53, 17);
    }

    if (stage == 0) {
      if (emo)
        context2D.drawImage(
          resource_manager.res_list[35 + emo]._image,
          PLAYER_WIDTH * current_frame_player,
          0,
          PLAYER_WIDTH,
          PLAYER_HEIGHT,
          109,
          80,
          PLAYER_WIDTH,
          PLAYER_HEIGHT
        );
      else
        context2D.drawImage(
          resource_manager.res_list[PLAYER_FIRST_IMAGE]._image,
          PLAYER_WIDTH * current_frame_player,
          0,
          PLAYER_WIDTH,
          PLAYER_HEIGHT,
          109,
          80,
          PLAYER_WIDTH,
          PLAYER_HEIGHT
        );
      if (enemy_speed > 103 && pre_stage == 0) {
        context2D.globalAlpha = 0.125;
        context2D.drawImage(
          resource_manager.res_list[PLAYER_FIRST_IMAGE + enemy_type * 3 + 1]
            ._image,
          ENEMY_WIDTH * current_frame_enemy,
          0,
          ENEMY_WIDTH,
          PLAYER_HEIGHT,
          enemy_pos + (8 * enemy_speed) / 3,
          80,
          ENEMY_WIDTH,
          PLAYER_HEIGHT
        );
        context2D.drawImage(
          resource_manager.res_list[PLAYER_FIRST_IMAGE + enemy_type * 3 + 1]
            ._image,
          ENEMY_WIDTH * current_frame_enemy,
          0,
          ENEMY_WIDTH,
          PLAYER_HEIGHT,
          enemy_pos + (4 * enemy_speed) / 3,
          80,
          ENEMY_WIDTH,
          PLAYER_HEIGHT
        );
        context2D.drawImage(
          resource_manager.res_list[PLAYER_FIRST_IMAGE + enemy_type * 3 + 1]
            ._image,
          ENEMY_WIDTH * current_frame_enemy,
          0,
          ENEMY_WIDTH,
          PLAYER_HEIGHT,
          enemy_pos + (2 * enemy_speed) / 3,
          80,
          ENEMY_WIDTH,
          PLAYER_HEIGHT
        );
        context2D.globalAlpha = 1.0;
      }
      context2D.drawImage(
        resource_manager.res_list[PLAYER_FIRST_IMAGE + enemy_type * 3 + 1]
          ._image,
        ENEMY_WIDTH * current_frame_enemy,
        0,
        ENEMY_WIDTH,
        PLAYER_HEIGHT,
        enemy_pos,
        80,
        ENEMY_WIDTH,
        PLAYER_HEIGHT
      );
    } else if (stage == 1) {
      context2D.drawImage(
        resource_manager.res_list[PLAYER_FIRST_IMAGE + enemy_type * 3 + 2]
          ._image,
        500 * current_frame_player,
        0,
        500,
        PLAYER_HEIGHT,
        0,
        80,
        500,
        PLAYER_HEIGHT
      );
    } else if (stage == 2) {
      var frame_width = enemy_type == 0 || enemy_type == 3 ? 600 : 500;
      context2D.drawImage(
        resource_manager.res_list[PLAYER_FIRST_IMAGE + enemy_type * 3 + 3]
          ._image,
        frame_width * current_frame_player,
        0,
        frame_width,
        PLAYER_HEIGHT,
        0,
        80,
        frame_width,
        PLAYER_HEIGHT
      );
    } else if (stage == 3) {
      context2D.fillStyle = "rgba(0,0,0,0.5)";
      context2D.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      context2D.fill();

      if (add_new_score) {
        context2D.drawImage(resource_manager.res_list[33]._image, 151, 118);
        if (add_score)
          context2D.drawImage(resource_manager.res_list[34]._image, 250, 234);

        /*context2D.font="15pt Calibri,sans-serif";
				context2D.fillStyle='#000';
				context2D.textBaseline="top";
				context2D.textAlign="center";
				context2D.fillText(new_name,300,184);
				context2D.textAlign="left";*/
      } else {
        /*			if ((current_game_type==0 && (score>score_data.novice.min_score || score_data.novice.count<100)) || (current_game_type==1 && (score>score_data.master.min_score || score_data.master.count<100))){
				context2D.drawImage(resource_manager.res_list[24]._image,150,120);
				if (goto_list)
					context2D.drawImage(resource_manager.res_list[23]._image,230,225);
				if (play_again)
					context2D.drawImage(resource_manager.res_list[16]._image,230,255);

				draw_number(22,300+get_digit_count(score)*9,155,18,25,score);
			}
			else*/
        context2D.drawImage(resource_manager.res_list[11]._image, 150, 118);
        if (play_again)
          context2D.drawImage(resource_manager.res_list[16]._image, 230, 235);

        draw_number(22, 300 + get_digit_count(score) * 9, 173, 18, 25, score);
      }
    }

    /*context2D.fillStyle='#0000FF';
		context2D.fillText("|",196+start_hit_frame,70);
		context2D.fillText("|",196+end_hit_frame,70);
		context2D.fillStyle='#00FF00';
		context2D.fillText("|",enemy_pos,70);*/
  }
}

function draw() {
  update();
  render();
}

function OnKeyDown(e) {
  if (add_new_score) {
    /*if (e.keyCode==8){
			if (new_name.length>0)
				new_name=new_name.slice(0,-1);
			e.preventDefault();
		}*/
  } else if (current_game_type == 1) {
    var key =
      (enemy_type == 0 && e.keyCode == 81) ||
      (enemy_type == 1 && e.keyCode == 87) ||
      (enemy_type == 2 && e.keyCode == 69) ||
      (enemy_type == 3 && e.keyCode == 82);
    if (success_attack == -1) {
      success_attack =
        enemy_pos > 196 + start_hit_frame &&
        enemy_pos < 196 + end_hit_frame &&
        key;
      enemy_pos = 196;
    }
  }
}

function OnKeyPress(e) {
  if (add_new_score) {
    /*if (new_name.length<17)
			new_name+=String.fromCharCode(e.which);*/
  }
}

function OnResize() {
  game.style.width = CANVAS_WIDTH + "px";
  game.style.height = CANVAS_HEIGHT + "px";
  //game.style.marginLeft=(-CANVAS_WIDTH/2)+'px';
  //game.style.marginTop=(-CANVAS_HEIGHT/2)+'px';
}

function OnMouseMove(e) {
  //	var x=e.clientX-document.documentElement.scrollLeft-document.getElementById("game").offsetParent.offsetLeft-document.getElementById("game").offsetLeft;
  //    var y=e.clientY+$(window).scrollTop()-document.getElementById("game").offsetParent.offsetTop-document.getElementById("game").offsetTop;

  var x = e.offsetX == undefined ? e.layerX : e.offsetX;
  var y = e.offsetY == undefined ? e.layerY : e.offsetY;

  if (stage == -1 && pre_load_timer < 0) {
    novice_highlight = false;
    master_highlight = false;
    show_masters = false;
    choose_url = false;

    if (x > 4 && y > 139 && x < 266 && y < 283) {
      novice_highlight = true;
    }
    if (x > 311 && y > 161 && x < 595 && y < 308) {
      master_highlight = true;
    }
    if (x > 20 && y > 363 && x < 236 && y < 386) {
      show_masters = true;
    }
    if (x > 499 && y > 363 && x < 580 && y < 386) {
      choose_url = true;
    }
  } else if (stage == -3) {
    records_back = false;
    records_url = false;
    records_master = false;
    records_novice = false;

    on_scroll = on_scroll_move;

    if (on_scroll_move) {
      var sy = (y < 164 ? 164 : y > 294 ? 294 : y) - 164;
      table_pos[current_table] = Math.round(
        sy / table_scroll_delta[current_table]
      );
    } else {
      if (x > 20 && y > 366 && x < 168 && y < 383) {
        records_back = true;
      }
      if (x > 499 && y > 363 && x < 580 && y < 386) {
        records_url = true;
      }
      if (x > 30 && y > 140 && x < 190 && y < 160 && current_table != 0) {
        records_master = true;
      }
      if (x > 190 && y > 140 && x < 350 && y < 160 && current_table != 1) {
        records_novice = true;
      }
      var sy =
        164 + table_pos[current_table] * table_scroll_delta[current_table];
      if (x > 554 && y > sy && x < 566 && y < sy + 42) {
        on_scroll = true;
      }
    }
  } else if (stage == 0 || stage == 1 || stage == 2) {
    game_url = false;
    if (x > 499 && y > 363 && x < 580 && y < 386) {
      game_url = true;
    }
  } else if (stage == 3) {
    play_again = false;
    goto_list = false;
    add_score = false;
    var score = ((current_score * FPS) / 1000) | 0;
    if (add_new_score) {
      if (x > 250 && y > 234 && x < 350 && y < 254) {
        add_score = true;
      }
    } else if (
      (current_game_type == 0 &&
        (score > score_data.novice.min_score ||
          score_data.novice.count < 100)) ||
      (current_game_type == 1 &&
        (score > score_data.master.min_score || score_data.master.count < 100))
    ) {
      if (x > 230 && y > 225 && x < 370 && y < 245) goto_list = true;
      if (x > 230 && y > 255 && x < 370 && y < 275) play_again = true;
    } else if (x > 230 && y > 235 && x < 370 && y < 255) {
      play_again = true;
    }
  }
}

function OnMouseUp(e) {
  //var x=e.clientX-document.documentElement.scrollLeft-document.getElementById("game").offsetParent.offsetLeft-document.getElementById("game").offsetLeft;
  //var y=e.clientY+$(window).scrollTop()-document.getElementById("game").offsetParent.offsetTop-document.getElementById("game").offsetTop;

  var x = e.offsetX == undefined ? e.layerX : e.offsetX;
  var y = e.offsetY == undefined ? e.layerY : e.offsetY;

  if (stage == -1 && pre_load_timer < 0) {
    if (x > 4 && y > 139 && x < 266 && y < 283) {
      start_game(0);
    }
    if (x > 311 && y > 161 && x < 595 && y < 308) {
      start_game(1);
    }
    if (x > 20 && y > 363 && x < 236 && y < 386) {
      show_records(0);
    }
    if (x > 499 && y > 363 && x < 580 && y < 386) {
      document.location = "http://www.aikidos.ru";
    }
  } else if (stage == -3) {
    on_scroll_move = false;

    if (x > 20 && y > 366 && x < 168 && y < 383) {
      show_main_window();
    }
    if (x > 499 && y > 363 && x < 580 && y < 386) {
      document.location = "http://www.aikidos.ru";
    }
    if (x > 30 && y > 140 && x < 190 && y < 160 && current_table != 0) {
      current_table = 0;
    }
    if (x > 190 && y > 140 && x < 350 && y < 160 && current_table != 1) {
      current_table = 1;
    }
  } else if (stage == 0 || stage == 1 || stage == 2) {
    if (x > 499 && y > 363 && x < 580 && y < 386) {
      document.location = "http://www.aikidos.ru";
    }
  } else if (stage == 3) {
    show_main_window();
    return;
    sound_fade_to = 0.6;

    var score = ((current_score * FPS) / 1000) | 0;
    if (add_score) {
      add_score = false;
      add_new_score = false;
      new_name = edit.value;
      game.removeChild(edit);
      var sreq;
      var url =
        REL_PATH +
        "proxy.php?game_type=" +
        current_game_type +
        "&player_name=" +
        encodeURI(new_name) +
        "&player_score=" +
        score;
      if (window.XMLHttpRequest) {
        sreq = new XMLHttpRequest();
        sreq.onreadystatechange = function () {};
        sreq.open("GET", url, true);
        sreq.send(null);
      } else if (window.ActiveXObject) {
        sreq = new ActiveXObject("Microsoft.XMLHTTP");
        if (sreq) {
          sreq.onreadystatechange = function () {};
          sreq.open("GET", url, true);
          sreq.send();
        }
      }
      show_records(current_game_type ? 0 : 1);
    } else if (
      (current_game_type == 0 &&
        (score > score_data.novice.min_score ||
          score_data.novice.count < 100)) ||
      (current_game_type == 1 &&
        (score > score_data.master.min_score || score_data.master.count < 100))
    ) {
      if (x > 230 && y > 225 && x < 370 && y < 245) {
        add_new_score = true;
        new_name = "АЙКИДОКА";
        edit.value = new_name;
        game.appendChild(edit);
        edit.focus();
      } else if (x > 230 && y > 225 && x < 370 && y < 275) {
        show_main_window();
      }
    } else if (x > 230 && y > 235 && x < 370 && y < 255) {
      show_main_window();
    }
  }
}

function OnMouseDown(e) {
  //var x=e.clientX-document.documentElement.scrollLeft-document.getElementById("game").offsetParent.offsetLeft-document.getElementById("game").offsetLeft;
  //var y=e.clientY+$(window).scrollTop()-document.getElementById("game").offsetParent.offsetTop-document.getElementById("game").offsetTop;
  var x = e.offsetX == undefined ? e.layerX : e.offsetX;
  var y = e.offsetY == undefined ? e.layerY : e.offsetY;

  if (stage == -3) {
    if (on_scroll) on_scroll_move = true;
  }
  if (stage == 0 || stage == 1 || stage == 2) {
    if (current_game_type == 0) {
      if (success_attack == -1) {
        success_attack =
          enemy_pos > 196 + start_hit_frame && enemy_pos < 196 + end_hit_frame;
        enemy_pos = 196;
      }
    }
  }
}

function resource_loaded() {
  var url = REL_PATH + "proxy.php?score=0";
  if (window.XMLHttpRequest) {
    sreq = new XMLHttpRequest();
    sreq.onreadystatechange = score_loaded;
    sreq.open("GET", url, true);
    sreq.send(null);
  } else if (window.ActiveXObject) {
    sreq = new ActiveXObject("Microsoft.XMLHTTP");
    sreq.onreadystatechange = score_loaded;
    if (sreq) {
      sreq.open("GET", url, true);
      sreq.send();
    }
  }
}

function score_loaded() {
  if (sreq.readyState == 4) {
    if (sreq.status == 200) {
      try {
        score_data = eval("(" + sreq.responseText + ")");
      } catch (e) {
        score_data = 0;
      }
    }
    show_main_window();

    sound_fade_to = 0.6;
    //resource_manager.res_list[39]._audio.volume=sound_current;
    //resource_manager.res_list[40]._audio.volume=sound_current;

    //resource_manager.res_list[39]._audio.addEventListener('ended',coda_ended,false);
    if (sound_enabled) {
      resource_manager.res_list[39].set_loop(true);
      resource_manager.res_list[39]._audio.play();
    }
  }
}

function coda_ended() {
  resource_manager.res_list[40].set_loop(true);
  if (sound_enabled) resource_manager.res_list[40]._audio.play();
}

function show_records(table_type) {
  records_back = false;
  records_url = false;
  records_master = false;
  records_novice = false;
  current_table = table_type;

  table_list = [[], []];
  table_pos = [0, 0];
  table_page_count = [0, 0];
  on_scroll = false;
  on_scroll_move = false;

  // load_table();

  stage = -3;
}

function show_main_window() {
  novice_highlight = false;
  master_highlight = false;
  show_masters = false;
  choose_url = false;

  stage = -1;
}

function start_game(game_type) {
  current_game_type = game_type;

  game_url = false;
  game_mouse = false;
  game_q = false;
  game_w = false;
  game_e = false;
  game_r = false;
  play_again = false;
  goto_list = false;

  enemy_pos = CANVAS_WIDTH;
  current_frame_player = 0;
  success_attack = -1;
  pre_stage = 0;
  enemy_type = 0;
  enemy_speed = start_enemy_speed;
  current_score = 0;

  stage = 0;

  sound_fade_to = 0.3;
}

function pre_resource_loaded() {
  game = document.getElementById("game");

  pages[0] = document.createElement("canvas");
  pages[0].width = CANVAS_WIDTH;
  pages[0].height = CANVAS_HEIGHT;
  context2D = pages[0].getContext("2d");

  /*	edit=document.createElement('input');
	edit.type='text';
	edit.maxLength="17";
	edit.style.left="180px";
	edit.style.top="179px";
	edit.style.width="238px";
	edit.style.fontFamily="Calibri,sans-serif";
	edit.style.fontSize="15pt";
	*/
  OnResize();

  window.addEventListener("resize", OnResize, false);
  window.addEventListener("orientationchange", OnResize, false);
  window.addEventListener("keypress", OnKeyPress, false);
  window.addEventListener("keydown", OnKeyDown, false);
  pages[0].addEventListener("mouseup", OnMouseUp, false);
  pages[0].addEventListener("mousedown", OnMouseDown, false);
  pages[0].addEventListener("mousemove", OnMouseMove, false);

  game.appendChild(pages[0]);

  LoadingElement.desc.x = CANVAS_WIDTH / 2;
  LoadingElement.desc.y = 250;

  timer = setInterval(draw, 1000 / FPS);

  // resource_manager.add_image(REL_PATH + "images/choose_game_type.png"); // 2

  resource_manager.add_image(REL_PATH + "images/start_screen.png"); // 2. Вместо того меню что было подгружаем это изображение
  resource_manager.add_image(REL_PATH + "images/records_background.png");
  resource_manager.add_image(REL_PATH + "images/novice_background.png");
  resource_manager.add_image(REL_PATH + "images/master_background.png");
  resource_manager.add_image(REL_PATH + "images/show_records_highlight.png"); //6
  resource_manager.add_image(REL_PATH + "images/type_novice_highlight.png");
  resource_manager.add_image(REL_PATH + "images/type_master_highlight.png");
  resource_manager.add_image(REL_PATH + "images/choose_url.png");
  resource_manager.add_image(REL_PATH + "images/game_url.png"); //10
  resource_manager.add_image(REL_PATH + "images/game_lose.png");
  resource_manager.add_image(REL_PATH + "images/game_numbers.png");
  resource_manager.add_image(REL_PATH + "images/game_url.png");
  resource_manager.add_image(REL_PATH + "images/ku.png");
  resource_manager.add_image(REL_PATH + "images/ku_numbers.png"); //15
  resource_manager.add_image(REL_PATH + "images/lose_button_highlight.png");
  resource_manager.add_image(REL_PATH + "images/master_q.png");
  resource_manager.add_image(REL_PATH + "images/master_w.png");
  resource_manager.add_image(REL_PATH + "images/master_e.png");
  resource_manager.add_image(REL_PATH + "images/master_r.png"); //20
  resource_manager.add_image(REL_PATH + "images/novice_mouse.png");
  resource_manager.add_image(REL_PATH + "images/score_numbers.png");
  resource_manager.add_image(REL_PATH + "images/win_button_highlight.png");
  resource_manager.add_image(REL_PATH + "images/win_game.png");
  resource_manager.add_image(REL_PATH + "images/100_masters.png"); //25
  resource_manager.add_image(REL_PATH + "images/100_masters_highlight.png");
  resource_manager.add_image(REL_PATH + "images/100_masters_selected.png");
  resource_manager.add_image(REL_PATH + "images/100_novice.png");
  resource_manager.add_image(REL_PATH + "images/100_novice_highlight.png");
  resource_manager.add_image(REL_PATH + "images/100_novice_selected.png"); //30
  resource_manager.add_image(REL_PATH + "images/records_url.png");
  resource_manager.add_image(REL_PATH + "images/back_to_game.png");
  resource_manager.add_image(REL_PATH + "images/enter_name.png"); //
  resource_manager.add_image(REL_PATH + "images/add_score_highlight.png");
  resource_manager.add_image(REL_PATH + "images/dan.png"); //35
  resource_manager.add_image(REL_PATH + "images/player_emo_1.png");
  resource_manager.add_image(REL_PATH + "images/player_emo_2.png");
  resource_manager.add_image(REL_PATH + "images/player_emo_3.png");

  //resource_manager.add_audio(REL_PATH+'audio/coda16.wav');
  //resource_manager.add_audio(REL_PATH+'audio/theme16.wav');
  //resource_manager.add_audio(REL_PATH+'audio/theme.wav');

  PLAYER_FIRST_IMAGE = resource_manager.res_list.length;

  resource_manager.add_image(REL_PATH + "images/player_stand.png");
  resource_manager.add_image(REL_PATH + "images/enemy_run_1.png");
  resource_manager.add_image(REL_PATH + "images/fail_1.png");
  resource_manager.add_image(REL_PATH + "images/success_1.png");
  resource_manager.add_image(REL_PATH + "images/enemy_run_2.png");
  resource_manager.add_image(REL_PATH + "images/fail_2.png");
  resource_manager.add_image(REL_PATH + "images/success_2.png");
  resource_manager.add_image(REL_PATH + "images/enemy_run_3.png");
  resource_manager.add_image(REL_PATH + "images/fail_3.png");
  resource_manager.add_image(REL_PATH + "images/success_3.png");
  resource_manager.add_image(REL_PATH + "images/enemy_run_4.png");
  resource_manager.add_image(REL_PATH + "images/fail_4.png");
  resource_manager.add_image(REL_PATH + "images/success_4.png");

  resource_manager.load(resource_loaded);

  var audio = document.createElement("audio");
  audio.src = "/aikidos/audio/theme.wav";
  audio.addEventListener(
    "ended",
    function () {
      // Wait 500 milliseconds before next loop
      setTimeout(function () {
        audio.play();
      }, 500);
    },
    false
  );
  audio.play();
}

function document_on_load() {
  resource_manager.add_image(REL_PATH + "images/loading_circle.png");
  resource_manager.add_image(REL_PATH + "images/loading_background.png");

  resource_manager.load(pre_resource_loaded);
  var audio = document.createElement("audio");
}
