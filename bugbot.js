var gpio = require("pi-gpio");

var INTERVAL = 50;

var LOW = 0;
var HIGH = 1;

// whisker pins
var RIGHT_WHISKER_IN = 16;
var RIGHT_WHISKER_OUT = 18;
var LEFT_WHISKER_IN = 13;
var LEFT_WHISKER_OUT = 15;

// motor pins
var RIGHT_MOTOR_1 = 12;
var RIGHT_MOTOR_2 = 22;
var LEFT_MOTOR_1 = 7;
var LEFT_MOTOR_2 = 15;

// for cleanup at bottom
var ALL_PINS = [
  RIGHT_WHISKER_IN,
  RIGHT_WHISKER_OUT,
  LEFT_WHISKER_IN,
  LEFT_WHISKER_OUT,
  RIGHT_MOTOR_1,
  RIGHT_MOTOR_2,
  LEFT_MOTOR_1,
  LEFT_MOTOR_2
];

// whisker component of a motor
var Whisker = function(pins){
  this.pinIn = pins.pinIn;
  this.out = pins.out; 
};

Whisker.prototype.hasCollided = function(){
 return this.pinIn === HIGH; // whisker has hit something?
};

// this controls the state of a single servo motor
//
// 'pins' defines the following:
// this.whisker_in
// this.whisker_out
// this.motor_1
// this.motor_2
var Motor = function(pins){
  this.pins = pins;

  this.whisker = new Whisker({ pinIn : this.pins.whisker_in, out : this.pins.whisker_out });
};

Motor.prototype.enable = function(){
  gpio.open(this.whisker.pinIn, "input", function(){});
  gpio.open(this.whisker.out, "output", function(){
    this.write(this.whisker.out, HIGH, function(){});
  });
  gpio.open(this.pins.motor_1, "output", function(){})
  gpio.open(this.pins.motor_2, "output", function(){})
  
};

// bring to complete stop
Motor.prototype.halt = function(){
  gpio.write(this.pins.motor_1, LOW, function(){});
  gpio.write(this.pins.motor_2, LOW, function(){});
};

// start motor forward
Motor.prototype.forward = function(){
  gpio.write(this.pins.motor_1, HIGH, function(){});
  gpio.write(this.pins.motor_2, LOW, function(){});
};

// this commands and manages the motors in aggregate
// @param Array 'motors'
//
var KnightRider = function(motors){
  this.motors = motors || []; 
};

KnightRider.prototype.addMotor = function(motor){
  this.motors.push(motor);
};

KnightRider.prototype.forward = function(){
  for (var i = 0, len = this.motors.length; i < len; i++){
    this.motors[i].forward();
  }
};

KnightRider.prototype.halt = function(){
  for (var i = 0, len = this.motors.length; i < len; i++){ 
    this.motors[i].halt();
  } 
};

KnightRider.prototype.startEngine = function(){
  for (var i = 0, len = this.motors.length; i < len; i++){
    this.motors[i].enable();
  }
};

KnightRider.prototype.collided = function(){
  var hasCollided = false;
  for (var i = 0, len = this.motors.length; i < len; i++){
    var motor = this.motors[i];
    if (motor.whisker.hasCollided){
      hasCollided = true;
    }
  }
  return hasCollided;
};

// motor factory class for spawning motors
var MotorMaker = function(){
};

MotorMaker.prototype.motorClass = Motor;

MotorMaker.prototype.createMotor = function(pins){
  return new this.motorClass(pins);
};

var motorMaker = new MotorMaker();

var leftMotorPins = {
  whisker_in : LEFT_WHISKER_IN,
  whisker_out : LEFT_WHISKER_OUT,
  motor_1 : LEFT_MOTOR_1,
  motor_2 : LEFT_MOTOR_2
};

var rightMotorPins = {
  whisker_in : RIGHT_WHISKER_IN,
  whisker_out : RIGHT_WHISKER_OUT,
  motor_1 : RIGHT_MOTOR_1,
  motor_2 : RIGHT_MOTOR_2
};

var rightMotor = motorMaker.createMotor(rightMotorPins);
var leftMotor = motorMaker.createMotor(leftMotorPins);

var knightRider = new KnightRider();
knightRider.addMotor(rightMotor);
knightRider.addMotor(leftMotor);

console.log("MOTORS!");
console.log(knightRider.motors.length);

// this guy runs over and over in continuous loop
var loop = function(){
  console.log(knightRider.hasCollided());
  if (knightRider.hasCollided() ){
    knightRider.halt();
    // rotate and do cool stuff etc
  } else {
    knightRider.forward();
  }
  
};

var setup = function(){
  console.log("running setup");
  console.log("setting led pin");

  knightRider.startEngine();  // enable motor and whisker pins

  console.log("forward");
  knightRider.forward();  //tallyho!
  setInterval(loop, INTERVAL);
};

// start the beast
setup();



// close all pins on program exit or ctrl-c
// src: http://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup){
      for (var i = 0; i < ALL_PINS.length; i++){
        gpio.close(ALL_PINS[i]);
      }
    }
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
