var mouseCir = {};
var docWidth = 0;
var docHeight = 0;
var containerDiv = null;
var objectList = [];
var itemMap = null;
var totalCircles = 50;
var scaleCircles = true;

var radStart = 10;
var radEnd = 20;
var testRad = 70;

//screen seg props
var segmentPixelSize = (testRad*1.5);
var docBody = null;
var totalSegmentsX= null;
var totalSegmentsY= null;

//canvas 
var bgCanvasDomObj = null;
var bgCanvas = null;

//create an array to hold screen items based on segments
var itemMap = null;//new Array(totalSegmentsX, totalSegmentsY)
var activeItems = new Array();

function init(win) {
    
    containerDiv = document.getElementById('container');
    docBody = document.body;
    docWidth = docBody.clientWidth;
    docHeight = docBody.clientHeight;
	totalSegmentsX = Math.ceil(docWidth/segmentPixelSize);
	totalSegmentsY = Math.ceil(docHeight/segmentPixelSize);
    
    bgCanvasDomObj = document.getElementById('bgCanvas');
    bgCanvas = bgCanvasDomObj.getContext("2d");
    bgCanvasDomObj.width = docWidth;
    bgCanvasDomObj.height = docHeight;
    
    //mouseCir = document.getElementById('mousecircle');
    mouseCir.radius = 5;

    buildEmptyItemMap();
    drawTrackingGrid();
    
    var totalRadius = radStart + testRad;
    for (var i = 0; i < totalCircles; i++) {
        var x = Math.floor(Math.random()*docWidth);
        var y = Math.floor(Math.random()*(docHeight-30));
        createTestCircle(radStart, testRad, x, y);
    }
    
    var textStr = ['D','E','T','E','C','T'];
    var startLeft = 10;
    for(var i = 0; i< textStr.length; i++) {
        var pcircle = createTestCircle(30, 70, (startLeft + (i*65)), 20);
        pcircle.innerHTML = textStr[i];
    }
    //console.debug(itemMap);    
    
    HandleMouseTracking(true);
    setInterval(checkActiveItems, 100);
}

function addActiveItem(control) {
    var totalItems = activeItems.length;
    var i = 0;
    var controlRegistered = false;
    
    while(i<totalItems) {
        if (activeItems[i] === control) {
            controlRegistered = true;
        }
        i++;
    }
    
    if(!controlRegistered) {
        activeItems.push(control);
    }
    
}

function removeActiveItem(control) {
    var totalItems = activeItems.length;
    var i = 0;
    var newArr = new Array();
    
    while(i<totalItems) {
        if (activeItems[i] !== control) {
            newArr.push(activeItems[i]);
        }
        i++;
    }
    activeItems = newArr;
    
}

