// TODO : we shouldn't need this imported here, only as dependency in daftbot.js
var gpio = require("pi-gpio");

// don't npm install this
// you can, but while developing you should clone this:
// https://github.com/smoochy/daftbot
// and 'npm link' from the project directory
var daftbot = require('daftbot');

var INTERVAL = 33;

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



// TODO: we can dispense with the factories,
// they really aren't adding much value.
// Either that or move into daftbot
console.log("creating MOTORS!");

var leftMotorPins = {
  motor_1 : LEFT_MOTOR_1,
  motor_2 : LEFT_MOTOR_2
};

var rightMotorPins = {
  motor_1 : RIGHT_MOTOR_1,
  motor_2 : RIGHT_MOTOR_2
};

var rightMotor = new daftbot.Motor(rightMotorPins);
var leftMotor = new daftbot.Motor(leftMotorPins);

var vehicle = new daftbot.Vehicle({
  leftMotor : leftMotor,
  rightMotor : rightMotor
});

console.log(vehicle.motors.length);

console.log("creating WHISKERS!");

var leftWhiskerPins = {
  pinIn : LEFT_WHISKER_IN,
  out : LEFT_WHISKER_OUT
};

var rightWhiskerPins = {
  pinIn : RIGHT_WHISKER_IN,
  out : RIGHT_WHISKER_OUT
};

var rightWhisker = new daftbot.Whisker(rightWhiskerPins);
var leftWhisker = new daftbot.Whisker(leftWhiskerPins);

vehicle.addSensor(rightWhisker);
vehicle.addSensor(leftWhisker);

console.log(vehicle.sensors.length);

// this guy runs over and over in continuous loop
var loop = function(){
  vehicle.update(); 
};

var setup = function(){
  console.log("starting engine");
  vehicle.startEngine();  // enable motor and whisker pins

  console.log("forward");
  vehicle.forward();  //tallyho!
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
