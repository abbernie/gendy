function Gendy(actx){

    this.actx = actx;
    this.breakpoints = 5;

    this.scriptNode = actx.createScriptProcessor(512,1,1);

    this.breakpoint = [];

    this.xStep = 10;
    this.xRoom = 10;

    this.yMax = 0.5;
    this.yMin = -0.5;
    this.yStep = 0.01;

    this.index = 0;
    this.point = 0;
    this.y = 0;
    this.freq = 0.5;

    this.wave = 'linear';
    this.waveformlength = 850;

    this.spline;

    this.init();
}

Gendy.prototype.init = function(){
    //randomly set the initial x,y location of the specified number of breakpoints
    this.lastX = 0;
    this.last = 0;
            
    for(var i = 0;i < this.breakpoints;i++){
        if(i == 0){
            //generate breakpoints
            this.breakpoint[0] = {
                x : 0.0,
                y : 0.0,
                x1: 0.0,
                y1: 0.0,
                m:0.0,
                b:0.0
            };
        } else if(i != 0){
            
            this.breakpoint[i] = {};
            this.breakpoint[i].x = ((this.waveformlength/this.breakpoints)*i);
            
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

    /*    
    Debugging

    if (i>0 && i<this.breakpoint.length) {

        	with (context) {
        		lineWidth = 4
        		strokeStyle = "#fa0"
        		beginPath()
        			moveTo(this.breakpoint[i-1].x,this.breakpoint[i-1].y*canvas.height/2 + canvas.height/2)
        			lineTo(this.breakpoint[i].x,this.breakpoint[i].y*canvas.height/2 + canvas.height/2)
        			stroke()
        		closePath()
        	}		


        } */

    }
    // bezier interpolation is buggy
     if(this.wave == 'bezier'){
        this.convertBreakpoints();
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
                this.breakpoint[i].xMax = this.waveformlength;
            }
            
            this.breakpoint[i].xMin = this.breakpoint[last].x+this.xRoom;
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

      /*  
      Debugging

      if (i>0 && i<this.breakpoint.length) {

        	with (context) {
        		strokeStyle = "#fa0"
        		beginPath()
        			moveTo(this.breakpoint[i-1].x,this.breakpoint[i-1].y*canvas.height/2 + canvas.height/2)
        			lineTo(this.breakpoint[i].x,this.breakpoint[i].y*canvas.height/2 + canvas.height/2)
        			stroke()
        		closePath()
        	}		

        } */

    }
    if(this.wave == 'bezier'){
        this.convertBreakpoints();
    }
}

Gendy.prototype.convertBreakpoints = function() {
        this.testpts = []
        for (var i=0;i<this.breakpoint.length;i++) {
          this.testpts.push(this.breakpoint[i].x)
          this.testpts.push(this.breakpoint[i].y)
        }

        this.spline = this.getCurvePoints(this.testpts, 0.5, false, 16)
        console.log(this.spline)
}

Gendy.prototype.process = function(){
    var point = 0;
    var index = 0;
    var y = 0;
    
    if(this.wave == 'linear'){
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
                //    context.fillStyle = "#eee"
        		//	context.fillRect(0,0,canvas.width,canvas.height)
        
                }  

    	    //	context.fillStyle = "#0af"
    	    //	context.fillRect(this.index,this.y * canvas.height/2 + canvas.height/2,5,5)
            }
        }.bind(this);
    } else if(this.wave == 'bezier'){
        // bezier interpolation is buggy / does not currently work
        this.scriptNode.onaudioprocess = function(audioProcessingEvent){
          
          var outputBuffer = audioProcessingEvent.outputBuffer;
          var outputData = outputBuffer.getChannelData(0);
          for(var j = 0; j < outputData.length;j++){

              if(this.point < this.spline.length && this.index >= this.spline[this.point+1].x) {
                while (this.index > this.spline[this.point+1].x) {
                  this.point++;
                  if (this.point > this.spline.length) { break; }
                }
              }

              // linearly interpolate between the new breakpoint positions
              // get the interp point by comparing index to the x distance 
              
              var lerp = (this.index - this.spline[this.point].x) / (this.spline[this.point+1].x - this.spline[this.point].x)
              
              y = lerp * (this.spline[this.point+1].y - this.spline[this.point].y) + this.spline[this.point].y;
              
              outputData[j] = y;
              this.index+=this.freq; 

              if(this.index >= this.spline[this.spline.length-1].x){
                  this.index = 0;
                  this.point = 0;
                  this.walk(); 
              }  
                /*
              context.globalAlpha = 1;
              context.fillStyle = "#0000a0";
              context.fillRect(index,y*canvas.height+canvas.height/2,5,5);
              */
          }

        }.bind(this);

    }
}
      


