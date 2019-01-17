function ArrayReader(data){
  this.data = data;
  this.eventsAndCallbacks = {};
  this.currentIndex = 0;
  this.maxIndex = data.length-1;
  this.isRunning = false;
}

ArrayReader.prototype.on = function (eventName, callback) {
  this.eventsAndCallbacks[eventName.toLowerCase()] = callback;
  if(eventName.toLowerCase() === 'element') {
    this.isRunning = true;
    this.readElement();
  }
}

// ArrayReader.prototype.start = function() {
//   if(this.eventsAndCallbacks.element){
//     this.isRunning = true;
//     this.readElement();
//   }
// };

ArrayReader.prototype.readElement = function() {
  // if not running or no 'element' function return
  if(!(this.isRunning && this.eventsAndCallbacks.element)) return;

  // if we've reached the end of the array
  if(this.currentIndex > this.maxIndex){
    // set the isRunning flag
    this.isRunning = false;
    // if there is an END() function, call it
    if(this.eventsAndCallbacks.end){
      this.eventsAndCallbacks.end();
    }
    return;
  }
  this.eventsAndCallbacks.element(this.data[this.currentIndex]);
  this.currentIndex += 1;
  this.readElement();
};

ArrayReader.prototype.pause = function(){ this.isRunning = false; }
ArrayReader.prototype.resume = function(){
  this.isRunning = true;
  this.readElement();
}

module.exports = ArrayReader;