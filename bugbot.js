var gpio = require("pi-gpio");

var INTERVAL = 50;

var LOW = 0;
var HIGH = 1;

// whisker pins
var RIGHT_WHISKER_1 = 16;
var RIGHT_WHISKER_2 = 18;
var LEFT_WHISKER_1 = 13;
var LEFT_WHISKER_2 = 15;

// motor pins
var RIGHT_MOTOR_1 = 12;
var RIGHT_MOTOR_2 = 22;
var LEFT_MOTOR_1 = 7;
var LEFT_MOTOR_2 = 15;

// for cleanup at bottom
var ALL_PINS = [
  RIGHT_WHISKER_1,
  RIGHT_WHISKER_2,
  LEFT_WHISKER_1,
  LEFT_WHISKER_2,
  RIGHT_MOTOR_1,
  RIGHT_MOTOR_2,
  LEFT_MOTOR_1,
  LEFT_MOTOR_2
];

var loop = function(){

  gpio.read(RIGHT_WHISKER_2, function(err, value){
    console.log(value);
    //console.log(err);
    if (value === HIGH){
      // circuit is closed, bug has hit something
      // stop and initiate rotating
      stopMotors();
    } else {
      // all's clear
      startMotors();
    }
    // TODO: instead of constant adjusting, store value and only call these if change?

  }); 

};

var startMotors = function(){
  startLeft();
  startRight();
};

var startLeft = function(){
  gpio.write(LEFT_MOTOR_1, HIGH, function(){});
  gpio.write(LEFT_MOTOR_2, LOW, function(){});
};

var startRight = function(){
  gpio.write(RIGHT_MOTOR_1, HIGH, function(){});
  gpio.write(RIGHT_MOTOR_2, LOW, function(){});
};

var stopMotors = function(){
  stopLeft();
  stopRight();
};

var stopLeft = function(){
  gpio.write(LEFT_MOTOR_1, LOW, function(){});
  gpio.write(LEFT_MOTOR_2, LOW, function(){});
};

var stopRight = function(){
  gpio.write(RIGHT_MOTOR_1, LOW, function(){});
  gpio.write(RIGHT_MOTOR_2, LOW, function(){});
};

var setup = function(){
  console.log("running setup");

  console.log("setting led pin");

  gpio.open(RIGHT_MOTOR_1, "output", function(err) {});
  gpio.open(RIGHT_MOTOR_2, "output", function(err) {});

  gpio.open(LEFT_MOTOR_1, "output", function(err) {});
  gpio.open(LEFT_MOTOR_2, "output", function(err) {});

  console.log("setting antennae left pin");
  gpio.open(RIGHT_WHISKER_1, "input", function(err){});
  gpio.open(RIGHT_WHISKER_2, "output", function(err){
    gpio.write(RIGHT_WHISKER_2, HIGH, function(){});
  });
  
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
