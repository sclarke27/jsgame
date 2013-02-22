platformGame.gCoreManager = null;

/**
 * main game manager
 */
platformGame.cCoreManager = function () {
    
    //managers
    this.mScreenManager = null;
    this.mCanvasManager = null;
    this.mCollisionManager = null;
    this.mEventManager = null;
    
    //debug panel
    this.mDebugPanel = null;
    this.mShowDebug = true;
    
    //html layers
    this.mMainBgDivObj = null;
    this.mGameLayerDivObj = null;
    this.mUILayerDivObj = null;
    
    //holders
    this.mRootDomObj = null;
    this.mDocWidth = 0;
    this.mDocHeight = 0;
    this.mActiveMap = null;
    this.mActiveMapIndex = -1;
    this.mActiveCharacters = [];
    
    //maps
    this.mMaps = ['maps2/testMap1.json', 'maps2/longMap1.json', 'maps2/testMap2.json', ]
    this.mMapList = new Array(this.mMaps.length);
    
    //misc game values
    this.mGameIsPaused = false;
    this.mIsTouchUI = null;
    this.mMoveDistance = 5;
    this.mEmptyPixel = null;

        
};

/**
 * main game init method
 */
platformGame.cCoreManager.prototype.Init = function () {
    this.mIsTouchUI = 'createTouch' in document;
    this.mRootDomObj = document.body; 
    this.mMainBgDivObj = document.getElementById('backgroundLayer');
    this.mGameLayerDivObj = document.getElementById('gameLayer');
    this.mUILayerDivObj = document.getElementById('uiLayer');
    
    this.mDocWidth = this.mRootDomObj.clientWidth;
    this.mDocHeight = this.mRootDomObj.clientHeight;
    
    this.mEventManager = new platformGame.cEventManger();
    
    var totalMaps = this.mMaps.length;
    var i=0;
    
    while(i < totalMaps) {
        this.mMapList[i] = new platformGame.cMapManager(this.mGameLayerDivObj);
        this.mMapList[i].LoadMap(this.mMaps[i]);
        i++;
    }
    
    if(this.mShowDebug) {
        this.mDebugPanel = new platformGame.cDebugPanel(this.mUILayerDivObj);
        this.mDebugPanel.Init();
    }
    
    if(this.mIsTouchUI) {
        document.getElementById('touchScreenLeftControls').style.display = "block";
        document.getElementById('touchScreenRightControls').style.display = "block";
    } else {
        this.ListenForEvents();
        //window.addEventListener('keydown', this.HandleKeyPress, false);    
    }
    
    
    window.webkitRequestAnimationFrame(this.OnFrameChange);
}

platformGame.cCoreManager.prototype.OnFrameChange = function () {
    var currTime = arguments[0]
    if (platformGame.gCoreManager.mActiveMapIndex >= 0) {
        //platformGame.gCoreManager.ShowMap(platformGame.gCoreManager.mActiveMapIndex);
    }
    
    if (platformGame.gCoreManager.mShowDebug) {
        platformGame.gCoreManager.mDebugPanel.OnFrameChange(currTime);
    }
    
    //animate any active characters    
    var totalActiveChars = platformGame.gCoreManager.mActiveCharacters.length
    if(totalActiveChars > 0) {
        platformGame.gCoreManager.mActiveMap.mLayerList[2].mLayerCanvas.ClearCanvas()
        var i = 0;
        while(i < totalActiveChars) {
            platformGame.gCoreManager.mActiveCharacters[i].Animate(currTime);
            i++
        }
    }
    
    if (!platformGame.gCoreManager.mGameIsPaused) {
        window.webkitRequestAnimationFrame(platformGame.gCoreManager.OnFrameChange);
    }
}

platformGame.cCoreManager.prototype.PauseGame = function () {
    if (this.mGameIsPaused) {
        this.mGameIsPaused = false;
        window.webkitRequestAnimationFrame(platformGame.gCoreManager.OnFrameChange);
    } else {
        this.mGameIsPaused = true;
    }
}

platformGame.cCoreManager.prototype.ShowMap = function (mapIndex) {
    if(this.mActiveMap) {
        this.mActiveMap.HideMap();
    }
    this.mActiveMapIndex = mapIndex
    this.mActiveMap = this.mMapList[this.mActiveMapIndex];
    for (var layer in this.mActiveMap.mLayerList) {
        this.mActiveMap.mLayerList[layer].BuildLayerCanvas(this.mGameLayerDivObj);
        var layerType = this.mActiveMap.mLayerList[layer].mLayerProps['layerType'] || null;
        if(layerType === "character") {
            var tempBird = new platformGame.cCharacter(platformGame.gCharacterList['brownBird']);
	        tempBird.SetCanvas(this.mActiveMap.mLayerList[layer].mLayerCanvas);      
            tempBird.SetPosition(100, 100);
            tempBird.Show();

            this.mActiveCharacters.push(tempBird);
            
            var tempBird2 = new platformGame.cCharacter(platformGame.gCharacterList['brownBird']);
	        tempBird2.SetCanvas(this.mActiveMap.mLayerList[layer].mLayerCanvas);      
            tempBird2.SetPosition(200, 200);
            tempBird2.Show();

            this.mActiveCharacters.push(tempBird2);

        }
    }
    //
}


platformGame.cCoreManager.prototype.ListenForEvents = function () {
    var thisObj = this;
    for(var type in platformGame.gEventTypes) {
        window.addEventListener(platformGame.gEventTypes[type], function(){
            thisObj.HandleEvent(arguments[0].type, arguments[0]);
        }, false);
    }
    
}

platformGame.cCoreManager.prototype.HandleEvent = function(type, event, data){
    switch(type) {
        case platformGame.gEventTypes.KEYDOWN:
            this.mEventManager.TriggerEvent(platformGame.gEventTypes.KEYDOWN, event.keyCode, event.target);
            break;
        case platformGame.gEventTypes.KEYUP:
            this.mEventManager.TriggerEvent(platformGame.gEventTypes.KEYUP, event.keyCode, event.target);
            break;
        case platformGame.gEventTypes.GAME:
            this.mEventManager.TriggerEvent(platformGame.gEventTypes.GAME, event, data);
            break;
        case platformGame.gEventTypes.SOCKET:
            this.mEventManager.TriggerEvent(platformGame.gEventTypes.SOCKET, event, data);
            break;
        default:
            this.mEventManager.TriggerEvent(type, event, event.target);
            break;
    }
}

//load global
platformGame.gCoreManager = new platformGame.cCoreManager();
