
// SECTIONS:

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
gameBase.clickables = [];

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

	if ( options.clickable ){
		this.clickable = options.clickable;
		this.clickableActive = false;
		gameBase.clickables.push( this );
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

gameBase.collides = function(a, b){
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

gameBase.collidesArray = function(sprite, array){
	// checks collisions between a sprite and an array of sprites
	for (var i = 0; i < array.length; i++) {
		if ( collides( sprite, array[i] ) ){
			return array[i];
		}
	};
}

gameBase.isPosInSprite = function(sprite, x, y){
	return sprite.x <= x && x <= sprite.x+sprite.w && 
					   sprite.y <= y && y <= sprite.y+sprite.h;
}

gameBase.isPosInSprites = function(array, x, y){
	var i, l = array.length;
	if ( !l ){ return }
	for (i = 0; i < l; i++) {
		if ( gameBase.isPosInSprite(array[i], x, y) ){ return array[i]; }
	};
}

gameBase.distanceTo = function(sprite, x, y){
	// get distance between a sprite and a point
	var centerX = sprite.x + sprite.w/2;
	var centerY = sprite.y + sprite.h/2;

	var sideX = Math.abs( centerX - x ); // dist^2 = x^2 + y^2
	var sideY = Math.abs( centerY - y );
	return Math.sqrt( sideX*sideX + sideY*sideY );
}

gameBase.distanceBetween = function(sprite, other){
	// get distance between a sprite and a point
	var x = other.x + other.w/2;
	var y = other.y + other.h/2;

	return distanceTo(sprite, x, y) - (other.w+other.h)/4;
}

gameBase.angleTo = function(sprite, x, y){
	// get angle between a sprite and a point
	var centerX = sprite.x + sprite.w/2;
	var centerY = sprite.y + sprite.h/2;

	var sideX = centerX - x;
	var sideY = centerY - y;

	return Math.atan2(sideY, sideX);
}

gameBase.getVelocities = function(sprite, x, y, speed){
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
gameBase.windowXYtoCanvasXY = function( x, y ){
	return [ x * gameBase.canvas.width / window.innerWidth, y * gameBase.canvas.height / window.innerHeight ];
}

// tracks mouse clicks
gameBase.initMouseTracker = function(){
	if ( ctrl.mouse ){ return; }
	ctrl.mouse = {
		type: 'mouse',
		isDown: false,
		position: undefined,
		spriteActive: undefined,
		spriteClickedOn: undefined
	}

	var positionAndSprite = function(type, e){
		var pos = ctrl.mouse.position = gameBase.windowXYtoCanvasXY( e.x, e.y );
		var sprite = ctrl.mouse.spriteActive = gameBase.isPosInSprites( gameBase.clickables, pos[0], pos[1] );
		if ( sprite ){
			ctrl.mouse.spriteActive.clickable( type, e );
			if ( type == 'mousedown' ){
				ctrl.mouse.spriteClickedOn = sprite;
			}
		}
	}
	canvas.addEventListener( 'mousedown', function(e){
		if ( !ctrl.mouse.isDown ){
			ctrl.mouse.isDown = true;
			positionAndSprite( 'mousedown', e );	
		}
	} );
	canvas.addEventListener( 'mousemove', function(e){
		positionAndSprite( 'mousemove', e );
	} );
	canvas.addEventListener( 'mouseup', function(e){
		e.preventDefault();
		if ( ctrl.mouse.isDown ){
			ctrl.mouse.isDown = false;
			positionAndSprite( 'mouseup', e );
			ctrl.mouse.spriteClickedOn = null;
		}
	} );
	return ctrl.mouse;
}

gameBase.initTouchTracker = function(){
	if ( ctrl.touch ){ console.log( 'touch already exists!' ); return ctrl.touch; }
	var touchCtrl = ctrl.touch = {
		active: [], // list of active touch events. this array can be checked by the user for the status of taps and sprites tapped
	}
	function copyTouch( touch ) {
		var pos = gameBase.windowXYtoCanvasXY( touch.pageX, touch.pageY );
		return { identifier: touch.identifier, x: pos[0], y: pos[1] };
	}
	function spriteCheck( touch, type ){
		touch = findActiveTouch( touch.identifier );
		var sprite = gameBase.isPosInSprites( gameBase.clickables, touch.x, touch.y );
		if ( sprite ){
			touch.sprite = sprite;
			if ( typeof sprite.clickable == 'function' ){ sprite.clickable( type ); }
		} else {
			touch.sprite = null;
		}
	}
	function findActiveTouch( identifier ){
		for (var i = 0; i < touchCtrl.active.length; i++) {
			if ( touchCtrl.active[i].identifier == identifier ){
				return touchCtrl.active[i];
			}
		};
		return -1;
	}
	function findActiveTouchIndex( identifier ){
		for (var i = 0; i < touchCtrl.active.length; i++) {
			if ( touchCtrl.active[i].identifier == identifier ){
				return i;
			}
		};
		return -1;
	}

	function updateActiveTouch( changedTouches, type ){
		for (var i = 0; i < changedTouches.length; i++) {
			var touch = copyTouch( changedTouches[i] );
			touch.type = type;
			var index = findActiveTouchIndex( touch.identifier );
			touchCtrl.active.splice( index, 1, touch );
			spriteCheck( touch, type );
		};
	}

	canvas.addEventListener("touchstart", function(e){
		e.preventDefault();
		for (var i = 0; i < e.changedTouches.length; i++) {
			var touch = copyTouch( e.changedTouches[i] );
			touch.type = 'touchstart';
			var index = findActiveTouchIndex( touch.identifier );
			touchCtrl.active.push( touch );
			spriteCheck( touch, 'touchstart' );
		};
	}, false);

	canvas.addEventListener("touchmove", function(e){
		e.preventDefault();
		updateActiveTouch( e.changedTouches, 'touchmove' );
	}, false);

	canvas.addEventListener("touchend", function(e){
		e.preventDefault();
		updateActiveTouch( e.changedTouches, 'touchend' );
	}, false);

	canvas.addEventListener("touchcancel", function(e){
		e.preventDefault();
		updateActiveTouch( e.changedTouches, 'touchcancel' );
	}, false);

	touchCtrl.update = function( arrayOfFunctions ){
		for (var i = 0; i < touchCtrl.active.length; i++) {
			var t = touchCtrl.active[i];
			
			// run all the functions passed here by the user
			for (var k = 0; k < arrayOfFunctions.length; k++) {
				arrayOfFunctions[k]( t );
			};

			// remove touchend and touchcancels
			if ( t.type == 'touchend' || t.type == 'touchcancel' ){
				touchCtrl.active.splice(i, 1);
				i--;
			}	

			// touchstarts had their chance, now they are touchovers
			if ( t.type == 'touchstart' ){
				t.type = 'touchover';
			}
		};
	}
	
	return touchCtrl;
}

gameBase.noContextMenu = function(){
	this.canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });
}

// touch left or right side of the screen to move
gameBase.leftRightScreenTouchUpdate = function( touch ){
	// pass this function to touchCtrl.update([]);
	ctrl.left = false;
	ctrl.right = false;
	if ( !touch || touch.type == 'touchend' || touch.type == 'touchcancel' ){ return; }
	if ( !touch.sprite && touch.y > canvas.height/2 ){
		if ( touch.x < canvas.width/2 ){
			ctrl.left = true;
		} else {
			ctrl.right = true;
		}
	}
}

// joysticks ( requires touch tracker ) NOT FIXED YET
gameBase.initJoystick = function( leftOrRight, img, imgW, imgH ){
	if ( !ctrl.pointer || !ctrl.pointer.type != 'touch' ){ console.log( 'initialize touch tracker before initializing joystick.' ); return; }

	var joystick = this.sprite({
		type: "joystick",
		x: ( leftOrRight == 'right' ? canvas.width - 60 : 10 ),
		y: canvas.height - 60,
		w: 50,
		h: 50,
		sprite: img,
		spriteW: imgW,
		spriteH: imgH,
		clickable: function(type, e){
			if ( ctrl.pointer.isDown ){
				this.velocities = gameBase.getVelocities( this, ctrl.pointer.position[0], ctrl.pointer.position[1], 1 );	
			} else {
				this.velocities = null;
			}
		}
	});
	joystick.update = function(){
		if ( ctrl.pointer.spriteActive != this ){
			this.velocities = null;
		}

		if ( this.velocities ) {
			gameBase.ctx.translate( 8 * this.velocities[0], 8 * this.velocities[1] )
			this.draw();
			gameBase.ctx.translate( -8 * this.velocities[0], -8 * this.velocities[1] )
		} else {
			this.draw();
		}	
	}

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


