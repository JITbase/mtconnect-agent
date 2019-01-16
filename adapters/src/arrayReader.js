function ArrayReader(data){
  this.data = data;
  this.eventsAndCallbacks = {};
  this.currentIndex = 0;
  this.maxIndex = data.length-1;

}

ArrayReader.prototype.on = function (eventName, callback) {
  this.eventsAndCallbacks[eventName] = callback;
}

ArrayReader.prototype.start = function() {
  if(this.eventsAndCallbacks.element){
    this.readElement();
  }
};

ArrayReader.prototype.readElement = function() {
  if(this.currentIndex > this.maxIndex){
    if(this.eventsAndCallbacks.end){
      this.eventsAndCallbacks.end();
    }
    return;
  }
  this.eventsAndCallbacks.element(this.data[this.currentIndex]);
  this.currentIndex += 1;
  this.readElement();
};

module.exports = ArrayReader;