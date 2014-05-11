var gpio = require("pi-gpio");

var INTERVAL = 500;

var LOW = 0;
var HIGH = 1;

// whisker pins
var RIGHT_WHISKER_IN = 16;
var RIGHT_WHISKER_OUT = 18;
var LEFT_WHISKER_IN = 11;
var LEFT_WHISKER_OUT = 13;

// motor pins
var RIGHT_MOTOR_1 = 12;
var RIGHT_MOTOR_2 = 22;
var LEFT_MOTOR_1 = 7;
var LEFT_MOTOR_2 = 15;

// whisker component of a motor
var Whisker = function(pins){
  this.pinIn = pins.pinIn;
  this.out = pins.out; 
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

  this.whisker = new Whisker({ pinIn : pins.whisker_in, out : pins.whisker_out });
};

Motor.prototype.enable = function(){
  console.log("enabling whisker pins " + this.whisker.pinIn + " and " + this.whisker.out);
  var whisker_in = this.whisker.pinIn;
  gpio.open(whisker_in, "input", function(){});
  
  console.log(this.whisker.out);
  var whisker_out = this.whisker.out;
  gpio.open(whisker_out, "output", function(){
    console.log(whisker_out);
    gpio.write(whisker_out, HIGH, function(){});
  });
  
  console.log("enabling motor pins " + this.pins.motor_1 + " and " + this.pins.motor_2);
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

KnightRider.prototype.checkWhiskers = function(){
  var carBrain = this;
  var whiskers = this.motors.map(function(motor){ return motor.whisker });
  console.log(whiskers);

  for (var i = 0, len = whiskers.length; i < len; i++){
    var whisker = whiskers[i];
    console.log( "reading from pin " + whisker.pinIn );
    gpio.read(whisker.pinIn, function(err, value){
      console.log(value);
    });
  }

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
  knightRider.checkWhiskers(); 
};

var setup = function(){
  console.log("starting engine");
  knightRider.startEngine();  // enable motor and whisker pins

  console.log("forward");
  knightRider.forward();  //tallyho!
  console.log("running loop");
  setInterval(loop, INTERVAL);
};

// start the beast
setup();


// for cleanup on exit
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
