/**
 * CollisionHandler.js
 * 
 * lib to handle collision and perimeter detection of controls
 * 
 * Scott Clarke
 * 
 * Copyright 2012 Electronic Arts Inc. All Rights Reserved.
 */
simcity.cCollisionHandler = function(){
    this.mMouseCir = {};
    this.mDocWidth = 0;
    this.mDocHeight = 0;
    this.mObjectList = [];
    this.mItemMap = null;
    this.mDebug = true;    
    
    //screen seg props
    this.mSegmentPixelSize = 100;
    this.mDocBody = null;
    this.mTotalSegmentsX = null;
    this.mTotalSegmentsY = null;
    
    //canvas 
    this.mBgCanvasDomObj = null;
    this.mBgCanvas = null;
    
    //create an array to hold screen items based on segments
    this.mItemMap = null;
    
    //create array to hold active controls
    this.mActiveItems = new Array();
    
}

/**
 * init method
 * @param {Object} win
 */
simcity.cCollisionHandler.prototype.Init = function(win) {
    
    this.mDocBody = document.body;
    this.mDocWidth = docBody.clientWidth;
    this.mDocHeight = docBody.clientHeight;
	this.mTotalSegmentsX = Math.ceil(docWidth/segmentPixelSize);
	this.mTotalSegmentsY = Math.ceil(docHeight/segmentPixelSize);
    
    if (this.mDebug) {
        this.mBgCanvasDomObj = document.getElementById('bgCanvas');
        this.mBgCanvas = this.mBgCanvasDomObj.getContext("2d");
        this.mBgCanvasDomObj.width = this.mDocWidth;
        this.mBgCanvasDomObj.height = this.mDocHeight;
        this.DrawTrackingGrid();    
    }
    
    this.mMouseCir.radius = 5;

    this.BuildEmptyItemMap();
    this.HandleMouseTracking(true);
    setInterval(this.CheckActiveItems, 100);
}

/**
 * registers active control on activeItem array
 * @param {Object} control
 */
simcity.cCollisionHandler.prototype.AddActiveItem = function(control) {
    var totalItems = this.mActiveItems.length;
    var i = 0;
    var controlRegistered = false;
    
    while(i<totalItems) {
        if (this.mActiveItems[i] === control) {
            controlRegistered = true;
        }
        i++;
    }
    
    if(!controlRegistered) {
        this.mActiveItems.push(control);
    }
    
}

/**
 * removes control from activeItem array
 * @param {Object} control
 */
simcity.cCollisionHandler.prototype.RemoveActiveItem = function(control) {
    var totalItems = this.mActiveItems.length;
    var i = 0;
    var newArr = new Array();
    
    while(i<totalItems) {
        if (this.mActiveItems[i] !== control) {
            newArr.push(this.mActiveItems[i]);
        }
        i++;
    }
    this.mActiveItems = newArr;
    
}

/**
 * loops over this.mActiveItems and cleans up any orphaned controls which are no longer need the cursor
 */
simcity.cCollisionHandler.prototype.CheckActiveItems = function() {
    var totalItems = activeItems.length;
    var i = 0;
    var newArr = new Array();
    
    while(i<totalItems) {
        var control = activeItems[i];
        var collInfo = checkCollision(mouseCir, control);
        if (!collInfo.isColliding) {
            
            if (scaleCircles) {
                if (control && control.isResized) {
                    control.style.transform = "scale(1,1)";
                    control.style.msTransform = "scale(1,1)";
                    control.style.MozTransform = "scale(1,1)";
                    control.style.WebkitTransform = "scale(1,1)";
                    control.isResized = false;
                }
            } else {
                if (control) {
                    control.style.backgroundColor = '#ccc';
                }
            }        
            removeActiveItem(control);
        }
        i++;
    }
}

/**
 * debug method which draws where the tracking gris is on the screen
 */
simcity.cCollisionHandler.prototype.DrawTrackingGrid = function() {
    var i = 0;
    while(i < this.mTotalSegmentsY) {
        bgCanvas.beginPath();
        bgCanvas.moveTo(0, segmentPixelSize*i);
        bgCanvas.lineTo(this.mDocWidth, segmentPixelSize*i);
        bgCanvas.stroke();
        i++;
    }
    i = 0;
    while(i < this.mTotalSegmentsX) {
        bgCanvas.beginPath();
        bgCanvas.moveTo(segmentPixelSize*i, 0);
        bgCanvas.lineTo(segmentPixelSize*i, this.mDocHeight);
        bgCanvas.stroke();
        i++;
    }
    
    
}

/**
 * create 2d array table containing an empty array for each screen segment
 */
simcity.cCollisionHandler.prototype.BuildEmptyItemMap = function() {
    itemMap = new Array(this.mTotalSegmentsX, this.mTotalSegmentsY);
    for(var i=0; i <= this.mTotalSegmentsX; i++) {
        itemMap[i] = new Array;
        for(var x=0; x <= this.mTotalSegmentsY; x++) {
            itemMap[i][x] = new Array;    
        }
    }
}

/**
 * method to register the mouse tracking events to HandleMouseMove
 * @param {Object} doTracking
 */
