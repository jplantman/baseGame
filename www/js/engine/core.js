// this is the core file of a game engine built to make multi-platform games.
// the creator jp (jplantman) requests that nobody else uses or copies any part of this code, although it is under an MIT license.

// the expected features include:
// 	- sprite creation and management +
//  - animations +
//  - clicking detection +
// 	- easy buttons and joysticks
// 	- basic collisions and math +
//  - extras: 
//			random color generator +
//			seeded random +

// intentionally excluding: ( these are better done manually, customized for each project )
//  - movement
// 	- game loop

// SECTIONS to look up:

// canvas
// sprites
// images
// collisions and geometry
// controls
// extras

var gameBase = gameBase || {};

///// CANVAS /////

gameBase.initCanvas = function(w, h){
	gameBase.canvas = document.getElementById('canvas');
	gameBase.canvas.w = gameBase.canvas.width = w || 360;
	gameBase.canvas.h = gameBase.canvas.height = h || 640;

	gameBase.ctx = gameBase.canvas.getContext('2d');

	return gameBase.canvas; // for convenience
}

///// SPRITES /////

// holds clickable sprites for click detection
gameBase.mousedowns = [];
gameBase.mouseups = [];
gameBase.mousemoves = [];
gameBase.touchstarts = [];
gameBase.touchmoves = [];
gameBase.touchends = [];

// basic sprite class
gameBase.Sprite = function( options ){
	
	// position and dimensions
	this.x = options.x;
	this.y = options.y;
	this.w = options.w;
	this.h = options.h;

	// appearance (either color, sprite, and spritesheet, only 1 please)
	if ( options.color ){
		this.color = options.color;	
	} else if ( options.sprite ){ // sprite: _, spriteW: _, spriteH: _
		this.sprite = options.sprite;
		this.spriteW = options.spriteW;
		this.spriteH = options.spriteH;
	} else if ( options.spritesheet ){  // spritesheet: _, defaultFrame: _, sheetX: _, sheetY: _, frameW: _, frameL _
		this.spritesheet = options.spritesheet;
		this.frameW = options.frameW;
		this.frameH = options.frameH;
		this.animation = {
			current: null, // which animation is currently active, by name
			frame: 0, // iterates by 1 per game frame during animation, to keep track
			defaultFrame: options.defaultFrame,
			currentFrame: options.defaultFrame,
			list: [] // stores animations
		};
	}

	// functionality
	this.type = options.type;

	if ( options.mousedown ){
		this.mousedown = options.mousedown;
		gameBase.mousedowns.push( this );
	}
	if ( options.mousemove ){
		this.mousemove = options.mousemove;
		gameBase.mousemoves.push( this );
	}
	if ( options.mouseup ){
		this.mouseup = options.mouseup;
		gameBase.mouseups.push( this );
	}
	if ( options.touchstart ){
		this.touchstart = options.touchstart;
		gameBase.touchstarts.push( this );
	}
	if ( options.touchmove ){
		this.touchmove = options.touchmove;
		gameBase.touchmoves.push( this );
	}
	if ( options.touchend ){
		this.touchend = options.touchend;
		gameBase.touchends.push( this );
	}
}

// sprite draw
gameBase.Sprite.prototype.draw = function(){
	var ctx = gameBase.ctx;
	if ( this.color ){
		ctx.fillStyle = this.color;
		ctx.fillRect( this.x, this.y, this.w, this.h );
	} else if ( this.sprite ){
		ctx.drawImage( this.sprite, 0, 0, this.spriteW, this.spriteH, this.x, this.y, this.w, this.h );
	} else if ( this.spritesheet ){
		var currentFrame = this.animation.currentFrame;
		ctx.drawImage( this.spritesheet, currentFrame[0]*this.frameW, currentFrame[1]*this.frameH, this.frameW, this.frameH, this.x, this.y, this.w, this.h );
	}
}


// add new animation to animation list
gameBase.Sprite.prototype.newAnimation = function( name, num, framesArray, howToEnd ){
	this.animation.list[name] = {num: num, framesArray: framesArray, howToEnd: howToEnd};
}
// start an animation. this is what you should call when you need an animation to run.
gameBase.Sprite.prototype.animate = function( name ){
	if ( this.animation.current != name ){
		this.animation.current = name;
		this.animation.frame = 0;
	}
}
// manages the active animation
gameBase.Sprite.prototype.updateAnim = function(){
	var animation = this.animation;
	if ( this.animation.current ){
		var animCurrent = animation.list[ animation.current ];
		// which frame should be showing?
		var frameToShow = Math.floor( animation.frame / animCurrent.num );
		// check if animation is still going or done
		if ( frameToShow < animCurrent.framesArray.length ){
			animation.currentFrame = animCurrent.framesArray[ frameToShow ];
		} else { // end animation
			animation.current = null;

			var endingType = typeof animCurrent.howToEnd;
			if ( endingType == 'string' ){ // if its a string, run that animation
				this.animate( animCurrent.howToEnd );
			} else if ( endingType == 'array' ){ // if its an array, end in that frame, 
				animation.currentFrame = animCurrent.howToEnd;
			} else {
				animation.currentFrame = animation.defaultFrame;
			}
		}
		animation.frame++;
	}
}

