
function Selection(x, y, w, h){
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this._x = x;
	this._y = y;
	this._w = w;
	this._h = h;
	
	this.$ghost = $(E("div")).addClass("jspaint-selection").appendTo($canvas_area);
	
	
	$canvas_handles.hide();
}

Selection.prototype.instantiate = function(_img, _passive){
	var sel = this;
	
	sel.$ghost.addClass("instantiated").css({
		cursor: Cursor(["move", [8, 8], "move"])
	});
	sel.position();
	
	if(_passive){
		instantiate();
	}else if(!undoable(instantiate)){
		sel.destroy();
	}
	
	function instantiate(){
		if(_img){
			sel.canvas = _img;
			sel.canvas.width = sel._w;
			sel.canvas.height = sel._h;
		}else{
			sel.canvas = document.createElement("canvas");
			sel.canvas.width = sel._w;
			sel.canvas.height = sel._h;
			sel.ctx = sel.canvas.getContext("2d");
			sel.ctx.drawImage(
				canvas,
				sel._x, sel._y,
				sel._w, sel._h,
				0, 0,
				sel._w, sel._h
			);
			// cut the selection from the canvas
			//@TODO: proper transparency for Free-Form Select
			//ctx.globalCompositeOperation = "destination-out";
			//ctx.drawImage()...
			if(!_passive){
				if(transparency){
					ctx.clearRect(sel._x, sel._y, sel._w, sel._h);
				}else{
					ctx.fillStyle = colors[1];
					ctx.fillRect(sel._x, sel._y, sel._w, sel._h);
				}
			}
		}
		sel.$ghost.append(sel.canvas);
		
		//sel.$handles = $Handles(sel.$ghost, sel.canvas, {outset: 2});
		
		sel.$ghost.on("user-resized", function(e, x, y, width, height){
			//tb._x = x;
			//tb._y = y;
			sel._w = width;
			sel._h = height;
			sel.position();
			
			var new_canvas = E("canvas");
			new_canvas.width = width;
			new_canvas.height = height;
			var new_ctx = new_canvas.getContext("2d");
			new_ctx.imageSmoothingEnabled = false;
			new_ctx.mozImageSmoothingEnabled = false;
			new_ctx.webkitImageSmoothingEnabled = false;
			new_ctx.drawImage(sel.canvas, 0, 0, width, height);
			
			$(sel.canvas).replaceWith(new_canvas);
			sel.canvas = new_canvas;
			sel.ctx = new_ctx;
			
			$(sel.canvas).on("mousedown", canvas_mousedown);
			sel.$ghost.triggerHandler("new-element", [sel.canvas]);
			sel.$ghost.triggerHandler("resize");
		});
		
		var mox, moy;
		var mousemove = function(e){
			var m = e2c(e);
			sel._x = Math.max(Math.min(m.x - mox, canvas.width), -sel._w);
			sel._y = Math.max(Math.min(m.y - moy, canvas.height), -sel._h);
			sel.position();
			
			if(e.shiftKey){
				sel.draw();
			}
		};
		
		$(sel.canvas).on("mousedown", canvas_mousedown);
		$canvas_area.trigger("resize");
		$status_position.text("");
		$status_size.text("");
		
		function canvas_mousedown(e){
			e.preventDefault();
			
			var rect = sel.canvas.getBoundingClientRect();
			var cx = e.clientX - rect.left;
			var cy = e.clientY - rect.top;
			mox = ~~(cx / rect.width * sel.canvas.width);
			moy = ~~(cy / rect.height * sel.canvas.height);
			
			$G.on("mousemove", mousemove);
			$G.one("mouseup", function(){
				$G.off("mousemove", mousemove);
			});
			
			if(e.shiftKey){
				sel.draw();
			}
		}
	}
};

Selection.prototype.position = function(){
	this.$ghost.css({
		position: "absolute",
		left: this._x + 3,
		top: this._y + 3,
		width: this._w,
		height: this._h,
	});
	$status_position.text(this._x + "," + this._y);
	$status_size.text(this._w + "," + this._h);
};

Selection.prototype.draw = function(){
	try{ctx.drawImage(this.canvas, this._x, this._y);}catch(e){}
};

Selection.prototype.destroy = function(){
	this.$ghost.remove();
	$canvas_handles.show();
};

Selection.prototype.crop = function(){
	var _this = this;
	this.instantiate(null, "passive");
	if(this.canvas){
		undoable(0, function(){
			canvas.width = _this.canvas.width;
			canvas.height = _this.canvas.height;
			ctx.drawImage(_this.canvas, 0, 0);
			$canvas.trigger("update"); //update handles
		});
	}
};
