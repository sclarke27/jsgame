/////////////////////////////////////////////////////////////////////////////////////
// CircleBudget.js
//
// Copyright 2012 Electronic Arts Inc. All Rights Reserved.
/////////////////////////////////////////////////////////////////////////////////////

"use strict";
goog.provide('simcity.CircleBudget');

simcity.CircleBudget = function (props) {
	this.mDatabinding = simcity.kGlobalUIBudgetInfo;
    this.mTargetDivID = props.targetDivID || null;
    this.mCanvasWidth = props.canvasWidth || 375;
    this.mCanvasHeight = props.canvasHeight || this.mCanvasWidth;
    this.mCanvasPadding = 30;
    this.mWorkAreaWidth = this.mCanvasWidth - this.mCanvasPadding;
    this.mIncomePercent = props.startingValue || 27;
    this.mStrokeWidth = this.mWorkAreaWidth*.23;
    this.mPadding = this.mWorkAreaWidth*.0175;
    this.mRingGap = (this.mCanvasWidth*.0008) || .2;
    this.mTopCenter = (this.mWorkAreaWidth+this.mCanvasPadding)/2;
    this.mLeftCenter = (this.mWorkAreaWidth+this.mCanvasPadding)/2;
    this.mOutsideRadius = (this.mWorkAreaWidth*.93)/2-this.mPadding;//this.mTopCenter-(this.mStrokeWidth/2)-this.mPadding;
    this.mInsideArcHeight = this.mStrokeWidth*.315;
    this.mRing2RadiusStart = this.mOutsideRadius - (this.mOutsideRadius*.04) - (this.mInsideArcHeight);
    this.mRing2RadiusEnd = this.mRing2RadiusStart + (this.mCanvasWidth*.0475);
    this.mRing3RadiusStart = this.mRing2RadiusEnd + (this.mRingGap * 4);
    this.mRing3RadiusEnd = this.mRing3RadiusStart + (this.mCanvasWidth * .0475);
    this.mOffsetTop = props.offsetTop || 0;
    this.mOffsetLeft = props.offsetLeft || 0;
    this.mIsMouseOverIncome = false;
    this.mIsMouseOverExpense = false;
    this.mInnerRingActive = false;
	
    //svg elems 
    this.mSvgCanvas = null;
    this.mExpendRing = null
    this.mIncomeRing = null;
    this.mHoverArcs = [];
    this.mHoverArcsShadows = [];
    this.mSubRingMouseArcs = []
    this.mThirdRingArcs = [];
    this.mThirdRingArcsShadows = [];
    this.mThirdRingMouseArcs = [];
    this.mIcons = [];
    this.mLayerSets = [];
    this.mActiveMouseElems = [];
	
    //labels
    this.mLgPercentLabel = null;
    this.mItemTypeLabel = null;
	this.mItemValueLabel = null
	this.mPerHourLabel = null;
	this.mPercentLabel = null;
		
	//scrui elems
	this.mBudgetContainer = null;
	this.mDataMouseoverLabel = null;
	
	//deprish these
    this.mDataLabelText = null;
    this.mDataColorCircle = null;
    this.mMouseEventRect = null

    //perf settings 
    this.mUseAltMousePick = false;
    this.mDebugMouseEvents = false;
    this.mMainRingClickable = true;
    this.mSecondRingClickable = true;
    this.mEaseTime = 200;
    this.mEasing = "easeOut";
    
    // model of the budget data   
	this.mBudgetData = this.mDatabinding.budgetData; 

    //page layout listing	
    this.mPageLayouts = {
        MOUSE_OVER_LABEL : "Layouts/GlobaUI/BudgetMouseoverLabel.js",
        MOUSE_OVER_LABEL_ALT : "Layouts/GlobaUI/BudgetMouseoverLabelAlt.js",
		BUDGET_LABELS : "Layouts/GlobaUI/BudgetLabels.js"
    };

    //control ID listing
	this.mControlIDs = {
		UI_CONTAINER: 0x0ae8f642,
		ROOT_LAYOUT: 0x0d9d00ad,
		ROOT_WINDOW: 0x0d9d07a9,
		ICON_BG: 0x0d9d03dd,
		ICON_HOLDER: 0x0d9d0409,
		LABEL_HOLDER: 0x0d9d07f8,
		LABEL_TEXT: 0x0d9d03ce
	};
	this.mTextLabels = {};
    
};

simcity.CircleBudget.prototype.GetLabelText = function (table, labelID, labelAlt) {
	var label = new scrui.cLocaleString(table, labelID, labelAlt);
	label.LoadString(function() {});
	return label.GetText();
};

