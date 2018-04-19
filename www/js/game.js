var game = game || {}
var gb = gameBase;


game.start = function(){

	// init canvas
	var canvas = gb.initCanvas(300, 500);


	// controls
	var kb = gb.controls.initKeyboard();
	kb.initArrowKeys();
	kb.initWASD();

	// click controls
	gb.noContextMenu();
	// gameBase.initMouseTracker();

	// touch controls
	var touchCtrl = gb.initTouchTracker();

	//game.joystick = gb.initJoystick( 'right', gb.images.joystickGreen, 68, 68 );
	
	// player
	game.player = gb.sprite({
		type: 'player',
		x: gb.canvas.width/2-10,
		y: gb.canvas.height*3/4-10,
		w: 16 * 2.5,
		h: 24 * 2.5,
		spritesheet: gb.images.ship,
		defaultFrame: [2, 0],
		// sheetX: 5,
		// sheetY: 2,
		frameW: 16,
		frameH: 24
	});
	var player = game.player;
	player.speed = 150;
	player.newAnimation( 'idle', 4, [ [2, 1], [2, 0] ], 'idle' );
	player.newAnimation( 'left', 4, [ [1, 1], [1, 0], [0, 1], [0, 0] ], 'idleLeft' );
	player.newAnimation( 'idleLeft', 4, [ [0, 1], [0, 0] ], 'idleLeft' );
	player.newAnimation( 'right', 4, [ [3, 1], [3, 0], [4, 1], [4, 0] ], 'idleRight' );
	player.newAnimation( 'idleRight', 4, [ [4, 1], [4, 0] ], 'idleRight' );

	player.animate( 'idle' );


	player.update = function(dt){
		this.updateAnim();
		// keyboard and touch left.right based movement
		var left = kb.left || kb.a || gb.controls.left;
		var right = kb.right || kb.d || gb.controls.right;

		if ( kb.up || kb.w ){
			this.y -= this.speed * dt;
			if ( this.y < 0 ){ this.y = 0 }
		}
		if ( kb.down || kb.s ){
			this.y += this.speed * dt;
			if ( this.y + this.h > canvas.height ){ this.y = canvas.height - this.h }
		}
		if ( left && !right ){
			this.x -= this.speed * dt;
			if ( this.x < 0 ){ this.x = 0 }
			if ( !(this.animation.current == 'idleLeft') ){
				this.animate( 'left' );
			}
		}
		else if ( right & !left ){
			this.x += this.speed * dt;
			if ( this.x + this.w > canvas.width ){ this.x = canvas.width - this.w }
			if ( !(this.animation.current == 'idleRight') ){
				this.animate( 'right' );
			}
		} else {
			player.animate( 'idle' );
		}

		// Joystick movement
		// var joy = game.joystick.velocities;
		// if ( joy ){

		// 	this.y += this.speed * joy[1] * dt;
		// 	this.x += this.speed * joy[0] * dt;
		// 	if ( this.x < 0 ){ this.x = 0 };
		// 	if ( this.x + this.w > canvas.width ){ this.x = canvas.width - this.w };
		// 	if ( this.y < canvas.height/2 ){ this.y = canvas.height/2 };
		// 	if ( this.y + this.h > canvas.height ){ this.y = canvas.height - this.h };
		// 	if ( joy[2] == 'left' && this.animation.current != 'idleLeft' ){
		// 		this.animate( 'left' );
		// 	} else if ( joy[2] == 'right' && this.animation.current != 'idleRight' ){
		// 		this.animate( 'right' );
		// 	}
		// }
		// else {
		// 	player.animate( 'idle' );
		// }

	}

	// pause btn
	game.pauseBtn = gb.sprite({
		type: 'button',
		x: canvas.width-40,
		y: 10,
		w: 30,
		h: 30,
		sprite: gb.images.pause,
		spriteW: 48,
		spriteH: 48,
		clickable: function(type){
			if ( type == 'mouseup' || type == 'touchend' ){
				if ( !game.isPaused ){ // pause
					this.sprite = gb.images.play;
					game.isPaused = true;
				} else { // play
					game.isPaused = false;
					this.sprite = gb.images.pause;
					game.lastTime = Date.now();
					setTimeout( game.loop, 1000/30 );
				}	
			}
		}
	});

	// main game loop
	game.loop = function(){
		

		gb.ctx.clearRect( 0, 0, canvas.width, canvas.height );
		var now = Date.now();
		var dt = ( now - game.lastTime ) / 1000 ;
		game.lastTime = now;
		
		touchCtrl.update([
			function(touch){
				if (!touch){return}
				console.log(touch.type, touchCtrl.active.length, !!touch.sprite);
			},
			function(touch){
				gb.leftRightScreenTouchUpdate(touch)
			}
		]);


		player.update(dt);
		player.draw();
		game.pauseBtn.draw();
		//game.joystick.update();

		if ( game.isPaused ){ return }
		setTimeout( game.loop, 1000/40 );
	}

	// start loop
	game.lastTime = Date.now();
	setTimeout( game.loop, 1000/40 );

}

gameBase.preload( [
    ['play', 'img/ui/play.png'],
    ['pause', 'img/ui/pause.png'],
    ['joystickGreen', 'img/ui/joystick-green.png'],
    ['ship', 'img/ship.png']
], game.start );