function checkActiveItems() {
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

function flushActiveItems() {
    var totalItems = activeItems.length;
    var i = 0;
    
    while(i<totalItems) {
        //reset control
        i++;
    }
}

function drawTrackingGrid() {
    var i = 0;
    while(i < totalSegmentsY) {
        bgCanvas.beginPath();
        bgCanvas.moveTo(0, segmentPixelSize*i);
        bgCanvas.lineTo(docWidth, segmentPixelSize*i);
        bgCanvas.stroke();
        i++;
    }
    i = 0;
    while(i < totalSegmentsX) {
        bgCanvas.beginPath();
        bgCanvas.moveTo(segmentPixelSize*i, 0);
        bgCanvas.lineTo(segmentPixelSize*i, docHeight);
        bgCanvas.stroke();
        i++;
    }
    
    
}

function buildEmptyItemMap() {
    itemMap = new Array(totalSegmentsX, totalSegmentsY);
    for(var i=0; i <= totalSegmentsX; i++) {
        itemMap[i] = new Array;
        for(var x=0; x <= totalSegmentsY; x++) {
            itemMap[i][x] = new Array;    
        }
    }
}

function HandleMouseTracking(doTracking) {
    if (doTracking) {
        docBody.onmousemove = handleMouseMove;
        docBody.ontouchstart = function () {arguments[0].preventDefault();};
        docBody.ontouchmove = handleMouseMove;
        docBody.ontouchend = function () {};
    } else {
        //document.getElementsByTagName("body")[0].onmousemove = null;
    }
}

function handleMouseMove () {
    var evtData = arguments[0];
    var collInfo = null;
    var subObjList = new Array();
    if(evtData.touches) {
        mouseCir.offsetLeft = (evtData.touches[0].clientX-mouseCir.radius);
        mouseCir.offsetTop = (evtData.touches[0].clientY-mouseCir.radius);
        subObjList = subObjList.concat(findElemsAtSegmentCoords(evtData.touches[0].clientX, evtData.touches[0].clientY));
        /*
        if(evtData.touches[1]) {
            subObjList = subObjList.concat(findElemsAtSegmentCoords(evtData.touches[1].clientX, evtData.touches[1].clientY));
        }
        if(evtData.touches[2]) {
            subObjList = subObjList.concat(findElemsAtSegmentCoords(evtData.touches[2].clientX, evtData.touches[2].clientY));
        }
        */
        

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
            collInfo = checkCollision(mouseCir, control);
            if (collInfo.isColliding) {
                addActiveItem(control);
                if (scaleCircles) {
                    //var newDiam = (collInfo.distance / (control.offsetWidth) + 1);
                    var newDiam = ( ( radEnd / 11 ) * ( collInfo.distance / testRad ) + 1 );
                    control.style.transform = "scale(" + newDiam + "," + newDiam + ")";
                    control.style.msTransform = "scale(" + newDiam + "," + newDiam + ")";
                    control.style.MozTransform = "scale(" + newDiam + "," + newDiam + ")";
                    control.style.WebkitTransform = "scale(" + newDiam + "," + newDiam + ")";
                    control.isResized = true;
                }
                else {
                    control.style.backgroundColor = "#ff0000";//'#'+(Math.random()*0xFFFFFF<<0).toString(16);
                    //control.style.backgroundColor = '#000';
                }
            }
            else {
                removeActiveItem(control);
                if (scaleCircles) {
                    if (control.isResized) {
                        control.style.transform = "scale(1,1)";
                        control.style.msTransform = "scale(1,1)";
                        control.style.MozTransform = "scale(1,1)";
                        control.style.WebkitTransform = "scale(1,1)";
                        control.isResized = false;
                    }
                } else {
                    control.style.backgroundColor = '#ccc';    
                }
                
            }
            index++;
        }
    }

}

function findElemsAtSegmentCoords(mouseX, mouseY) {
    
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

function checkCollision(c1, c2) {
    var collDist = 5000;
    var isColliding = false;
    if (c1 && c2) {
        var dx = (c1.offsetLeft + c1.radius) - (c2.detectionCircleX + c2.detectionCircleRadius);
        var dy = (c1.offsetTop + c1.radius) - (c2.detectionCircleY + c2.detectionCircleRadius);
        var dist = c1.radius + c2.detectionCircleRadius;
        var delta1 = (dx * dx) + (dy * dy);
        var delta2 = dist * dist;
        collDist = ((delta1 - delta2) * -1) / 100;
        isColliding = delta1 <= delta2;
    }
 
    return ({'isColliding': isColliding, 'distance': collDist});
    
}

function createTestCircle(innerRadius, detectionRadius, x, y) {
    var totalRadius = innerRadius + detectionRadius;
    var innerCircle = document.createElement("div");

    innerCircle.className = "innerCircle";
    innerCircle.style.backgroundColor = "#ccc";//'#'+(Math.random()*0xFFFFFF<<0).toString(16);
    innerCircle.style.width = (innerRadius*2) + "px";
    innerCircle.style.height = (innerRadius*2) + "px";
    innerCircle.style.lineHeight = (innerRadius*2) + "px";
    innerCircle.style.borderRadius = ((innerRadius+1)*2) + "px";
    innerCircle.style.left = x + "px";
    innerCircle.style.top = y + "px";
    innerCircle.radius = innerRadius;
    innerCircle.isResized = false;
    innerCircle.detectionCircleX = x - detectionRadius;
    innerCircle.detectionCircleY = y - detectionRadius;
    innerCircle.detectionCircleRadius = totalRadius;
    
    containerDiv.appendChild(innerCircle);
    
    objectList.push(innerCircle);
    
    if(itemMap[Math.floor(x/segmentPixelSize)][Math.floor(y/segmentPixelSize)] == null) {
        itemMap[Math.floor(x/segmentPixelSize)][Math.floor(y/segmentPixelSize)] = new Array();
    }
    itemMap[Math.floor(x/segmentPixelSize)][Math.floor(y/segmentPixelSize)].push(innerCircle);
    
    return innerCircle;
}



