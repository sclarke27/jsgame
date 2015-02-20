"use strict"


gameUI.cRadialMenu = function () {
	this.mMenuItems = {};
	this.mDoMouseTracking = true;
}


gameUI.cRadialMenu.prototype.Init = function () {
	this.HandleMouseTracking(this.mDoMouseTracking);
}


gameUI.cRadialMenu.prototype.HandleMouseTracking = function(doTracking) {
	console.debug(doTracking)
	var docBody = document.getElementsByTagName("body")[0];
    if (doTracking) {
        docBody.onmousemove = this.HandleMouseMove;
        docBody.ontouchstart = function () {arguments[0].preventDefault();};
        docBody.ontouchmove = this.HandleMouseMove;
        docBody.ontouchend = function () {};
    } else {
        //document.getElementsByTagName("body")[0].onmousemove = null;
    }
}

gameUI.cRadialMenu.prototype.HandleMouseMove = function () {
	console.debug(arguments)
    var evtData = arguments[0];
    var collInfo = null;
    var subObjList = new Array();
        mouseCir.offsetLeft = (evtData.touches[0].clientX-mouseCir.radius);
        mouseCir.offsetTop = (evtData.touches[0].clientY-mouseCir.radius);
    if(evtData.touches) {
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
            collInfo = false;//checkCollision(mouseCir, control);
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

gameUI.gRadialMenu = new gameUI.cRadialMenu(); 
