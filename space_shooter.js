/* 
------------------------------
------- INPUT SECTION -------- 
------------------------------
*/

/**
 * This class binds key listeners to the window and updates the controller in attached player body.
 * 
 * @typedef InputHandler
 */
class InputHandler {
	key_code_mappings = {
		button: {
			32: { key: 'space', state: 'action_1' }
		},
		axis: {
			68: { key: 'right', state: 'move_x', mod: 1 },
			65: { key: 'left', state: 'move_x', mod: -1 },
			87: { key: 'up', state: 'move_y', mod: -1 },
			83: { key: 'down', state: 'move_y', mod: 1 }
		}
	};
	player = null;

	constructor(player) {
		this.player = player;

		// bind event listeners
		window.addEventListener("keydown", (event) => this.keydown(event), false);
		window.addEventListener("keyup", (event) => this.keyup(event), false);
	}

	/**
	 * This is called every time a keydown event is thrown on the window.
	 * 
	 * @param {Object} event The keydown event
	 */
	keydown(event) {
		// ignore event handling if they are holding down the button
		if (event.repeat || event.isComposing || event.keyCode === 229)
			return;

		// check if axis mapping exists
		if (this.key_code_mappings.axis.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.axis[event.keyCode];
			this.player.controller[mapping.state] += mapping.mod;
			console.log(`input_handler[axis:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}

		// check if button mapping exists
		if (this.key_code_mappings.button.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.button[event.keyCode];
			this.player.controller[mapping.state] = true;
			console.log(`input_handler[button:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}
	}

	/**
	 * This is called every time a keyup event is thrown on the window.
	 * 
	 * @param {Object} event The keyup event
	 */
	keyup(event) {
		if (event.isComposing || event.keyCode === 229)
			return;

		// check if axis mapping exists
		if (this.key_code_mappings.axis.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.axis[event.keyCode];
			this.player.controller[mapping.state] -= mapping.mod;
			console.log(`input_handler[axis:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}

		// check if button mapping exists
		if (this.key_code_mappings.button.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.button[event.keyCode];
			this.player.controller[mapping.state] = false;
			console.log(`input_handler[button:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}
	}
}

/* 
------------------------------
------- BODY SECTION  -------- 
------------------------------
*/

/**
 * Represents a basic physics body in the world. It has all of the necessary information to be
 * rendered, checked for collision, updated, and removed.
 * 
 * @typedef Body
 */
class Body {
	position = { x: 0, y: 0 };
	velocity = { x: 0, y: 0 };
	size = { width: 10, height: 10 };
	health = 100;
	/**
	 * Creates a new body with all of the default attributes
	 */
	constructor() {
		// generate and assign the next body id
		this.id = running_id++;
		// add to the entity map
		entities[this.id] = this;
	}

	/**
	 * @type {Object} An object with two properties, width and height. The passed width and height
	 * are equal to half ot the width and height of this body.
	 */
	get half_size() {
		return {
			width: this.size.width / 2,
			height: this.size.height / 2
		};
	}

	/**
	 * @returns {Boolean} true if health is less than or equal to zero, false otherwise.
	 */
	isDead() {
		return this.health <= 0;
	}

	/**
	 * Updates the position of this body using the set velocity.
	 * 
	 * @param {Number} delta_time Seconds since last update
	 */
	update(delta_time) {
		// move body
		this.position.x += delta_time * this.velocity.x;
		this.position.y += delta_time * this.velocity.y;
	}

	/**
	 * This function draws a green line in the direction of the body's velocity. The length of this
	 * line is equal to a tenth of the length of the real velocity
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = '#00FF00';
		graphics.beginPath();
		graphics.moveTo(this.position.x, this.position.y);
		graphics.lineTo(this.position.x + this.velocity.x / 10, this.position.y + this.velocity.y / 10);
		graphics.stroke();
	}

	

	/**
	 * Marks this body to be removed at the end of the update loop
	 */
	remove() {
		queued_entities_for_removal.push(this.id);	
	}
}
/**
 * Represents a proctile for a player Combat
 * 
 * @typedef player_Combat
 */
class player_Combat extends Body{
	position = { x: 0, y: 0 };
	secondsSinceUpdate = 0;
	constructor(x,y){
		super();
		this.position.x =  x;
		this.position.y =  y-10;
	}
	

	draw(graphics) {
		graphics.strokeStyle = '#000000';
		graphics.beginPath();
		graphics.moveTo(
			this.position.x,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x + this.half_size.width,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x - this.half_size.width,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x,
			this.position.y - this.half_size.height
		);
		graphics.stroke();
		// draw velocity lines
		super.draw(graphics);
	}

	update(delta_time){
			
			this.position.y -= 5; 
		super.update(delta_time);
		// Remove this entity once it has gone below the bottom border of the canvas
		if (this.position.y == 0) {
			console.log("deleted");  
			this.remove();
		}
}


}
/**
 * Represents an player body. Extends a Body by handling input binding and controller management.
 * 
 * @typedef Player
 */
class Player extends Body {
	// this controller object is updated by the bound input_handler
	controller = {
		move_x: 0,
		move_y: 0,
		action_1: false
	};

	speed = 100;
	input_handler = null;

	/**
	 * Creates a new player with the default attributes.
	 */
	constructor() {
		super();

		// bind the input handler to this object
		this.input_handler = new InputHandler(this);

		// we always want our new players to be at this location
		this.position = {
			x: config.canvas_size.width / 2,
			y: config.canvas_size.height - 100
		};
	}
	

	/**
	 * Draws the player as a triangle centered on the player's location.
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = '#000000';
		graphics.beginPath();
		graphics.moveTo(
			this.position.x,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x + this.half_size.width,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x - this.half_size.width,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x,
			this.position.y - this.half_size.height
		);
		graphics.stroke();
		// draw velocity lines
		super.draw(graphics);
	}

	/**
	 * Updates the player given the state of the player's controller.
	 * 
	 * @param {Number} delta_time Time in seconds since last update call.
	 */
	update(delta_time) {
		// Moving only left or right
		if (this.controller.move_x != 0 && this.controller.move_y == 0) {
			this.velocity.y = 0;
			this.velocity.x = this.controller.move_x * this.speed;
		}
		// Moving only up or down
		else if (this.controller.move_y != 0 && this.controller.move_x == 0) {
			this.velocity.x = 0;
			this.velocity.y = this.controller.move_y * this.speed;
		}
		// Moving diagonally
		else if (this.controller.move_y != 0 && this.controller.move_x != 0) {
			this.velocity.x = this.controller.move_x * Math.sqrt(Math.pow(this.speed, 2) / 2)
			this.velocity.y = this.controller.move_y * Math.sqrt(Math.pow(this.speed, 2) / 2)
		}
		// No movement so set velocity to 0
		else {
			this.velocity.x = 0;
			this.velocity.y = 0;
		}
		if(this.controller.action_1){
			new player_Combat(this.position.x, this.position.y);
		}
		// console.log(this.position);
		super.update(delta_time);
		
		// clip to screen
		this.position.x = Math.min(Math.max(0, this.position.x), config.canvas_size.width);
		this.position.y = Math.min(Math.max(0, this.position.y), config.canvas_size.height);
	}
}



/**
 * Represents an enemy body.
 * 
 * @typedef Enemy
 */
class Enemy extends Body {
	// this controller object stays the same since enemies only move down
	controller = {
		move_x: 0,
		move_y: 1,
		action_1: false
	};
	speed = 100;

	/**
	 * Creates a new enemy with the default attributes.
	 */   
	constructor() {
		super();

		// new enemies spawn above the top boarder of the canvas, and at a random x position
		this.position = {
			x: Math.random() * (config.canvas_size.width - 0) + 0,
			y: -20
		};
	}

	/**
	 * Draws the enemy as a red triangle
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = 'red';
		graphics.beginPath();
		graphics.moveTo(
			this.position.x,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x + this.half_size.width,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x - this.half_size.width,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x,
			this.position.y - this.half_size.height
		);
		graphics.stroke();

		// draw velocity lines
		super.draw(graphics);
	}

	/**
	 * Updates the enemy given the state of the enemy's controller.
	 * Note that the enemy's controller should never update, so it will only move down
	 * 
	 * @param {Number} delta_time Time in seconds since last update call.
	 */
	update(delta_time) {
		this.velocity.y = this.controller.move_y * this.speed;
		super.update(delta_time);

		// Remove this entity once it has gone below the bottom border of the canvas
		if (this.position.y > config.canvas_size.height) {
			this.remove();
		}

	}

}

/**
 * Responsible for detecting collision between entities 
 * 
 * @typedef EnemySpawner
 */
class EnemySpawner {
	// Counts the number of seconds since the last time update was called.
	secondsSinceUpdate = 0;

	/** 
	 * Spawns in 6 new enemies per second
	 * 
	 * @param {Number} delta_time Time in seconds since last update call.
	 */
	update(delta_time) {
		this.secondsSinceUpdate += delta_time;
		if (this.secondsSinceUpdate >= 1) {
			this.secondsSinceUpdate = 0;
			new Enemy();
			new Enemy();
			new Enemy();
			new Enemy();
			new Enemy();
			new Enemy();
		}
	}
}

/**
 * Responsible for spawning new enemy entities
 *
 * @typedef CollisionHandler
 */
class CollisionHandler {
	count = 0;
	/**
	 * Checks for a collision between every pair of entities
	 * 
	 * @param {Number} delta_time Time in seconds since last update call.
	 */
	update(delta_time) {
		
		Object.values(entities).forEach(entity1 => {
			Object.values(entities).forEach(entity2 => {
				// Handle edge case where the entity is compared to itself
				if (entity1.id != entity2.id) {
					if (entity1.position.x < entity2.position.x + entity2.size.width &&
						entity1.position.x + entity1.size.width > entity2.position.x &&
						entity1.position.y < entity2.position.y + entity2.size.height &&
						entity1.position.y + entity1.size.height > entity2.position.y) {
						// collision detected!
						if(entity1.constructor.name == "player_Combat"){
							// entity1 is a player, take 25 damage (collision detected twice, so -12.5)
							// entity2 must be an enemy, remove it
							this.count += 0.5;
							entity2.remove();
							
						} else if (entity2.constructor.name == "player_Combat") {
							// entity1 must be an enemy, remove it
							// entity2 is a player, take 25 damage (collision detected twice, so -12.5)
							entity1.remove();	
							this.count += 0.5;						
						}
						if(entity1.constructor.name == "Player"){
							// entity1 is a player, take 25 damage (collision detected twice, so -12.5)
							// entity2 must be an enemy, remove it
							entity1.health -= 12.5;
							entity2.remove();

							
						} else if (entity2.constructor.name == "Player") {
							// entity1 must be an enemy, remove it
							// entity2 is a player, take 25 damage (collision detected twice, so -12.5)
							entity1.remove();
							entity2.health -= 12.5;
							
						}

					}
				}
			});
		});
	}
}


/* 
------------------------------
------ CONFIG SECTION -------- 
------------------------------
*/

const config = {
	graphics: {
		// set to false if you are not using a high resolution monitor
		is_hi_dpi: true
	},
	canvas_size: {
		width: 300,
		height: 500
	},
	update_rate: {
		fps: 60,
		seconds: null
	}
};

config.update_rate.seconds = 1 / config.update_rate.fps;

// grab the html span
const game_state = document.getElementById('game_state');
const player_health = document.getElementById('player_health');

// grab the html canvas
const game_canvas = document.getElementById('game_canvas');
game_canvas.style.width = `${config.canvas_size.width}px`;
game_canvas.style.height = `${config.canvas_size.height}px`;

const graphics = game_canvas.getContext('2d');

// for monitors with a higher dpi
if (config.graphics.is_hi_dpi) {
	game_canvas.width = 2 * config.canvas_size.width;
	game_canvas.height = 2 * config.canvas_size.height;
	graphics.scale(2, 2);
} else {
	game_canvas.width = config.canvas_size.width;
	game_canvas.height = config.canvas_size.height;
	graphics.scale(1, 1);
}

/* 
------------------------------
------- MAIN SECTION  -------- 
------------------------------
*/

/** @type {Number} last frame time in seconds */
var last_time = null;

/** @type {Number} A counter representing the number of update calls */
var loop_count = 0;

/** @type {Number} A counter that is used to assign bodies a unique identifier */
var running_id = 0;

/** @type {Object<Number, Body>} This is a map of body ids to body instances */
var entities = null;

/** @type {Array<Number>} This is an array of body ids to remove at the end of the update */
var queued_entities_for_removal = null;

/** @type {Player} The active player */
var player = null;

/* You must implement this, assign it a value in the start() function */
var enemy_spawner = null;

/* You must implement this, assign it a value in the start() function */
var collision_handler = null;

/**
 * This function updates the state of the world given a delta time.
 * 
 * @param {Number} delta_time Time since last update in seconds.
 */
function update(delta_time) {
	// move entities
	Object.values(entities).forEach(entity => {
		entity.update(delta_time);
	});

	// detect and handle collision events
	if (collision_handler != null) {
		collision_handler.update(delta_time);
	}

	// remove enemies
	queued_entities_for_removal.forEach(id => {
		delete entities[id];
	})
	queued_entities_for_removal = [];

	// spawn enemies
	if (enemy_spawner != null) {
		enemy_spawner.update(delta_time);
	}

	// allow the player to restart when dead
	if (player.isDead() && player.controller.action_1) {
		start();
	}
}

/**
 * This function draws the state of the world to the canvas.
 * 
 * @param {CanvasRenderingContext2D} graphics The current graphics context.
 */
function draw(graphics) {
	// default font config
	graphics.font = "10px Arial";
	graphics.textAlign = "left";

	// draw background (this clears the screen for the next frame)
	graphics.fillStyle = '#FFFFFF';
	graphics.fillRect(0, 0, config.canvas_size.width, config.canvas_size.height);

	// for loop over every eneity and draw them
	Object.values(entities).forEach(entity => {
		entity.draw(graphics);
	});

	// game over screen
	if (player.isDead()) {
		graphics.font = "30px Arial";
		graphics.textAlign = "center";
		graphics.fillText('Game Over', config.canvas_size.width / 2, config.canvas_size.height / 2);
		  
		graphics.font = "12px Arial";
		graphics.textAlign = "center";
		graphics.fillText('press space to restart', config.canvas_size.width / 2, 18 + config.canvas_size.height / 2);
	}
}

/**
 * This is the main driver of the game. This is called by the window requestAnimationFrame event.
 * This function calls the update and draw methods at static intervals. That means regardless of
 * how much time passed since the last time this function was called by the window the delta time
 * passed to the draw and update functions will be stable.
 * 
 * @param {Number} curr_time Current time in milliseconds
 */
function loop(curr_time) {
	// convert time to seconds
	curr_time /= 1000;

	// edge case on first loop
	if (last_time == null) {
		last_time = curr_time;
	}

	var delta_time = curr_time - last_time;

	// this allows us to make stable steps in our update functions
	while (delta_time > config.update_rate.seconds) {
		update(config.update_rate.seconds);
		draw(graphics);

		delta_time -= config.update_rate.seconds;
		last_time = curr_time;
		loop_count++;

		game_state.innerHTML = `Loop Count: ${loop_count}`;
		player_health.innerHTML = `Player Health: ${player.health}`;
		enemy_killed.innerHTML = `Enemy Killed:${collision_handler.count}`;
	}

	window.requestAnimationFrame(loop);
}

function start() {
	entities = [];
	queued_entities_for_removal = [];
	player = new Player();
	
	enemy_spawner = new EnemySpawner();
	collision_handler = new CollisionHandler();
}
 
// start the game
start();

// start the loop
window.requestAnimationFrame(loop);