platformGame.Sprite = function (imgSrc, width, height, offsetX, offsetY, frames, duration) {
    this.mSpriteSheet = null;
    this.mOffsetX = 0;
    this.mOffsetY = 0;
    this.mWidth = width;
    this.mHeight = height;
    this.mFrames = 1;
    this.mCurrentFrame = 0;
    this.mDuration = 1;
    this.mPosX = 0;
    this.mPosY = 0;
    this.mMoveDirection = null;
    this.mMoveDistance = 0;
    this.mCanvas = null;
    this.mMirrorX = false;
    
    this.SetSpriteSheet(imgSrc)
    this.SetOffset(offsetX, offsetY);
    this.SetFrames(frames);
    this.SetDuration(duration);
    this.mFrameTime = 0;
	
    var date = new Date();
    
    if(this.mDuration > 0 && this.mFrames > 0) {
        this.mFrameTime = date.getTime() + (this.mDuration/this.mFrames);
    }
}

platformGame.Sprite.prototype.SetCanvas = function(canvas) {
    this.mCanvas = canvas;
}

platformGame.Sprite.prototype.MirrorX = function(doMirror) {
    this.mMirrorX = doMirror;
    if(this.mMirrorX) {
        this.mOffsetY = this.mHeight;
    } else {
        this.mOffsetY = 0;
    }
}

platformGame.Sprite.prototype.SetSpriteSheet = function(imgSrc) {
    if(imgSrc instanceof Image) {
        this.mSpriteSheet = imgSrc;
    } else {
        this.mSpriteSheet = new Image();
        this.mSpriteSheet.src = imgSrc;
    }
}

platformGame.Sprite.prototype.GetPosition = function(){
    return {x: this.mPosX, y: this.mPosY};
}

platformGame.Sprite.prototype.SetPosition = function(x, y) {
    this.mPosX = x;
    this.mPosY = y;
}

platformGame.Sprite.prototype.SetOffset = function(x, y) {
    this.mOffsetX = x;
    this.mOffsetY = y;
}

platformGame.Sprite.prototype.SetFrames = function(frameCount) {
    this.mCurrentFrame = 0;
    this.mFrames = frameCount;
}

platformGame.Sprite.prototype.SetDuration = function(duration){
    this.mDuration = duration;
}
    
platformGame.Sprite.prototype.Animate = function(time) {    
    if(time > this.mFrameTime) {
        this.NextFrame();
    }
    this.Draw();
}

platformGame.Sprite.prototype.NextFrame = function () {
    
    if(this.mDuration > 0) {
        var date = new Date();
        this.mFrameTime = 0;
        if(this.mDuration > 0 && this.mFrames > 0) {
            this.mFrameTime = date.getTime() + (this.mDuration / this.mFrames)
        }
    }
    
    this.mOffsetX = this.mWidth * this.mCurrentFrame;
    if (this.mCurrentFrame === (this.mFrames-1)) {
        this.mCurrentFrame = 0;
    } else {
        this.mCurrentFrame++;
    }
}

platformGame.Sprite.prototype.Draw = function () {
    
    this.mCanvas.mCanvasContext.drawImage(this.mSpriteSheet, 
                            this.mOffsetX,
                            this.mOffsetY,
                            this.mWidth,
                            this.mHeight,
                            this.mPosX,
                            this.mPosY,
                            this.mWidth,
                            this.mHeight
    )
}