simcity.cCollisionHandler.prototype.HandleMouseTracking = function(doTracking) {
    if (doTracking) {
        this.mDocBody.onmousemove = handleMouseMove;
        this.mDocBody.ontouchstart = function () {arguments[0].preventDefault();};
        this.mDocBody.ontouchmove = handleMouseMove;
        this.mDocBody.ontouchend = function () {};
    } else {
        //document.getElementsByTagName("body")[0].onmousemove = null;
    }
}

/**
 * handles mouse movement and control dection
 */
simcity.cCollisionHandler.prototype.HandleMouseMove = function() {
    var evtData = arguments[0];
    var collInfo = null;
    var subObjList = new Array();

    if(evtData.touches) {
        mouseCir.offsetLeft = (evtData.touches[0].clientX-mouseCir.radius);
        mouseCir.offsetTop = (evtData.touches[0].clientY-mouseCir.radius);
        subObjList = subObjList.concat(findElemsAtSegmentCoords(evtData.touches[0].clientX, evtData.touches[0].clientY));
    } else {
        mouseCir.offsetLeft = (evtData.clientX-mouseCir.radius);
        mouseCir.offsetTop = (evtData.clientY-mouseCir.radius);
        subObjList = findElemsAtSegmentCoords(evtData.clientX, evtData.clientY);
    }
    var totalObjs = subObjList.length || 0;
    
    if (totalObjs > 0) {
        var index =0
        //loop over list of object and detect collisions
        while(index < totalObjs) {
            var control = subObjList[index];
            if (control.collisionOn && control.collisionOff) {
                collInfo = checkCollision(mouseCir, control);
                if (collInfo.isColliding) {
                    addActiveItem(control);
                    control.collisionOn(collInfo.distance);
                }
                else {
                    removeActiveItem(control);
                    control.collisionOff(collInfo.distance);
                }
            }
            index++;
        }
    }

}

/**
 * method used to create an array list of controls within a 3x3 grid around the mouse cursor
 * @param {Object} mouseX
 * @param {Object} mouseY
 */
simcity.cCollisionHandler.prototype.FindElemsAtSegmentCoords = function(mouseX, mouseY) {
    
    var newList = new Array();
    
    // x,y
	var primeSegmentX = Math.floor(mouseX/segmentPixelSize);
	var primeSegmentY = Math.floor(mouseY/segmentPixelSize);
    newList = itemMap[primeSegmentX][primeSegmentY];
    
    // x+,y
    if (itemMap[primeSegmentX + 1][primeSegmentY]) {
        newList = newList.concat(itemMap[primeSegmentX + 1][primeSegmentY]);
    }

    // x-,y
    if (primeSegmentX - 1 >=0 && itemMap[primeSegmentX - 1][primeSegmentY]) {
        newList = newList.concat(itemMap[primeSegmentX - 1][primeSegmentY])
    }

    // x-,y-
    if (primeSegmentX - 1 >=0 && primeSegmentY - 1 >=0 && itemMap[primeSegmentX - 1][primeSegmentY - 1]) {
        newList = newList.concat(itemMap[primeSegmentX - 1][primeSegmentY - 1])
    }

    // x,y-
    if (primeSegmentY - 1 >=0 && itemMap[primeSegmentX][primeSegmentY - 1]) {
        newList = newList.concat(itemMap[primeSegmentX][primeSegmentY - 1])
    }

    // x,y+
    if (itemMap[primeSegmentX][primeSegmentY + 1]) {
        newList = newList.concat(itemMap[primeSegmentX][primeSegmentY + 1])
    }
    
    // x-,y+
    if (primeSegmentX - 1 >=0 && itemMap[primeSegmentX - 1][primeSegmentY + 1]) {
        newList = newList.concat(itemMap[primeSegmentX - 1][primeSegmentY + 1])
    }
    
    // x,y+
    if (itemMap[primeSegmentX][primeSegmentY + 1]) {
        newList = newList.concat(itemMap[primeSegmentX][primeSegmentY + 1])
    }

    // x+,y+
    if (itemMap[primeSegmentX + 1][primeSegmentY + 1]) {
        newList = newList.concat(itemMap[primeSegmentX + 1][primeSegmentY + 1])
    }

    return newList;
    
}

/**
 * method used to detect the distance between the mouse and a control
 * @param {Object} mouse
 * @param {Object} control
 */
simcity.cCollisionHandler.prototype.CheckDistance = function(mouseCircle, control) {
    var collDist = 5000;
    var isColliding = false;
    if (mouseCircle && control) {
        var dx = (mouseCircle.offsetLeft + mouseCircle.radius) - (control.detectionCircleX + control.detectionCircleRadius);
        var dy = (mouseCircle.offsetTop + mouseCircle.radius) - (control.detectionCircleY + control.detectionCircleRadius);
        var dist = mouseCircle.radius + control.detectionCircleRadius;
        var delta1 = (dx * dx) + (dy * dy);
        var delta2 = dist * dist;
        collDist = ((delta1 - delta2) * -1) / 100;
        isColliding = delta1 <= delta2;
    }
 
    return ({'isColliding': isColliding, 'distance': collDist});
    
}




