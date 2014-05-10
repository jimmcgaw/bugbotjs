var gpio = require("pi-gpio");

var INTERVAL = 500;

var LED_PIN = 12;

// left antennae of bugbot
var ANTLEFT_PIN = 16;

var turnOn = function(){
  gpio.write(LED_PIN, 1, function(){
    //console.log("turned on");
  });
};

var turnOff = function(){
  gpio.write(LED_PIN, 0, function(){
    //console.log("turned off");
  });
};

var loop = function(){

  gpio.read(ANTLEFT_PIN, function(err, value){
    console.log(value);
    if (value === 0){
      // circuit is closed, bug has hit something
      // stop and initiate rotating
      turnOn();
    } else {
      // all's clear
      turnOff();
    }

  }); 

};

var setup = function(){
  console.log("running setup");

  console.log("setting led pin");
  gpio.open(LED_PIN, "output", function(err) {
  });

  console.log("setting antennae left pin");
  gpio.open(ANTLEFT_PIN, "input", function(err){
  });

  setInterval(loop, INTERVAL);
};

setup();


// close all pins on program exit or ctrl-c
// src: http://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup){
      gpio.close(ANTLEFT_PIN);
      gpio.close(LED_PIN);
    }
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
