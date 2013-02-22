platformGame.cMapManager = function () {
    this.mRawData = null;
    this.mRawLayers = new Array();
    this.mTotalLayers = 0;
    this.mRawTiles = new Array();
    this.mTileList = new Array();
    this.mTileWidth = 0;
    this.mTileHeight = 0;
    this.mMapWidth = 0;
    this.mMapHeight = 0;
    
    this.mLayerList = null;
    
}

platformGame.cMapManager.prototype.LoadMap = function (mapSrc) {
    var thisObj = this;
    var requestData = {
        "url" : mapSrc,
        "onSuccess" : function () {
            thisObj.ParseMapData(arguments[0].jsonContent);
        },
        "onStatus" : function () {
            //console.debug(arguments[0]);
        },
        "onError" : function () {
            console.debug('map not found');
        }
    };
    window.rpc.Request(requestData);    
}

platformGame.cMapManager.prototype.HideMap = function(){
    i = 0;
    while(i < this.mTotalLayers) {
        this.mLayerList[i].HideLayerCanvas();
        i++    
    }
    
}

platformGame.cMapManager.prototype.ParseMapData = function (jsonData) {
    this.mRawData = jsonData[0];
    this.mRawLayers = this.mRawData.layers;
    this.mTotalLayers = this.mRawLayers.length;
    this.mRawTiles = this.mRawData.tilesets;
    this.mMapWidth = this.mRawData.width;
    this.mMapHeight = this.mRawData.height;
    this.mTileWidth = this.mRawData.tilewidth;
    this.mTileHeight = this.mRawData.tileheight;
    this.mLayerList  = new Array(this.mRawLayers.length);
    

    //load tiles    
    /*
    this.mTileList[0] = new platformGame.cMapTile({
        name:"emptyTile",
        imgSrc: "maps2/transp-square.png",
        margin: 0,
        properties : {},
        tileproperties : {0:{coords:"0,0"}},
        transparentcolor: "#ffffff",
        tilewidth: 10,
        tileheight: 10,
        spacing: 0,
        offsetx: 0,
        offsety: 0,
        isvisible: true
    });
    */
    
    var i = 0;
    var x = 1;
    var tileLen = this.mRawTiles.length
    while(i<tileLen) {
        var currRawTile = this.mRawTiles[i];
        var totalTileProps = currRawTile.tileproperties.length;
        for(var prop in currRawTile.tileproperties) {
            offsets = currRawTile.tileproperties[prop].coords.split(',')
            currRawTile.offsetx = offsets[1];
            currRawTile.offsety = offsets[0];
            this.mTileList[x] = new platformGame.cMapTile(currRawTile);
            x++
        }
        i++;
    }
    
    //load layers    
    i = 0;
    while(i < this.mTotalLayers) {
        this.mLayerList[i] = new platformGame.cMapLayer(this.mRawLayers[i], this.mTileList, this.mTileWidth, this.mTileHeight);
        i++    
    }
    
}

platformGame.cMapManager.prototype.DisplayMap = function (targetCanvas) {
    
}

/**
 * object to handle individual map tiles
 * @param {Object} tileData
 * @param {Object} offsetX
 * @param {Object} offsetY
 */
platformGame.cMapTile = function (tileData, offsetX, offsetY) {
    this.mRawData = tileData;
    this.mImgSrc = this.mRawData.image;
    this.mImgMargin = this.mRawData.margin;
    this.mName = this.mRawData.name;
    this.mProperties = this.mRawData.properties;
    this.mSpacing = this.mRawData.spacing;
    this.mTileHeight = this.mRawData.tileheight;
    this.mTileWidth = this.mRawData.tilewidth;
    this.mTranspColor = this.mRawData.transparentclor;
    this.mOffsetX = this.mRawData.offsetx || 0;
    this.mOffsetY = this.mRawData.offsety || 0;
    this.isVisible = this.mRawData.isvisible || true;
	this.mImgObj = new Image();
    if (this.mImgSrc) {
        this.mImgObj.src = "maps2/" + this.mImgSrc;
    }
    this.mImgWidth = this.mImgObj.width || this.mTileWidth;
    this.mImgHeight = this.mImgObj.height || this.mTileHeight;
    
};

/**
 * object to handle individual map layers
 * @param {Object} layerData
 * @param {Object} tileList
 */
platformGame.cMapLayer = function (layerData, tileList, tileWidth, tileHeight) {
    this.mLayerRawData = layerData;
    this.mLayerData = this.mLayerRawData.data;
    this.mLayerName = this.mLayerRawData.name;
    this.mLayerProps = this.mLayerRawData.properties || {};
    this.mTotalTiles = this.mLayerData.length;
    this.mTileList = tileList;
    this.mOpacity = this.mLayerRawData.opacity;
    this.mLayerWidth = this.mLayerRawData.width;
    this.mLayerHeight = this.mLayerRawData.height;
    this.mLayerVisible = this.mLayerRawData.visible;
    this.mLayerType = this.mLayerRawData.type;
    this.mLayerTileWidth = tileWidth;
    this.mLayerTileHeight = tileHeight;
    this.mPosX = this.mLayerRawData.x;
    this.mPosY = this.mLayerRawData.y;
    this.mTileMap = new Array(this.mLayerWidth);
    this.mLayerCanvas = new platformGame.cCanvasManager();
    this.BuildEmptyTileMap();
}

platformGame.cMapLayer.prototype.BuildEmptyTileMap = function(){
    var i = 0;
    while(i < this.mLayerWidth) {
        this.mTileMap[i] = new Array(this.mLayerHeight);
        i++;
    }
    if (this.mLayerVisible) {
        this.LoadLayerMap();
    }
}

platformGame.cMapLayer.prototype.LoadLayerMap = function () {
    //console.debug('loading layer map data');
    var i = 0;
    var row = 0;
    var col = 0;
    while(i < this.mTotalTiles) {
        if (this.mLayerData[i] !== 0) {
            var currTile = this.mTileList[this.mLayerData[i]];
            this.mTileMap[col][row] = currTile;
        }
        col++;
        if(col >= this.mLayerWidth) {
            col = 0;
            row++;
        }
        i++;
    }
    this.mLayerCanvas.Init((this.mLayerWidth*this.mLayerTileWidth),(this.mLayerHeight*this.mLayerTileHeight));
    //console.debug(this.mTileMap)
}

platformGame.cMapLayer.prototype.BuildLayerCanvas = function(targetDomObj){
    var x = 0;
    var y = 0;
    var i = 0;
    this.mLayerCanvas.ClearCanvas();
    this.mLayerCanvas.Show(targetDomObj);
    while (x < this.mLayerWidth) {
        while( y < this.mLayerHeight){
            var currTile = this.mTileMap[x][y];
            this.mLayerCanvas.DrawImage(currTile, x*this.mLayerTileWidth, y*this.mLayerTileHeight);
            //this.mLayerCanvas.DrawImage(currTile, 0, 0);
            y++;
            i++;
        }
        y=0;
        x++;
    }
}

platformGame.cMapLayer.prototype.HideLayerCanvas = function(){
    this.mLayerCanvas.Hide();
}