// sprite center (utility)
gameBase.Sprite.prototype.center = function(){
	return [ this.x + this.w/2, this.y + this.h/2 ];
}

// sprite creator function
gameBase.sprite = function( options ){
	var sprite = new gameBase.Sprite( options );
	return sprite;
}

///// IMAGES /////

gameBase.preload = function( arrayOfImgs, callback ){ 
	// arrayOfImgs should be formatted as array pairs of keys and src, eg ['player', 'imgs/player.png']
	
	gameBase.images = {}; // where images are stored

	var left = arrayOfImgs.length;
	var isloaded = function(){
		left--;
		if ( left <= 0 ){
			callback();
		}
	}

	var i, img, l = arrayOfImgs.length;
	for (i = 0; i < l; i++) {
		img = arrayOfImgs[i];
		gameBase.images[ img[0] ] = new Image();
		gameBase.images[ img[0] ].src = img[1];
		gameBase.images[ img[0] ].onload = isloaded;
	};
}

///// COLLISIONS AND GEOMETRY /////

function collides(a, b){
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function collidesArray(sprite, array){
	// checks collisions between a sprite and an array of sprites
	for (var i = 0; i < array.length; i++) {
		if ( collides( sprite, array[i] ) ){
			return array[i];
		}
	};
}

function isPosInSprite(sprite, x, y){
	return sprite.x <= x && x <= sprite.x+sprite.w && 
					   sprite.y <= y && y <= sprite.y+sprite.h;
}

function isPosInSprites(array, x, y){
	var i, l = array.length;
	if ( !l ){ return }
	for (i = 0; i < l; i++) {
		if ( isPosInSprite(array[i], x, y) ){ return array[i]; }
	};
}

function distanceTo(sprite, x, y){
	// get distance between a sprite and a point
	var centerX = sprite.x + sprite.w/2;
	var centerY = sprite.y + sprite.h/2;

	var sideX = Math.abs( centerX - x ); // dist^2 = x^2 + y^2
	var sideY = Math.abs( centerY - y );
	return Math.sqrt( sideX*sideX + sideY*sideY );
}

function distanceBetween(sprite, other){
	// get distance between a sprite and a point
	var x = other.x + other.w/2;
	var y = other.y + other.h/2;

	return distanceTo(sprite, x, y) - (other.w+other.h)/4;
}

function angleTo(sprite, x, y){
	// get angle between a sprite and a point
	var centerX = sprite.x + sprite.w/2;
	var centerY = sprite.y + sprite.h/2;

	var sideX = centerX - x;
	var sideY = centerY - y;

	return Math.atan2(sideY, sideX);
}

function getVelocities(sprite, x, y, speed){
	// get the x and y vectors for an item moving from a sprite towards a point
	var centerX = sprite.x + sprite.w/2;
	var centerY = sprite.y + sprite.h/2;

	var vectorX = x - centerX;
	var vectorY = y - centerY;

	var sideX = Math.abs(vectorX);
	var sideY = Math.abs(vectorY);

	var sum = sideX + sideY;

	var velocityX = vectorX / sum * speed;
	var velocityY = vectorY / sum * speed;

	var direction;
	if ( sideX > sideY ){
		if (vectorX > 0){ direction = 'right' }
		else { direction = 'left' }
	} else {
		if (vectorY > 0){ direction = 'down' }
		else { direction = 'up' }
	}

	return [ velocityX, velocityY, direction ];
}

///// CONTROLS /////

var ctrl = gameBase.controls = {};

// clicks and taps
gameBase.windowXYtoCanvasXY = function( array ){
	return [ array[0] * gameBase.canvas.width / window.innerWidth, array[1] * gameBase.canvas.height / window.innerHeight ];
}
gameBase.xyFromEvent = function(e){
	if ( e.x ){ return [ e.x, e.y ] }
	else if ( e.changedTouches && e.changedTouches[0].clientX ){
		return [ e.changedTouches[0].clientX, e.changedTouches[0].clientY ];
	}
}

gameBase.initClickEvents = function( eventsList, noSpriteHandler ){ 
	// eventsList is a list of which events to add. 
	// the options are:
	//	mousedown, mousemove, mouseup, touchstart, touchmove, touchend
	for (var i = 0; i < eventsList.length; i++) {
		(function(n){

			gameBase.canvas.addEventListener(eventsList[n], function( e ){
				// get event position
				var position = gameBase.windowXYtoCanvasXY( gameBase.xyFromEvent(e) );

				// check if any sprites in the mousedowns (or whichever event) array intersects the event position
				var sprites = isPosInSprites( gameBase[eventsList[n]+'s'], position[0], position[1] );

				// if a sprite was clicked, toggle its function
				if ( sprites ){ sprites[eventsList[n]](); }
				else if ( typeof noSpriteHandler == 'function' ) {
					// handle event when not attached to a certain sprite ( like clicking the ground )
					noSpriteHandler( eventsList[n], e );
				}
			});
		})(i);
		
	};		
}

gameBase.initPointerTracker = function(){
	if ( ctrl.pointer ){ console.log( 'pointer already exists!' ); return; }
	ctrl.pointer = {
		isDown: false,
		position: undefined
	}
	gameBase.initClickEvents( ['mousedown', 'touchstart'], function(type, e){
		ctrl.pointer.isDown = true;
		ctrl.pointer = gameBase.windowXYtoCanvasXY( gameBase.xyFromEvent(e) );
	} );
	gameBase.initClickEvents( ['mousemove', 'touchmove'], function(type, e){
		ctrl.pointer = gameBase.windowXYtoCanvasXY( gameBase.xyFromEvent(e) );
	} );
	gameBase.initClickEvents( ['mouseup', 'touchend'], function(type, e){
		ctrl.pointer.isDown = false;
	} );
	return ctrl.pointer;
}

gameBase.noContextMenu = function(){
	this.canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });
}

