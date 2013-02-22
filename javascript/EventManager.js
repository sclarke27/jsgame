/**
 * EventManager.js - Class for handling the registering and triggering of page events.
 */

/**
 * constructor function
 */
platformGame.cEventManger = function () {
    this.mEvents = {};
    for (var type in platformGame.gEventTypes) {
        this.mEvents[platformGame.gEventTypes[type]] = [];
    }
};

/**
 * AddEventListener - function to register an event listener.<br> 
 * Examples:<br>
 * 			<i>platformGame.gEventManager.AddEventListener(platformGame.gEventTypes.HASHCHANGED, 'pageState', platformGame.gPageStateHandler.ProcessHash);</i>
 * 			
 * @param {Object} eventType - one of the platformGame.gEventTypes
 * @param {Object} eventUID - hex ID of the control triggering the event OR page name listening to the hash 
 * @param {Object} callback - function called when event is triggered
 */
platformGame.cEventManger.prototype.AddEventListener = function (eventType, eventUID, callback) {
    if(this.mEvents[eventType] !== undefined) {
		var targetControlEvt = this.mEvents[eventType]["'" + eventUID + "'"] || null;
		if (targetControlEvt !== null) {
			var functArr = new Array();
			for (var i = 0; i < targetControlEvt.length; i++) {
				if (callback === targetControlEvt[i]) {
					console.debug("event already exists");
					return;
				} else {
					var addEvent = true;
					for(var x=0; x<functArr.length; x++) {
						if(targetControlEvt[i] === functArr[x]) {
							addEvent=false;
						}
					}
					if (addEvent) {
						functArr.push(targetControlEvt[i])
					}
				}
			}
			functArr.push(callback);
			this.mEvents[eventType]["'" + eventUID + "'"] = functArr;
		} else {
			this.mEvents[eventType]["'" + eventUID + "'"] = [callback];
		}
    }
	//console.debug("on add")
	//this.DebugEventList();
}

/**
 * RemoveEventListener - function used to remove an event listener.<br>
 * Example: <i>platformGame.gEventManager.RemoveEventListener('click', platformGame.gGamePageIDs.mContinueTab);</i> 
 * @param {Object} eventType - one of the platformGame.gEventTypes
 * @param {Object} eventUID - hex ID of the control triggering the event OR page name listening to the hash 
 * @param {Object} callback - function that should be removed 
 */
platformGame.cEventManger.prototype.RemoveEventListener = function(eventType, eventUID, callback) {
	var tempEventList = [];
    if (this.mEvents[eventType] !== undefined) {
		for(var control in this.mEvents[eventType]) {
			if (callback === null || callback === undefined) {
				if ("'" + eventUID + "'" !== control && this.mEvents[eventType][control] !== undefined) {
					tempEventList[control] = this.mEvents[eventType][control]
				}
			} else {
				if ("'" + eventUID + "'" === control && this.mEvents[eventType][control] !== undefined) {
					var newArr = new Array();
					var currControlEvts = this.mEvents[eventType][control];
					var eventLen = currControlEvts.length;
					for(var i=0; i<eventLen; i++) {
						if(currControlEvts[i] !== callback) {
							newArr.push(currControlEvts[i]);
						}
					}
					this.mEvents[eventType][control] = newArr;
					
				}
				tempEventList[control] = this.mEvents[eventType][control];
			}
		}
        this.mEvents[eventType] = tempEventList;
    }
	tempEventList = null;
}

/**
 * TriggerEvent - function which is called to trigger an event
 * @param {Object} eventType
 * @param {Object} eventUID
 * @param {Object} targetControl
 */
platformGame.cEventManger.prototype.TriggerEvent = function (eventType, eventUID, targetControl) {
	//console.debug("EVENT!: " + eventType + " for " + eventUID);
    if(this.mEvents[eventType] !== undefined) {
		if (eventType === platformGame.gEventTypes.HASHCHANGED) {
			var eventsList = this.mEvents[eventType];

			for(var eventName in eventsList) {
				var event = eventsList[eventName];
				if (typeof event === "function") {
					event(targetControl);
				}
				if (typeof event === "array") {
					var totalEvents = event.length
					for(i=0; i<totalEvents; i++) {
						event[i](targetControl);	
					}
				}
			}
		} else {
			var newEvent = this.mEvents[eventType]["'" + eventUID + "'"] || null;
			if (newEvent !== null) {
				//console.debug(typeof this.mEvents[eventType]["'" + eventUID + "'"])
				if (typeof newEvent === "function") {
					newEvent(targetControl);
					return;
				}
				if (typeof newEvent === "object") {
					//console.debug(newEvent)
					var totalEvents = newEvent.length
                    var i=0; 
					while (i < totalEvents) {
						var currevnt = newEvent[i]; 
						//console.debug(currevnt);
						currevnt(targetControl);
                        i++
					}
				}
			}
		}
    }
}

/**
 * debug function to show the events array to the console
 */
platformGame.cEventManger.prototype.DebugEventList = function () {
    console.debug(this.mEvents);
	//if(typeof Panel == "object") {
	//	Panel.mStateController.DebugMsg(this.mEvents);
	//}
};

/**
 * enum of possible event types
 */
platformGame.gEventTypes = {
	CLICK : "click",
	MOUSEOVER: "mouseover",
	MOUSEOUT: "mouseout",
	MOUSEMOVE: "mousemove",
	DATACHANGED: "datachanged",
	HASHCHANGED: "hashchanged",
    KEYDOWN: "keydown",
    KEYUP: "keyup",
    GAME: "gameevent",
    SOCKET: "socketevent"
}