simcity.CircleBudget.prototype.Init = function() {
    if (this.mTargetDivID !== null) {
        var thisObj = this;

	    this.mTextLabels = {
		   "roads" : "Transportation",
		   "power" : "Power",
		   "water" : "Water",
		   "police" : "Police",
		   "ordinace" : "Ordinance",
		   "manufacture" : "Manufacturing",
		   "extraction" : "Extraction",
		   "import" : "Trading",
		   "health" : "Health",
		   "garbage" : "Garbage",
		   "fire" : "Fire",
		   "education" : "Education",
		   "parks" : "Parks",
		   "government" : "Government",
		   "other" : "Other",
		   "totalExp" : "Total Expenses",
		   "totalInc" : "Total Income",
		   "res" : "Residential",
		   "comm" : "Commercial",
		   "indust" : "Industrial",
		   "resw1" : "Low Wealth",
		   "resw2" : "Medium Wealth",
		   "resw3" : "High Wealth",
		   "commw1" : "Low Wealth",
		   "commw2" : "Mid Wealth",
		   "commw3" : "High Wealth",
		   "industw1" : "Dirty",
		   "industw2" : "Manufacturing",
		   "industw3" : "High Tech",
           "trading" : "Trading",
		   "sewage" : "Sewage"
	    }
	    
		
        for(var layout in this.mPageLayouts) {
            gUIManager.CacheLayout(this.mPageLayouts[layout]);
        }
		this.mBudgetContainer = gUIManager.FindControlByID(this.mControlIDs.UI_CONTAINER);

        this.mSvgCanvas = Raphael(this.mTargetDivID, "100%", "100%");
        this.mSvgCanvas.customAttributes.simpleArc = simcity.gSVGRingsUtils.SimpleArc;
        this.mSvgCanvas.customAttributes.radArc = simcity.gSVGRingsUtils.RadArc;
        this.mSvgCanvas.customAttributes.hideArc = simcity.gSVGRingsUtils.HideArc;

        this.mRootTopOffset = 0;
        this.mRootLeftOffset = 0;

        this.AppendTransforms();
        
        var iconSize = this.mInsideArcHeight;
        this.mIcons['comm'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-comm.png", -100, -100, iconSize, iconSize);
        this.mIcons['exports'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-export.png", -100, -100, iconSize, iconSize);
        this.mIcons['education'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-education.png", -100, -100, iconSize, iconSize);
        this.mIcons['power'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-electric.png", -100, -100, iconSize, iconSize);
        this.mIcons['res'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-res.png", -100, -100, iconSize, iconSize);
        this.mIcons['fire'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-fire_department.png", -100, -100, iconSize, iconSize);
        this.mIcons['imports'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-export.png", -100, -100, iconSize, iconSize);
        this.mIcons['indust'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-indust.png", -100, -100, iconSize, iconSize);
        this.mIcons['roads'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-roads.png", -100, -100, iconSize, iconSize);
        this.mIcons['trading'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-roads.png", -100, -100, iconSize, iconSize);

        this.mIcons['ordinances'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-government.png", -100, -100, iconSize, iconSize);
        this.mIcons['government'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-government.png", -100, -100, iconSize, iconSize);
        this.mIcons['health'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-healthcare.png", -100, -100, iconSize, iconSize);
        this.mIcons['police'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-law_enforcement.png", -100, -100, iconSize, iconSize);
        this.mIcons['globalMarketInc'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-roads.png", -100, -100, iconSize, iconSize);
		this.mIcons['globalMarketExp'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-roads.png", -100, -100, iconSize, iconSize);
        this.mIcons['water'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-water.png", -100, -100, iconSize, iconSize);

        this.mIcons['sewage'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-sewage.png", -100, -100, iconSize, iconSize);
        this.mIcons['garbage'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-trash_collection.png", -100, -100, iconSize, iconSize);
        this.mIcons['water'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-water.png", -100, -100, iconSize, iconSize);

        this.mIcons['trading'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-big_business.png", -100, -100, iconSize, iconSize);
        this.mIcons['manufacture'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-big_business.png", -100, -100, iconSize, iconSize);
        this.mIcons['extraction'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-big_business.png", -100, -100, iconSize, iconSize);
        this.mIcons['park'] = this.mSvgCanvas.image("resource/Graphics/HUD/HUD_icon-big_business.png", -100, -100, iconSize, iconSize);


        var bgDropShadow = this.mSvgCanvas.circle(this.mTopCenter, this.mTopCenter, (this.mWorkAreaWidth*.93)/2);
        bgDropShadow.attr(simcity.CircleBudget.kDropShadow(this.mWorkAreaWidth));
        bgDropShadow.node.setAttribute("filter","url(#lgBlur)");

        var bgCircle = this.mSvgCanvas.circle(this.mTopCenter, this.mTopCenter, (this.mWorkAreaWidth*.93)/2);
        bgCircle.attr(simcity.CircleBudget.kGreyCircle(this.mWorkAreaWidth));

        this.mIncomeRing = this.mSvgCanvas.path();
        this.mIncomeRing.attr(simcity.CircleBudget.kIncomeRingStyle(this.mWorkAreaWidth));
        this.mIncomeRing.attr({radArc: [100, 0, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius, this.mStrokeWidth]});

        this.mExpendRing = this.mSvgCanvas.path()
        this.mExpendRing.attr(simcity.CircleBudget.kExpRingStyle(this.mWorkAreaWidth));
        this.mExpendRing.attr({radArc: [1, 0, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius, this.mStrokeWidth]});
        
        if (this.mUseAltMousePick) {
        
            this.mIncomeRingHoverOver = this.mSvgCanvas.path();
            this.mIncomeRingHoverOver.attr(simcity.CircleBudget.kHiddenRingStyle(this.mDebugMouseEvents));
            this.mIncomeRingHoverOver.attr({
                radArc: [100, 0, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius, this.mStrokeWidth]
            });
            this.mIncomeRingHoverOver.data("mouseover", function() {
                thisObj.IncomeRingHover(true, thisObj.mIncomeRing);
            });
            this.mIncomeRingHoverOver.data("mouseout", function() {
            });
            
            this.mIncomeRingHoverOut = this.mSvgCanvas.path();
            this.mIncomeRingHoverOut.attr(simcity.CircleBudget.kHiddenRingStyle(this.mDebugMouseEvents));
            this.mIncomeRingHoverOut.attr({
                radArc: [100, 0, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius + 7, this.mStrokeWidth + 7]
            });
            this.mIncomeRingHoverOut.data("mouseover", function() {
            });
            this.mIncomeRingHoverOut.data("mouseout", function() {
                thisObj.IncomeRingHover(false, thisObj.mIncomeRing);
            });
            
            this.mExpendRingHoverOver = this.mSvgCanvas.path()
            this.mExpendRingHoverOver.attr(simcity.CircleBudget.kHiddenRingStyle(this.mDebugMouseEvents));
            this.mExpendRingHoverOver.attr({
                radArc: [1, 0, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius + 7, this.mStrokeWidth + 7]
            });
            this.mExpendRingHoverOver.data("mouseover", function() {
                thisObj.ExpRingHover(true, thisObj.mExpendRing);
            });
            this.mExpendRingHoverOver.data("mouseout", function() {
            });
            
            this.mExpendRingHoverOut = this.mSvgCanvas.path()
            this.mExpendRingHoverOut.attr(simcity.CircleBudget.kHiddenRingStyle(this.mDebugMouseEvents));
            this.mExpendRingHoverOut.attr({
                radArc: [1, 0, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius + 7, this.mStrokeWidth + 7]
            });
            this.mExpendRingHoverOut.data("mouseover", function() {
            });
            this.mExpendRingHoverOut.data("mouseout", function() {
                thisObj.ExpRingHover(false, thisObj.mExpendRing);
            });
            
        } else {
            this.mIncomeRingActive = false;
            this.mExpendRingActive = false;
            
            this.mIncomeRingHover = this.mSvgCanvas.path();
            this.mIncomeRingHover.attr(simcity.CircleBudget.kHiddenRingStyle(this.mDebugMouseEvents));
            this.mIncomeRingHover.attr({
                radArc: [100, 0, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius, this.mStrokeWidth]
            });
			var thisObj = this;
            if (this.mMainRingClickable) {
                this.mIncomeRingHover.mouseover(function() {
                    thisObj.mItemTypeLabel[0].textContent = "Income";
                    thisObj.mItemValueLabel[0].textContent = "$" + thisObj.mBudgetData.totals.income;
                    thisObj.mPerHourLabel[0].textContent = "per hour";
                    var currPercent = Math.round((thisObj.mBudgetData.totals.income/thisObj.mBudgetData.totals.budget)*100);
                    thisObj.mPercentLabel[0].textContent = currPercent + "% of total budget";
					
                    thisObj.mIncomeRing.animate({fill:"#41ec1f"}, thisObj.mEaseTime, thisObj.mEasing)
                });
                this.mIncomeRingHover.mouseout(function() {
                    thisObj.mIncomeRing.animate({fill:"#27c708"}, thisObj.mEaseTime, thisObj.mEasing)
                });
                this.mIncomeRingHover.click(function() {
					
                    this.mIncomeRingActive = (!this.mIncomeRingActive) ? true : false;
			        for(var arc in thisObj.mSubRingMouseArcs) {
						if (this.mIncomeRingActive) {
							thisObj.mSubRingMouseArcs[arc].toFront();
						} else {
							thisObj.mSubRingMouseArcs[arc].toBack();
						}
			        } 					
                    thisObj.IncomeRingHover(this.mIncomeRingActive, thisObj.mIncomeRing);
                });
            } else {
                this.mIncomeRingHover.mouseover(function() {
                    thisObj.IncomeRingHover(true, thisObj.mIncomeRing);
                });
                this.mIncomeRingHover.mouseout(function() {
                    thisObj.IncomeRingHover(false, thisObj.mIncomeRing);
                });
            }
            
            this.mExpendRingHover = this.mSvgCanvas.path()
            this.mExpendRingHover.attr(simcity.CircleBudget.kHiddenRingStyle(this.mDebugMouseEvents));
            this.mExpendRingHover.attr({
                radArc: [1, 0, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius, this.mStrokeWidth]
            });
            if(this.mMainRingClickable) {
                this.mExpendRingHover.mouseover(function() {
                    thisObj.mItemTypeLabel[0].textContent = "Expenses";
                    thisObj.mItemValueLabel[0].textContent = "$" + thisObj.mBudgetData.totals.expenses;
                    thisObj.mPerHourLabel[0].textContent = "per hour";
                    var currPercent = Math.round((thisObj.mBudgetData.totals.expenses/thisObj.mBudgetData.totals.budget)*100);
                    thisObj.mPercentLabel[0].textContent = currPercent + "% of total budget";
                    thisObj.mExpendRing.animate({fill:"rgb(217,33,33)"}, thisObj.mEaseTime, thisObj.mEasing)
                });
                this.mExpendRingHover.mouseout(function() {
                    thisObj.mExpendRing.animate({fill:"rgb(185,54,54)"}, thisObj.mEaseTime, thisObj.mEasing)
                });
                this.mExpendRingHover.click(function() {
					this.mExpendRingActive = (!this.mExpendRingActive) ? true : false;
                    for(var arc in thisObj.mSubRingMouseArcs) {
                        if (this.mExpendRingActive) {
                            thisObj.mSubRingMouseArcs[arc].toFront();
                        } else {
                            thisObj.mSubRingMouseArcs[arc].toBack();
                        }
                    }                   
                    
                    thisObj.ExpRingHover(this.mExpendRingActive, thisObj.mExpendRing);
                });
            } else {
                this.mExpendRingHover.mouseover(function() {
                    thisObj.ExpRingHover(true, thisObj.mExpendRing);
                });
                this.mExpendRingHover.mouseout(function() {
                    thisObj.ExpRingHover(false, thisObj.mExpendRing);
                });
            }
            
        }
        
        var coverCircleShadow = this.mSvgCanvas.circle(this.mTopCenter, this.mTopCenter, (this.mWorkAreaWidth*.5)/2);
        coverCircleShadow.attr(simcity.CircleBudget.kDropShadow(this.mWorkAreaWidth));
        coverCircleShadow.attr({opacity: .5})
        coverCircleShadow.node.setAttribute("filter","url(#lgBlur)");

        var coverCircle2 = this.mSvgCanvas.circle(this.mTopCenter, this.mTopCenter, (this.mWorkAreaWidth*.455)/2);
        coverCircle2.attr(simcity.CircleBudget.kWhiteCircle(this.mWorkAreaWidth));

        
        var yStart = this.mCanvasHeight/2.5;
		var xStart = this.mCanvasHeight/2;

	    this.mItemTypeLabel = this.mSvgCanvas.text(xStart, yStart, " ").attr(simcity.CircleBudget.kLabelNormalFontStyle(this.mWorkAreaWidth));
		yStart = yStart+40;
	    this.mItemValueLabel = this.mSvgCanvas.text(xStart, yStart, " ").attr(simcity.CircleBudget.kLgGreenFontStyle(this.mWorkAreaWidth))
        yStart = yStart+20;
	    this.mPerHourLabel = this.mSvgCanvas.text(xStart, yStart, " ").attr(simcity.CircleBudget.kLabelNormalFontStyle(this.mWorkAreaWidth)).attr({fill: "#27c708"});
        yStart = yStart+35;
	    this.mPercentLabel = this.mSvgCanvas.text(xStart, yStart, " ").attr(simcity.CircleBudget.kLabelNormalFontStyle(this.mWorkAreaWidth));

        this.TotalBudget();
        this.DrawSecondLevelRing("income");
        this.DrawSecondLevelRing("expense");
        
        for(var icon in this.mIcons) {
            this.mIcons[icon].toFront();
        }       
        
        if (this.mUseAltMousePick) {
            this.mIncomeRingHoverOver.toFront();
            this.mIncomeRingHoverOut.toFront();
            this.mExpendRingHoverOver.toFront();
            this.mExpendRingHoverOut.toFront();
        } else {
            this.mIncomeRingHover.toFront();
            this.mExpendRingHover.toFront();
        }
        
        if(this.mUseAltMousePick) {
            var thisObj = this;
            this.mMouseEventRect = this.mSvgCanvas.rect(0, 0, this.mCanvasWidth, this.mCanvasHeight);
            this.mMouseEventRect.attr("fill", "rgba(255,0,0,0)")
            this.mMouseEventRect.mousemove(function() {
                thisObj.HandleMouseEvents(arguments[1], arguments[2], "mouseover")
            });
        }

    }
}

simcity.CircleBudget.prototype.GetMouseRadFromCenter = function(mouseX, mouseY, mouseState) {
    this.mRootTopOffset = this.mSvgCanvas.canvas.offsetParent.offsetTop || 0;
    this.mRootLeftOffset = this.mSvgCanvas.canvas.offsetParent.offsetLeft || 0;
    var thisObj = this;

    var tx = (this.mCanvasWidth/2) - (mouseX-this.mRootLeftOffset);
    var ty = (this.mCanvasWidth/2) - (mouseY-this.mRootTopOffset);
    tx = (tx < 0)? (tx*-1) : tx;
    ty = (ty < 0)? (ty*-1) : ty;
    var rad = Math.sqrt((tx*2)+(ty*2));
    rad = (isNaN(rad)) ? 0 : rad;
    console.debug(rad);
    return rad;
}

simcity.CircleBudget.prototype.HandleMouseEvents = function (mouseX, mouseY, mouseState) {
    this.mRootTopOffset = this.mSvgCanvas.canvas.offsetParent.offsetTop || 0;
    this.mRootLeftOffset = this.mSvgCanvas.canvas.offsetParent.offsetLeft || 0;
    var thisObj = this;
    
    //console.debug((mouseX-this.mRootLeftOffset) + "x" + (mouseY-this.mRootTopOffset));
    
    var newMouseEvtElems = [];
    var elemSet = thisObj.mSvgCanvas.getElementsByPoint(mouseX-thisObj.mRootLeftOffset,mouseY-thisObj.mRootTopOffset);
    var totalElems = elemSet.length;
    var tempElemArr = [];
    
    //collect list of elements under the cursor which have mouse events
    for (var i=0; i<totalElems; i++) {
        if (elemSet[i] !== this.mMouseEventRect) {
            var mouseEvent = elemSet[i].data(mouseState) || null;
            if(mouseEvent !== null) {
                newMouseEvtElems.push(elemSet[i])
            }
        }
    }
    //trigger mouse out events and remove from active mouse events array
    for(var activeElem in this.mActiveMouseElems) {
        var elemStillActive = false;
        
        if (newMouseEvtElems.length > 0) {
            //check to see if curr element is active by looking for it in the new element list
            for (var newElem in newMouseEvtElems) {
                if (this.mActiveMouseElems[activeElem].id == newMouseEvtElems[newElem].id) {
                    elemStillActive = true;
                }
            }
        }
        
        //if not active, fire mouse out events
        if(!elemStillActive) {
            var funct = this.mActiveMouseElems[activeElem].data("mouseout");
            funct(false, this.mActiveMouseElems);
        } 
    }

    //trigger mouse over events for new elements
    for (var newElem in newMouseEvtElems) {
        var elemFound = false;
        if (this.mActiveMouseElems.length > 0) {
            for (var activeElem in this.mActiveMouseElems) {
                if (this.mActiveMouseElems[activeElem] == newMouseEvtElems[newElem]) {
                    elemFound = false;
                }
            }
        }
        if(!elemFound) {
            var funct = newMouseEvtElems[newElem].data("mouseover");
            funct(newMouseEvtElems[newElem]);
            this.mActiveMouseElems.push(newMouseEvtElems[newElem])
        }
    }
    this.mActiveMouseElems = newMouseEvtElems;
    //console.debug(this.mActiveMouseElems)

}

simcity.CircleBudget.prototype.DrawSecondLevelRing = function (ringType) {

    var thisObj = this;
    var arcList = {
        res : this.mBudgetData.totals.res,
        comm : this.mBudgetData.totals.comm,
        indust : this.mBudgetData.totals.indust,
        trading : this.mBudgetData.income.trading,
		globalMarketInc: this.mBudgetData.income.globalMarketInc
    }    
    var currDataSet = (ringType == "income") ? arcList : this.mBudgetData.expenses;
    var startPercent = this.mRingGap;
    var itemCount = 0;
    var iterator = 0;
    var easing = "<>";
    var easeTime = 300;
    var layers = {
            shadow: {
                holder: this.mHoverArcsShadows,
                style: simcity.CircleBudget.kDropShadow(this.mWorkAreaWidth),
                filter: "url(#smBlur)",
                opacity: .5
            },
            visible: {
                holder: this.mHoverArcs,
                style: (ringType == "income") ? simcity.CircleBudget.kGreenSubRingStyle(this.mWorkAreaWidth) : simcity.CircleBudget.kRedSubRingStyle(this.mWorkAreaWidth),
                opacity: 1
            },
            mouseEvt: {
                holder: this.mSubRingMouseArcs,
                hasIcon:true,
                style: simcity.CircleBudget.kHiddenRingStyle(this.mDebugMouseEvents),
                opacity: 1,
                noAnim: true,
                click: function (arcObj) {
                    var subData = arcObj.data("subData") || null;
                    if(ringType == "income" && subData !== null && thisObj.mSecondRingClickable && (thisObj.mIsMouseOverExpense || thisObj.mIsMouseOverIncome)) {
                        thisObj.DrawThirdRing(subData, arcObj.data("startPercent"), arcObj.data("normalColor"), arcObj.data("hoverColor"), arcObj.data("budgetType"));
                    }
                },
                mouseOver: function (arcObj) {
                    var subData = arcObj.data("subData") || null;
                    var center = arcObj.data("centerPoint");
				    var label = thisObj.mTextLabels[arcObj.data("budgetType")] || arcObj.data("budgetType");
				    //thisObj.mLgPercentLabel = null;
				    thisObj.mItemTypeLabel[0].textContent = label;
				    thisObj.mItemValueLabel[0].textContent = "$" + (Math.round(arcObj.data("budgetValue")));
				    thisObj.mPerHourLabel[0].textContent = "per hour";
					var currPercent = Math.round((arcObj.data("budgetValue")/thisObj.mBudgetData.totals.budget)*100);
				    thisObj.mPercentLabel[0].textContent = currPercent + "% of total budget";
                    if(ringType == "income" && subData !== null && !thisObj.mSecondRingClickable && (thisObj.mIsMouseOverExpense || thisObj.mIsMouseOverIncome)) {
                        thisObj.DrawThirdRing(subData, arcObj.data("startPercent"), arcObj.data("hoverColor"));
                    }
                    if (thisObj.mIsMouseOverExpense || thisObj.mIsMouseOverIncome) {
                        thisObj.ShowLabel("$" + (Math.round(arcObj.data("budgetValue"))), arcObj.data("icon"), arcObj.data("hoverColor"), center.x, center.y);
                    }
                },
                mouseOut: function (arcObj) {
                    thisObj.HideLabel();
                }
            }
        }
    

    for (var lineItem in currDataSet) {
        var currItemVal = currDataSet[lineItem];
        var currPerc = (currItemVal / this.mBudgetData.totals.budget)*100;
        if (currPerc >= 1) {
			itemCount++
		}
	};
    //currDataSet["otherExp"] = 0;
    
    for (var layer in layers) {
        startPercent = this.mRingGap;
        iterator = 0;
        var currPercent = 0;
        // draw visibile layers
        for (var lineItem in currDataSet) {
            var currItemVal = currDataSet[lineItem];
			var currPerc = (currItemVal / this.mBudgetData.totals.budget)*100;
            var currLayer = layers[layer] || null;
            var currArc = currLayer.holder[lineItem] || null;

			if (currPerc >= 1) {
				
				if (ringType == "income") {
					currPercent = startPercent + ((currItemVal / this.mBudgetData.totals.budget) * 100);
				} else {
					currPercent = startPercent - ((currItemVal / this.mBudgetData.totals.budget) * 100);
				}
				//console.debug(currPercent);
				var isNew = false;
				
				if (currArc == null) {
					currLayer.holder[lineItem] = this.mSvgCanvas.path();
					currLayer.holder[lineItem].attr(currLayer.style);
					if (currLayer.filter) {
						currLayer.holder[lineItem].node.setAttribute("filter", currLayer.filter);
					}
					if (this.mIcons[lineItem] && currLayer.hasIcon) {
						currLayer.holder[lineItem].data("icon", this.mIcons[lineItem]);
					}
					currArc = currLayer.holder[lineItem];
					
					if (currLayer.mouseOver) {
						currArc.mouseover(function() {
							currLayer.mouseOver(this);
						});
					}
					if (currLayer.mouseOut) {
						currArc.mouseout(function() {
							currLayer.mouseOut(this);
						});
					}
					if (currLayer.click) {
						currArc.click(function() {
							currLayer.click(this);
						});
					}
					
					isNew = true
				} else {
					currArc.attr({hideArc: false})
				}
				var subData = null;
				switch (lineItem) {
					case "res":
						currLayer.holder[lineItem].data("subData", this.mBudgetData.income.res);
						subData = this.mBudgetData.income.res
						break;
					case "comm":
						currLayer.holder[lineItem].data("subData", this.mBudgetData.income.comm);
						subData = this.mBudgetData.income.comm
						break;
					case "indust":
						currLayer.holder[lineItem].data("subData", this.mBudgetData.income.indust);
						subData = this.mBudgetData.income.indust
						break;
						
				}
				iterator++;
				
				if ((ringType == "income")) {
					var padding = (iterator === itemCount) ? (this.mRingGap * 2) : this.mRingGap;
					var arcStart = startPercent;
					var arcEnd = (currPercent - padding);
				} else {
					var padding = (iterator === 1) ? (this.mRingGap * 2) : this.mRingGap;
					var arcStart = currPercent;
					var arcEnd = (startPercent - padding)
				}
				currArc.data("startPercent", arcStart);
				currArc.data("endPercent", arcEnd);
				currArc.data("hoverColor", (simcity.CircleBudget.kHoverColors[lineItem]) ? simcity.CircleBudget.kHoverColors[lineItem] : simcity.CircleBudget.kHoverColors["other"]);
				currArc.data("normalColor", currArc.attr("fill"));
				currArc.data("budgetValue", currItemVal);
				currArc.data("budgetType", lineItem);
				var textWidth = 0;
				var textHieght = 0;
				var newRadius = this.mRing2RadiusStart + (this.mInsideArcHeight * 3);
				var alpha5 = 360 / 100 * ((arcStart + arcEnd) / 2);
				var a5 = (90 - alpha5) * Math.PI / 180; // 
				var x5 = (this.mTopCenter + newRadius * Math.cos(a5)) - (textWidth / 2);
				var y5 = (this.mLeftCenter - newRadius * Math.sin(a5)) - (textHieght / 2);
				var ringPad = currLayer.ringPadding || 0;
				if (!currArc.data("radius")) {
					currArc.data("radius", this.mRing2RadiusStart + ringPad)
				} else {
					this.mRing2RadiusStart = currArc.data("radius");
				}
				
				currArc.data("centerPoint", {
					x: x5,
					y: y5
				})
				
				if (isNew || currLayer.noAnim) {
					currArc.attr({
						hideArc: false,
						opacity: currLayer.opacity,
						simpleArc: [arcStart, arcEnd, 100, this.mTopCenter, this.mLeftCenter, this.mRing2RadiusStart + ringPad, this.mInsideArcHeight]
					});
				} else {
					currArc.animate({
						hideArc: false,
						simpleArc: [arcStart, arcEnd, 100, this.mTopCenter, this.mLeftCenter, this.mRing2RadiusStart + ringPad, this.mInsideArcHeight]
					}, thisObj.mEaseTime, thisObj.mEasing);
				}
				
				startPercent = (isNaN(currPercent)) ? startPercent : currPercent;
			} else {
				if (currArc !== null) {
					currArc.attr({hideArc: true})
				}
			}
        }
    }
    startPercent = currPercent =0;

};

simcity.CircleBudget.prototype.DrawThirdRing = function (subRingData, startPer, ringColor, hoverColor, budgetType) {
    //console.debug(subRingData + " start:" + startPer);
    
    var thisObj = this;
    var itemCount = 0;
    var iterator = 0;
    var easing = "<>";
    var easeTime = 300;
    var currDataSet = subRingData;
    var ringType = "income";
    var startPercent = startPer;
    var layers = {
            shadow: {
                holder: this.mThirdRingArcsShadows,
                style: simcity.CircleBudget.kDropShadow(this.mWorkAreaWidth),
                filter: "url(#smBlur)",
                opacity: .5
            },
            visible: {
                holder: this.mThirdRingArcs,
                hasIcon:true,
                style: simcity.CircleBudget.kGreenSubRingStyle(this.mWorkAreaWidth),
                fill: ringColor,
                opacity: 1
            },
            mouseEvt: {
                holder: this.mThirdRingMouseArcs,
                style: simcity.CircleBudget.kHiddenRingStyle(this.mDebugMouseEvents),
				fill: "#ff0000",
                opacity: 1,
                noAnim: true,
                ringPadding2: 27,
                mouseOver: function (arcObj) {
                    var center = arcObj.data("centerPoint");
                    var subData = arcObj.data("subData") || null;
                    var center = arcObj.data("centerPoint");
                    var label = thisObj.mTextLabels[arcObj.data("budgetType")] || arcObj.data("budgetType");
                    //thisObj.mLgPercentLabel = null;
                    thisObj.mItemTypeLabel[0].textContent = label;
                    thisObj.mItemValueLabel[0].textContent = "$" + (Math.round(arcObj.data("budgetValue")));
                    thisObj.mPerHourLabel[0].textContent = "per hour";
                    var currPercent = Math.round((arcObj.data("budgetValue")/thisObj.mBudgetData.totals.budget)*100);
                    thisObj.mPercentLabel[0].textContent = currPercent + "% of total budget";
					
                    thisObj.ShowLabel("$" + (Math.round(arcObj.data("budgetValue"))), arcObj.data("icon"), arcObj.data("hoverColor"), center.x, center.y);
                },
                mouseOut: function (arcObj) {
                    thisObj.HideLabel();
                    
                }
            }
        }
    
    for(var lineItem in currDataSet) { itemCount++ };
    //currDataSet["otherExp"] = 0;
    
    for (var layer in layers) {
        startPercent = startPer + (this.mRingGap/2);
        iterator = 0;
        var currPercent = 0;
        // draw visibile layers
        for (var lineItem in currDataSet) {
            var currItemVal = currDataSet[lineItem];
            if (ringType == "income") {
                currPercent = startPercent + ((currItemVal / this.mBudgetData.totals.budget) * 100);
            } else {
                currPercent = startPercent - ((currItemVal / this.mBudgetData.totals.budget) * 100);
            }
            //console.debug(currPercent);
            var currLayer = layers[layer] || null;
            var currArc = currLayer.holder[lineItem] || null;
            var isNew = false;
            
            if (currArc == null) {
                currLayer.holder[lineItem] = this.mSvgCanvas.path();
                currLayer.holder[lineItem].attr(currLayer.style);
                if (currLayer.filter) {
                    currLayer.holder[lineItem].node.setAttribute("filter", currLayer.filter);
                }
                if(this.mIcons[lineItem] && currLayer.hasIcon) {
                    currLayer.holder[lineItem].data("icon", this.mIcons[lineItem]);
                }
                currArc = currLayer.holder[lineItem];

                
                isNew = true
            }
            if (currLayer.mouseOver) {
                //currArc.toBack();
                currArc.mouseover(function() {
                    currLayer.mouseOver(this);
                });
            }
            if (currLayer.mouseOut) {
                currArc.mouseout(function() {
                    currLayer.mouseOut(this);
                });
            }
            if ((currPercent * -1) > 100000) {
                console.debug("too small" + currPercent);
                currArc.attr({
                    hideArc: true
                });
            } else {
                iterator++;
                
                if((ringType == "income")) {
                    var padding = (iterator === itemCount) ? (this.mRingGap*2) : this.mRingGap;
                    var arcStart = startPercent;
                    var arcEnd = (currPercent - padding);
                } else {
                    var padding = (iterator === 1) ? (this.mRingGap*2) : this.mRingGap;
                    var arcStart = currPercent;
                    var arcEnd = (startPercent - padding)
                }
                currArc.data("startPercent", arcStart);
                currArc.data("endPercent", arcEnd);
                currArc.data("hoverColor", (simcity.CircleBudget.kHoverColors[budgetType])? simcity.CircleBudget.kHoverColors[budgetType] : currArc.attr("fill"));
                currArc.data("normalColor", (simcity.CircleBudget.kHoverColors[budgetType])? simcity.CircleBudget.kHoverColors[budgetType] : currArc.attr("fill"));
                currArc.data("budgetValue", currItemVal);
				currArc.data("budgetType", budgetType + lineItem);
                var textWidth = 0;
                var textHieght = 0;
                var newRadius = this.mRing3RadiusStart + (this.mInsideArcHeight*3);
                var alpha5 = 360 / 100 * ((arcStart + arcEnd)/2);
                var a5 = (90 - alpha5) * Math.PI / 180; // 
                var x5 = (this.mTopCenter + newRadius * Math.cos(a5))-(textWidth/2);
                var y5 = (this.mLeftCenter - newRadius * Math.sin(a5))-(textHieght/2);
                var ringPad = 0;//currLayer.ringPadding;// || this.mCanvasWidth*.11;

                currArc.data("centerPoint", {x: x5, y: y5})
                currArc.attr({
                    fill : (simcity.CircleBudget.kHoverColors[budgetType])? simcity.CircleBudget.kHoverColors[budgetType] : currArc.attr("fill"),
                    stroke: "rgba(97,97,97,.8)",
                    "stroke-width": 1,
                    hideArc: false,
                    opacity: currLayer.opacity,
                    simpleArc: [arcStart, arcEnd, 100, this.mTopCenter, this.mLeftCenter, this.mRing3RadiusStart, this.mInsideArcHeight-(this.mRingGap*6)]
                });
                currArc.animate({
                    opacity: currLayer.opacity,
                    simpleArc: [arcStart, arcEnd, 100, this.mTopCenter, this.mLeftCenter, this.mRing3RadiusEnd, this.mInsideArcHeight-(this.mRingGap*6)]
                }, thisObj.mEaseTime, thisObj.mEasing);
                
                startPercent = (isNaN(currPercent)) ? startPercent : currPercent;
                
            }
        }
    }
    startPercent = currPercent =0;  
};

simcity.CircleBudget.prototype.HideThirdRings = function(thisObj) {
    //var thisObj = this;
    var layers = {
            shadow: {
                holder: this.mThirdRingArcsShadows
            },
            visible: {
                holder: this.mThirdRingArcs
            },
            mouseEvt: {
                holder: this.mThirdRingMouseArcs
            }
        }
    
    for (var layer in layers) {
        var currLayer = layers[layer];
        for (var elem in currLayer.holder) {
            var currArc = currLayer.holder[elem];
            currArc.animate({
                opacity: 0,
                stroke: "rgba(97,97,97,.3)",
                fill: currArc.data("normalColor"),
                simpleArc: [currArc.data("startPercent"), currArc.data("endPercent"), 100, thisObj.mTopCenter, thisObj.mLeftCenter, thisObj.mRing2RadiusStart, thisObj.mInsideArcHeight]
            }, thisObj.mEaseTime, thisObj.mEasing, function () {
				currArc.toBack();
			});
        }
    }
}

simcity.CircleBudget.prototype.IncomeRingHover = function(isMouseOver, ringObj) {
    var thisObj = this;
    if (isMouseOver) {
//        if (thisObj.mIsMouseOverExpense) {
//            thisObj.ExpRingHover(false, thisObj.mExpendRing);
//        }

        var drawArcs = function() {
            if (!thisObj.mIsMouseOver) {
                var newRadius = thisObj.mRing2RadiusEnd;

                for (var lineItem in thisObj.mBudgetData.income) {

                    var currArc = thisObj.mHoverArcs[lineItem];
                    currArc.data("radius", newRadius);
                    currArc.animate({
                        fill: currArc.data("hoverColor"),
                        stroke: "rgba(97,97,97,1)",
                        simpleArc: [currArc.data("startPercent"), currArc.data("endPercent"), 100, thisObj.mTopCenter, thisObj.mLeftCenter, currArc.data("radius"), thisObj.mInsideArcHeight]
                    }, thisObj.mEaseTime, thisObj.mEasing);

                    var currArcShadow = thisObj.mHoverArcsShadows[lineItem];
                    currArcShadow.data("radius", newRadius);
                    currArcShadow.animate({
                        simpleArc: [currArc.data("startPercent"), currArc.data("endPercent"), 100, thisObj.mTopCenter, thisObj.mLeftCenter, currArcShadow.data("radius"), thisObj.mInsideArcHeight]
                    }, thisObj.mEaseTime, thisObj.mEasing);

                    var currArcMouse = thisObj.mSubRingMouseArcs[lineItem];
                    currArcMouse.data("radius", newRadius);
                    currArcMouse.animate({
                        opacity: 1,
                        simpleArc: [currArc.data("startPercent"), currArc.data("endPercent"), 100, thisObj.mTopCenter, thisObj.mLeftCenter, currArcMouse.data("radius"), thisObj.mInsideArcHeight]
                    }, thisObj.mEaseTime, thisObj.mEasing);
                }

            }
        }
        drawArcs();
        ringObj.animate({
            fill: "#41ec1f"
        }, this.mEaseTime, this.mEasing);
    } else {

        for (var lineItem in thisObj.mBudgetData.income) {

            var currArc = thisObj.mHoverArcs[lineItem];
            currArc.data("radius", this.mRing2RadiusStart)
            currArc.animate({
                stroke: "rgba(97,97,97,.3)",
                fill: currArc.data("normalColor"),
                simpleArc: [currArc.data("startPercent"), currArc.data("endPercent"), 100, thisObj.mTopCenter, thisObj.mLeftCenter, currArc.data("radius"), thisObj.mInsideArcHeight]
            }, thisObj.mEaseTime, thisObj.mEasing);

            var currArcShadow = thisObj.mHoverArcsShadows[lineItem];
            currArcShadow.data("radius", this.mRing2RadiusStart);
            currArcShadow.animate({
                simpleArc: [currArc.data("startPercent"), currArc.data("endPercent"), 100, thisObj.mTopCenter, thisObj.mLeftCenter, currArcShadow.data("radius"), thisObj.mInsideArcHeight]
            }, thisObj.mEaseTime, thisObj.mEasing);

            var currArcMouse = thisObj.mSubRingMouseArcs[lineItem];
            currArcMouse.data("radius", this.mRing2RadiusStart);
            currArcMouse.attr({
                opacity: 1,
                simpleArc: [currArc.data("startPercent"), currArc.data("endPercent"), 100, thisObj.mTopCenter, thisObj.mLeftCenter, currArcMouse.data("radius"), thisObj.mInsideArcHeight]
            });
        }

        ringObj.animate({
            fill: "#41ec1f"
        }, this.mEaseTime, this.mEasing);
        thisObj.HideThirdRings(this);
        thisObj.HideLabel();
    }
    this.mIsMouseOverIncome = isMouseOver;
};

simcity.CircleBudget.prototype.ExpRingHover = function(isMouseOver, ringObj) {
    var thisObj = this;
    if (isMouseOver) {
//        if(thisObj.mIsMouseOverIncome) {
//            thisObj.IncomeRingHover(false, thisObj.mIncomeRing);
//        }
        var drawArcs = function() {
            if (!thisObj.mIsMouseOverExpense) {
                var newRadius = thisObj.mRing2RadiusEnd;

                for(var lineItem in thisObj.mBudgetData.expenses) {
					
                    var currArc = thisObj.mHoverArcs[lineItem];
					currArc.data("radius", newRadius);
                    currArc.animate({
                        stroke: "rgba(97,97,97,1)",
                        simpleArc: [currArc.data("startPercent"), currArc.data("endPercent"), 100, thisObj.mTopCenter, thisObj.mLeftCenter, currArc.data("radius"), thisObj.mInsideArcHeight]
                    }, thisObj.mEaseTime, thisObj.mEasing);
					
                    var currArcShadow = thisObj.mHoverArcsShadows[lineItem];
					currArcShadow.data("radius", newRadius);
                    currArcShadow.animate({
                        simpleArc: [currArc.data("startPercent"), currArc.data("endPercent"), 100, thisObj.mTopCenter, thisObj.mLeftCenter, currArc.data("radius"), thisObj.mInsideArcHeight]
                    }, thisObj.mEaseTime, thisObj.mEasing);
					
                    var currArcMouse = thisObj.mSubRingMouseArcs[lineItem];
					currArcMouse.data("radius", newRadius);
                    currArcMouse.attr({
                        simpleArc: [currArc.data("startPercent"), currArc.data("endPercent"), 100, thisObj.mTopCenter, thisObj.mLeftCenter, currArc.data("radius"), thisObj.mInsideArcHeight]
                    });
                }
            }
        }
        drawArcs();
        ringObj.animate({
            fill: "#b93636"
        }, thisObj.mEaseTime, thisObj.mEasing);
        
    } else {
        
        var newRadius = thisObj.mOutsideRadius - (thisObj.mOutsideRadius * .25);
        
        for (var lineItem in thisObj.mBudgetData.expenses) {
            var currArc = thisObj.mHoverArcs[lineItem];
			currArc.data("radius", thisObj.mRing2RadiusStart)
            currArc.animate({
                stroke: "rgba(97,97,97,.3)",
                simpleArc: [currArc.data("startPercent"), currArc.data("endPercent"), 100, thisObj.mTopCenter, thisObj.mLeftCenter, currArc.data("radius"), thisObj.mInsideArcHeight]
            }, thisObj.mEaseTime, thisObj.mEasing);
			
            var currArcShadow = thisObj.mHoverArcsShadows[lineItem];
			currArcShadow.data("radius", this.mRing2RadiusStart);
            currArcShadow.animate({
                simpleArc: [currArc.data("startPercent"), currArc.data("endPercent"), 100, thisObj.mTopCenter, thisObj.mLeftCenter, currArc.data("radius"), thisObj.mInsideArcHeight]
            }, thisObj.mEaseTime, thisObj.mEasing);
			
            var currArcMouse = thisObj.mSubRingMouseArcs[lineItem];
			currArcMouse.data("radius", this.mRing2RadiusStart);
            currArcMouse.attr({
                simpleArc: [currArc.data("startPercent"), currArc.data("endPercent"), 100, thisObj.mTopCenter, thisObj.mLeftCenter, currArc.data("radius"), thisObj.mInsideArcHeight]
            });
            
        }
        
        ringObj.animate({
            fill: "rgb(185,54,54)"
        }, thisObj.mEaseTime, thisObj.mEasing, drawArcs);
        thisObj.HideThirdRings(this);
        thisObj.HideLabel();
    }
    this.mIsMouseOverExpense = isMouseOver;
};

simcity.CircleBudget.prototype.ShowLabel = function (message, icon, color, x1, y1) {
	//console.debug("LABEL @ X:" + x1 + " y:" + y1)
	var layoutFile = this.mPageLayouts.MOUSE_OVER_LABEL;
    if(x1 < this.mCanvasWidth/2) {
        layoutFile = this.mPageLayouts.MOUSE_OVER_LABEL_ALT;
    }
	
    if(this.mDataMouseoverLabel !== null) {
		this.mDataMouseoverLabel.DestroyControl();
		this.mDataMouseoverLabel = null;
    }
    this.mBudgetContainer = gUIManager.FindControlByID(this.mControlIDs.UI_CONTAINER);
    this.mDataMouseoverLabel = gUIManager.LoadLayout(layoutFile, this.mBudgetContainer);

    var iconCircle = this.mDataMouseoverLabel.FindControlByID(this.mControlIDs.ICON_BG)
    var newX = x1-(iconCircle.mWidth/2) - ((x1 < this.mCanvasWidth/2) ? (this.mDataMouseoverLabel.mWidth-(iconCircle.mWidth/2)) : 0);
    var newY = y1-(iconCircle.mHeight/2);
	

    iconCircle.mRootElement.style.backgroundColor = color;

	this.mDataMouseoverLabel.SetPosition(newX, newY, this.mDataMouseoverLabel.mWidth, this.mDataMouseoverLabel.mHeight);
	this.mDataMouseoverLabel.FindControlByID(this.mControlIDs.LABEL_TEXT).SetText(message);
	if (icon) {
		this.mDataMouseoverLabel.FindControlByID(this.mControlIDs.ICON_HOLDER).SetWindowImage("/resource/Graphics/HUD/" + icon.attr('src'));
	}
	
/*
    //old dot
    if(this.mDataLabelText == null) {
        this.mDataColorCircle = this.mSvgCanvas.circle(x1, y1, 20).attr(simcity.CircleBudget.kWhiteCircle(this.mCanvasHeight))
        this.mDataLabelText = this.mSvgCanvas.text(10, 10, message).attr(simcity.CircleBudget.kLabelFontStyle(this.mCanvasHeight));
        this.mDataLabelText.attr({x: x1, y: y1});
    } else {
        this.mDataColorCircle.show();
        this.mDataLabelText.show();
        this.mDataLabelText.attr({"x": x1, "y": y1, "text": message});
        this.mDataColorCircle.attr({"cx": x1, "cy": y1, "fill": color});
        //this.mDataLabelText.textContent = message;
        
        this.mDataColorCircle.toFront();
        this.mDataLabelText.toFront();
    }
*/
};

simcity.CircleBudget.prototype.HideLabel = function() {
	if (this.mDataMouseoverLabel !== null) {
		this.mDataMouseoverLabel.DestroyControl();
		this.mDataMouseoverLabel = null;
	}
};

simcity.CircleBudget.prototype.TotalBudget = function () {
    this.mBudgetData.totals.income = 0;
    this.mBudgetData.totals.expenses = 0;

    for(var lineItem in this.mBudgetData.totals) {
        this.mBudgetData.totals[lineItem] = 0;
    }

    for (var lineItem in this.mBudgetData.income.res) {
        this.mBudgetData.totals.res += (this.mBudgetData.income.res[lineItem] == 0) ? .0 : this.mBudgetData.income.res[lineItem];
    }
    for (var lineItem in this.mBudgetData.income.comm) {
        this.mBudgetData.totals.comm += (this.mBudgetData.income.comm[lineItem] == 0) ? .0 : this.mBudgetData.income.comm[lineItem];
    }
    for (var lineItem in this.mBudgetData.income.indust) {
        this.mBudgetData.totals.indust += (this.mBudgetData.income.indust[lineItem] == 0) ? .0 : this.mBudgetData.income.indust[lineItem];
    }
    this.mBudgetData.income.globalMarketInc = (this.mBudgetData.income.globalMarketInc == 0) ? .0 : this.mBudgetData.income.globalMarketInc;
    this.mBudgetData.income.trading = (this.mBudgetData.income.trading == 0) ? .0 : this.mBudgetData.income.trading;
    this.mBudgetData.totals.income = this.mBudgetData.income.globalMarketInc + this.mBudgetData.income.trading;
    this.mBudgetData.totals.income += this.mBudgetData.totals.res + this.mBudgetData.totals.comm + this.mBudgetData.totals.indust;
    
    for(var lineItem in this.mBudgetData.expenses) {
        this.mBudgetData.expenses[lineItem] = (this.mBudgetData.expenses[lineItem] == 0) ? .0 : this.mBudgetData.expenses[lineItem];
    }
    for(var lineItem in this.mBudgetData.expenses) {
        this.mBudgetData.totals.expenses += this.mBudgetData.expenses[lineItem];
    }
//    for(var lineItem in this.mBudgetData.expenses) {
//        var perc = (this.mBudgetData.expenses[lineItem] - this.mBudgetData.totals.expenses)*100;
//        if (perc < 1) {
//            this.mBudgetData.expenses["otherExp"] += this.mBudgetData.expenses[lineItem];
//        }
//    }
    this.mBudgetData.totals.budget = this.mBudgetData.totals.income + this.mBudgetData.totals.expenses;
    this.UpdateIncome((this.mBudgetData.totals.income/this.mBudgetData.totals.budget)*100);
    this.HideLabel();
    this.HideThirdRings(this);
    this.DrawSecondLevelRing("income");
    this.DrawSecondLevelRing("expense");
};

simcity.CircleBudget.prototype.UpdateBudget = function(newBudget) {
    this.mBudgetData.income = newBudget.income;  
    this.mBudgetData.expenses = newBudget.expenses;      
    this.TotalBudget();
};

simcity.CircleBudget.prototype.UpdateIncome = function (incomePercent) {
    var easing = "<>";
    var easeTime = 300;
    if (this.mIncomePercent !== incomePercent) {
        this.mIncomePercent = incomePercent;
        //this.mLgPercentLabel[0].textContent = Math.round(this.mIncomePercent) + "%";
        var thisObj = this;
        this.mExpendRing.animate({
            radArc: [0, this.mIncomePercent, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius, this.mStrokeWidth]
        }, easeTime, easing);
        this.mIncomeRing.animate({
            radArc: [100, this.mIncomePercent, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius, this.mStrokeWidth]
        }, easeTime, easing);
        
        
        if (this.mUseAltMousePick) {
            this.mExpendRingHoverOver.attr({
                radArc: [0, this.mIncomePercent, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius, this.mStrokeWidth]
            });
            this.mExpendRingHoverOut.attr({
                radArc: [0, this.mIncomePercent, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius + 27, this.mStrokeWidth + 27]
            });
            
            this.mIncomeRingHoverOver.attr({
                radArc: [100, this.mIncomePercent, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius, this.mStrokeWidth]
            });
            this.mIncomeRingHoverOut.attr({
                radArc: [100, this.mIncomePercent, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius + 27, this.mStrokeWidth + 27]
            });
        } else {
            this.mExpendRingHover.attr({
                radArc: [0, this.mIncomePercent, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius, this.mStrokeWidth]
            });
            this.mIncomeRingHover.attr({
                radArc: [100, this.mIncomePercent, 100, this.mTopCenter, this.mLeftCenter, this.mOutsideRadius, this.mStrokeWidth]
            });
        }
        var newRadius = this.mOutsideRadius + (this.mOutsideRadius * .17);
    }
};

/* **************************************
 * begin svg styles
 ************************************** */

simcity.CircleBudget.kHoverColors = {
    res: "#27c708",
    comm: "#10a6e4",
    indust: "#d8d117",
    ordinances : "#33ccff",
    exports : "#33ccff",
	other : "rgb(185,54,54)"
}

simcity.CircleBudget.kNormalColors = {
    res: "#27c708",
    comm: "#10a6e4",
    indust: "#d8d117",
    ordinances : "#33ccff",
    exports : "#33ccff",
    other : "rgb(185,54,54)"
}

simcity.CircleBudget.kExpRingStyle = function (canvasWidth) {
    return {
        fill: "rgb(185,54,54)",
        stroke: "rgb(223,223,223)",
        "stroke-width": 2
    }
};

simcity.CircleBudget.kIncomeRingStyle = function (canvasWidth) {
    return {
        fill : "#27c708",
        stroke : "rgba(223,223,223,1)",
        "stroke-width": 2
    }
};

simcity.CircleBudget.kHiddenRingStyle = function (debugMouseEvents) {
    return {
        fill: "rgba(255,255,255,0)",
        stroke: (debugMouseEvents) ? "rgba(0,0,255,1)" : "rgba(0,0,255,0)",
        "stroke-width": (debugMouseEvents) ? 1 : 0
    }
};

simcity.CircleBudget.kGreenSubRingStyle = function (canvasWidth) {
    return {
        stroke: "rgba(97,97,97,0)",
        fill: "#27c708",
        "stroke-width": 1
    }
};

simcity.CircleBudget.kRedSubRingStyle = function (canvasWidth) {
    return {
        stroke: "rgba(97,97,97,0)",
        fill: "rgb(185,54,54)",
        "stroke-width": 1
    }
};

simcity.CircleBudget.kLgGreenFontStyle = function (canvasHeight) {
    return {
        font: (canvasHeight*.09) + "px \"Arial\"",
        fill: "#27c708",
        fontWeight: "bold",
        stroke: "rgba(0,0,0,.8)",
        "stroke-width" : 0,
        "text-rendering" : "optimizeSpeed"
    }
}

simcity.CircleBudget.kLabelNormalFontStyle = function (canvasHeight) {
    return {
        font: (canvasHeight*.045) + "px \"Arial\"",
        fill: "black",
        fontWeight: "normal",
        stroke: "rgba(0,0,0,0)",
        "stroke-width" : 0,
        "text-rendering" : "optimizeQuality"
    }
}

simcity.CircleBudget.kLabelBoldFontStyle = function (canvasHeight) {
    return {
        font: (canvasHeight*.045) + "px \"Arial\"",
        fill: "black",
        fontWeight: "normal",
        stroke: "rgba(0,0,0,0)",
        "stroke-width" : 0,
        "text-rendering" : "optimizeQuality"
    }
}

simcity.CircleBudget.kBlackRadialFill = function (canvasHeight) {
    return {
        stroke: "rgba(255,255,255,0)",
        "stroke-width" : 0,
        "fill": "r(.5,.5)0-rgba(97,97,97,1): 90-rgba(97,97,97,0)",
        opacity: 0,
        "color-rendering" : "optimizeQuality"
    }
}

simcity.CircleBudget.kDropShadow = function (canvasHeight) {
    return {
        stroke: "rgba(0,0,0,1)",
        "stroke-width" : 1,
        "fill": "rgba(97,97,97,1)"
    }
}

simcity.CircleBudget.kWhiteCircle = function (canvasHeight) {
    return {
        stroke: "rgba(97,97,97,1)",
        "stroke-width" : 2,
        "fill": "90-#c6cdd5:0-#ffffff:60"
    }
}

simcity.CircleBudget.kGreyCircle = function (canvasHeight) {
    return {
        stroke: "rgba(97,97,97,1)",
        "stroke-width" : 2,
        "fill": "rgba(223,223,223,1)"
    }
}

simcity.CircleBudget.prototype.AppendTransforms = function () {
  /*  
    var glowFilters = {
        feColorMatrix : {
            "in" : "SourceGraphic",
            "type" : "matrix",
            "values" : "0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 1 0",
            "result" : "mask"
        },
        feMorphology : {
            "in" : "mask",
            "radius" : 1,
            "operator" : "dilate",
            "result" : "mask"
        },
        feColorMatrix : {
            "in" : "mask",
            "type" : "matrix",
            "values" : "0 0 0 0 0.6 0 0 0 0 0.5333333333333333 0 0 0 0 0.5333333333333333  0 0 0 1 0",
            "result" : "r0"
        },
        feGausianBlur : {
            "in" : "r0",
            "stdDeviation" : 4,
            "result" : "r1"
        },
        feComposite : {
            "operator" : "out",
            "in" : "r1",
            "in2" : "mask",
            "result" : "comp"
        },
        feMerge : {
            "feMergeNode" : {
                "in" : "SourceGraphic"
            },
            "feMergeNode-1" : {
                "in" : "r1"
            }
        }
    }
    */
    var SVGTag = document.getElementsByTagName("defs")[0];
    var filterTag =  window.document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filterTag.setAttribute('id','outerGlow');
    
    var blurFilter1 =  window.document.createElementNS("http://www.w3.org/2000/svg", "filter");
    blurFilter1.setAttribute('id','lgBlur');
    
    var blurTag1 = window.document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    blurTag1.setAttribute('stdDeviation', 10);
    blurFilter1.appendChild(blurTag1);
    SVGTag.appendChild(blurFilter1);

    var blurFilter2 =  window.document.createElementNS("http://www.w3.org/2000/svg", "filter");
    blurFilter2.setAttribute('id','smBlur');
    
    var blurTag2 = window.document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    blurTag2.setAttribute('stdDeviation', 1.5);
    blurFilter2.appendChild(blurTag2);
    SVGTag.appendChild(blurFilter2);
/*
    for(var filterType in glowFilters) {
        var attrTag = window.document.createElementNS("http://www.w3.org/2000/svg", filterType);
        var currFilter = glowFilters[filterType];
        for(var filterAttr in currFilter) {
            if (typeof currFilter[filterAttr] !== "object") {
                attrTag.setAttribute(filterAttr, currFilter[filterAttr])
            } else {
                var tag = (filterAttr.indexOf('-') > -1) ? filterAttr.substring(0,filterAttr.indexOf('-')) : filterAttr;
                var subTag = window.document.createElementNS("http://www.w3.org/2000/svg", tag);
                var currSubAttr = currFilter[filterAttr];
                for(var subAttr in currSubAttr) {
                    subTag.setAttribute(subAttr, currSubAttr[subAttr]);
                } 
                attrTag.appendChild(subTag);
            }
        }
        filterTag.appendChild(attrTag);
    }
  */  
    SVGTag.appendChild(filterTag);
};
