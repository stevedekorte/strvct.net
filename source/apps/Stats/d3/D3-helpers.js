"use strict";

/*
    
    D3-helpers


*/

// Moves selction to front
d3.selection.prototype.moveToFront = function () {
	return this.each(function () {
		this.parentNode.appendChild(this);
	});
};

// Moves selction to back
d3.selection.prototype.moveToBack = function () {
	return this.each(function () {
		var firstChild = this.parentNode.firstChild;
		if (firstChild) {
			this.parentNode.insertBefore(this, firstChild);
		}
	});
};
