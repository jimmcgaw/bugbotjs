var gpio = require("pi-gpio");

var LED_PIN = 12;

gpio.open(LED_PIN, "output", function(err) {     // Open pin 16 for output
  turnOn();
});

var turnOn = function(){
  gpio.write(LED_PIN, 1, function(){
    setTimeout(turnOff, 1000);
  });
};

var turnOff = function(){
  gpio.write(LED_PIN, 0, function(){
    setTimeout(turnOn, 1000);
  });
};

var loop = function(){
  
};

setInterval(loop, 10);
