scrui = {};

scrui.cBrowserWindow = function (windowName, url) {
	this.mStrWindowFeatures = "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,copyhistory=yes,resizable=no,width=600,height=550";
    this.mWindowObj = window.open(url, "test", this.mStrWindowFeatures);
	this.mWindowBody = this.mWindowObj.document.body;
	var tempdiv = document.createElement("div");
	tempdiv.innerHTML = "test";
	this.mWindowBody.appendChild(tempdiv)
	console.debug(this.mWindowBody)
}


