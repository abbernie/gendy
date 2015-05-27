function Gendy(actx){

    this.actx = actx;
    this.breakpoints = 5;

    this.scriptNode = actx.createScriptProcessor(512,1,1);

    this.breakpoint = [];

    this.xStep = 10;
    this.xRoom = 1;

    this.yMax = 0.5;
    this.yMin = -0.5;
    this.yStep = 0.01;

    this.index = 0;
    this.point = 0;
    this.y = 0;
    this.freq = 0.5;

    this.init();
}

Gendy.prototype.init = function(){

    this.lastX = 0;
    this.last = 0;
            
    for(var i = 0;i < this.breakpoints;i++){
        if(i == 0){
            //generate breakpoints
            this.breakpoint[0] = {
                x : 0.0,
                y : 0.0
                };
        } else if(i != 0){
            
            this.breakpoint[i] = {};
            this.breakpoint[i].x = (Math.random()*200)+this.lastX;
            
            if(this.breakpoint[i].x >= this.scriptNode.bufferSize){
                this.breakpoint[i].x = this.scriptNode.bufferSize-10;
            }
            this.lastX = this.breakpoint[i].x;
            this.breakpoint[i].y = (Math.random()*2)-1;
            if(i == this.breakpoints-1){
                this.breakpoint[i].y = 0;
            }
            
            this.last = i;
        } else if(i == this.breakpoints-1){
            this.breakpoint[i].y = 0;
        }
    }

}
        
Gendy.prototype.walk = function(){
          
    var last = 0;
    var next = 1;
   
    for(var i = 0; i < this.breakpoint.length;i++){
        if(i != 0){
            var randomx = Math.floor(Math.random()*2);
            var x = this.breakpoint[i].x;
            
            if(i != this.breakpoint.length-1){
                this.breakpoint[i].xMax = this.breakpoint[next].x-this.xRoom;
            } else {
                this.breakpoint[i].xMax = this.scriptNode.bufferSize-this.xRoom;
            }
            
            this.breakpoint[i].xMin = this.breakpoint[this.last].x+this.xRoom;
            // the random walk, 2 samples in either direction
            if(randomx == 0){
                x = x - this.xStep;
            } else if(randomx == 1){
                x = x + this.xStep;
            }
           //bounds on the random walk, if it goes out of bounds, it jumps the difference back in
            if(x >= this.breakpoint[i].xMax-this.xRoom){
               x = this.breakpoint[i].xMax-this.xRoom;
            } else if(x <= this.breakpoint[i].xMin+this.xRoom){
               x = this.breakpoint[i].xMin+this.xRoom;
            }
            this.breakpoint[i].x = x;
            
            var randomy = Math.floor(Math.random()*2);
            var y = this.breakpoint[i].y;
            if(randomy == 0){
                y = y - this.yStep;
            } else if(randomy == 1){
                y = y + this.yStep;
            }
            if(y > this.yMax){
                y = this.yMax-(this.y-this.yMax);
            } else if(y < this.yMin){
                y = this.yMin-(this.y-this.yMin);
            }
            this.breakpoint[i].y = y;
        } 
        if(i == this.breakpoint.length-1){
            this.breakpoint[i].y = 0;
            
        }
        last = i;
        next++;
    }
}

Gendy.prototype.process = function(){

    this.scriptNode.onaudioprocess = function(audioProcessingEvent){
	   
        var outputBuffer = audioProcessingEvent.outputBuffer;
        var outputData = outputBuffer.getChannelData(0);
        
        for(var j = 0; j < outputData.length;j++){
            // linearly interpolate between the new breakpoint positions
            // get the interp point by comparing index to the x distance
            var lerp = (this.index - this.breakpoint[this.point].x) / (this.breakpoint[this.point+1].x - this.breakpoint[this.point].x);
            
            this.y = lerp * (this.breakpoint[this.point+1].y - this.breakpoint[this.point].y) + this.breakpoint[this.point].y;
            if(this.point < this.breakpoint.length && this.index >= this.breakpoint[this.point+1].x) {
                this.point++;
            }
            
            outputData[j] = this.y;
            this.index+=this.freq; 
            if(this.index >= this.breakpoint[this.breakpoint.length-1].x){
                this.index = 0;
                this.point = 0;
                this.walk(); 
            }  
        }
    }.bind(this);
}
       
Gendy.prototype.connect = function(output){
    this.scriptNode.connect(output);
}

Gendy.prototype.disconnect = function(output){
	this.scriptNode.disconnect(this.output);
}

Gendy.prototype.start = function(){
    this.process();
}