// touch left or right side of the screen to move
gameBase.initTouchLeftRight = function(){
	gameBase.initClickEvents( ['mousedown', 'touchstart', 'mousemove', 'touchmove', 'mouseup', 'touchend'], function(type, e){

		// move left or right when touching left or right side of screen 
		if ( type == 'touchstart' || type == 'mousedown' || type == 'touchmove' || type == 'mousemove' ){
			var position = gameBase.windowXYtoCanvasXY( gameBase.xyFromEvent(e) );
			if ( position[1] > canvas.height/2 ){
				if ( position[0] < canvas.width/2 ){
					ctrl.left = true;
					ctrl.right = false;
				} else {
					ctrl.right = true;
					ctrl.left = false;
				}
			} else {
				ctrl.left = false;
				ctrl.right = false;
			}
		}
		else if ( type == 'touchend' || type == 'mouseup' ){
			ctrl.left = false;
			ctrl.right = false;
		}
	} );
}

// joysticks
gameBase.initJoystick = function( leftOrRight, img, imgW, imgH ){

	this.initPointerTracker();
	
	var joystick = this.sprite({
		type: "joystick",
		x: ( leftOrRight == 'right' ? canvas.width - 50 : 10 ),
		y: canvas.height - 50,
		w: 40,
		h: 40,
		sprite: img,
		spriteW: imgW,
		spriteH: imgH
	});

	return joystick;
}

// keyboard
ctrl.initKeyboard = function(){
	this.keyboard = {};
	var kb = this.keyboard;

	kb.test = false; // when true, keyCodes pressed will be console.logged

	kb.keyCodePairs = []; // this array
					// is filled with array pairs
					// where [0] is the keyCode
					// and [1] is the keyboard property
					// and they are checked for keydown and keyup
					// for example, adding [37, 'left']
					// will toggle kb.left as true or false


	// the following init functions add keycode pairs to the array of pairs to check.
	// you can manually add keycode pairs to the array and they will be checked too.
	kb.initArrowKeys = function(){
		kb.keyCodePairs = kb.keyCodePairs.concat( [
			[37, 'left'],
			[39, 'right'],
			[38, 'up'],
			[40, 'down']
		] );
	}

	kb.initWASD = function(){
		kb.keyCodePairs = kb.keyCodePairs.concat( [
			[87, 'w'],
			[65, 'a'],
			[83, 's'],
			[68, 'd']
		] );
	}

	kb.initSpace = function(){
		kb.keyCodePairs.push( [32, 'space'] );
	}

	kb.initShift = function(){
		kb.keyCodePairs.push( [16, 'shift'] );
	}

	// event listeners
	document.addEventListener('keydown', function( e ){
		var keycode = e.keyCode || e.which;
		var l = kb.keyCodePairs.length, key, i;
		for (i = 0; i < l; i++) {
			key = kb.keyCodePairs[i];
			if ( keycode == key[0] ){
				kb[ key[1] ] = true;
			}
		};

		if ( kb.test ){ console.log( keycode ) };
	});
	document.addEventListener('keyup', function( e ){
		var keycode = e.keyCode || e.which;
		var l = kb.keyCodePairs.length, key, i;
		for (i = 0; i < l; i++) {
			key = kb.keyCodePairs[i];
			if ( keycode == key[0] ){
				kb[ key[1] ] = false;
			}
		};
	});

	return kb; // for convenience
}


///// EXTRAS /////

gameBase.randInt = function( low, high ){
	return Math.floor( Math.random() * ( 1 + high - low ) ) + low;
}

gameBase.randomColor = function(array){
	var a = array || ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
	var string = '#';
	for (var i = 0; i < 6; i++) {
		var r = this.randInt(0, a.length-1);
		console.log(r)
		string += a[ r ];
	};	
	return string;
}

gameBase.srand = function(i, randInt0toN) {
	var x = Math.sin(i) * 10000;
     x =  x-Math.floor(x);
     if (randInt0toN != undefined){
     	x = Math.floor(x*randInt0toN);
     	return x;
     }
     //console.log(x)
     return x;
}

