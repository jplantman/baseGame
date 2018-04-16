// this is the core file of a game engine built to make multi-platform games.
// the creator jp (jplantman) requests that nobody else uses or copies any part of this code, although it is under an MIT license.

// the expected features include:
// 	- sprite creation and management
//  - animation for images
// 	- initialize flexible controllers of different styles
// 	- basic physics and detection

var gameBase = gameBase || {};


// setup canvas
gameBase.initCanvas = function(){
	gameBase.canvas = document.getElementById('canvas');
	gameBase.ctx = gameBase.canvas.getContext('2d');
}

// holds clickable sprites for click detection
gameBase.clickables = [];

// basic sprite class
gameBase.Sprite = function( options ){
	// position and dimensions
	
	this.x = options.x;
	this.y = options.y;
	this.w = options.w;
	this.h = options.h;

	// appearance
	this.color = options.color;
	this.sprite = options.sprite;
	this.spritesheet = options.spritesheet;

	// functionality
	this.type = options.type;
	this.clickable = options.clickable;
}

// sprite draw
gameBase.Sprite.prototype.draw = function(){
	if ( this.color ){
		gameBase.ctx.fillStyle = this.color;
		gameBase.ctx.fillRect(this.x, this.y, this.w, this.h);
	}
}

// sprite creator function
gameBase.sprite = function( options ){
	var sprite = new gameBase.Sprite( options );
	if ( options.clickable ){
		gameBase.sprites.push( sprite );
	}
	return sprite;
}