Gendy.prototype.getCurvePoints = function(pts, tension, isClosed, numOfSegments) {

      // use input value if provided, or use a default value   
      tension = (typeof tension != 'undefined') ? tension : 0.5;
      isClosed = isClosed ? isClosed : false;
      numOfSegments = numOfSegments ? numOfSegments : 16;

      var _pts = [], res = [],    // clone array
          x, y,           // our x,y coords
          t1x, t2x, t1y, t2y, // tension vectors
          c1, c2, c3, c4,     // cardinal points
          st, t, i;       // steps based on num. of segments

      // clone array so we don't change the original
      _pts = pts.slice(0);

      // The algorithm require a previous and next point to the actual point array.
      // Check if we will draw closed or open curve.
      // If closed, copy end points to beginning and first points to end
      // If open, duplicate first points to befinning, end points to end
      if (isClosed) {
          _pts.unshift(pts[pts.length - 1]);
          _pts.unshift(pts[pts.length - 2]);
          _pts.unshift(pts[pts.length - 1]);
          _pts.unshift(pts[pts.length - 2]);
          _pts.push(pts[0]);
          _pts.push(pts[1]);
      }
      else {
          _pts.unshift(pts[1]);   //copy 1. point and insert at beginning
          _pts.unshift(pts[0]);
          _pts.push(pts[pts.length - 2]); //copy last point and append
          _pts.push(pts[pts.length - 1]);
      }

      // ok, lets start..

      // 1. loop goes through point array
      // 2. loop goes through each segment between the 2 pts + 1e point before and after
      for (i=2; i < (_pts.length - 4); i+=2) {
          for (t=0; t <= numOfSegments; t++) {

              // calc tension vectors
              t1x = (_pts[i+2] - _pts[i-2]) * tension;
              t2x = (_pts[i+4] - _pts[i]) * tension;

              t1y = (_pts[i+3] - _pts[i-1]) * tension;
              t2y = (_pts[i+5] - _pts[i+1]) * tension;

              // calc step
              st = t / numOfSegments;

              // calc cardinals
              c1 =   2 * Math.pow(st, 3)  - 3 * Math.pow(st, 2) + 1; 
              c2 = -(2 * Math.pow(st, 3)) + 3 * Math.pow(st, 2); 
              c3 =       Math.pow(st, 3)  - 2 * Math.pow(st, 2) + st; 
              c4 =       Math.pow(st, 3)  -     Math.pow(st, 2);

              // calc x and y cords with common control vectors
              x = c1 * _pts[i]    + c2 * _pts[i+2] + c3 * t1x + c4 * t2x;
              y = c1 * _pts[i+1]  + c2 * _pts[i+3] + c3 * t1y + c4 * t2y;

              //store points in array
              res.push({x: x, y: y});

          }
      }

      return res;
  }  

Gendy.prototype.setBreakpoints = function(num){
    this.breakpoints = num;
    this.init();
}

Gendy.prototype.connect = function(output){
    this.scriptNode.connect(output);
}

Gendy.prototype.disconnect = function(output){
	this.scriptNode.disconnect(output);
}

Gendy.prototype.start = function(){
    this.process();
}

