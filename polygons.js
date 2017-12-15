//Created by Isaiah Smith


/* Feature Test:
	used for testing the features of this namespace.
	creates an example polygon and allows the user to
	cast a ray through it by clicking on the canvas,
	the ray collisions are then drawn in red, and the
	intersection points in green.
*/
/* TEST BEGIN:

var renderTarget = document.getElementById("canvas"); // replace "canvas" with the canvas element's name on your page
var context = renderTarget.getContext("2d");

document.getElementById("canvas").addEventListener("click", 
	function(event){
	init(event.offsetX, event.offsetY);
});

function init(x, y){
	console.clear();
	context.fillStyle = "#fff";
	context.fillRect(0, 0, 300, 300);
	var startRay = ray.fromPoints(new vec2(150, 150), new vec2(x, y));
	console.log(startRay);
	
	var testPoly = new polygon();
	testPoly.setVerts([new vec2(-4, -4), new vec2(-4, -5), new vec2(-2, -3), new vec2(-2, -1), new vec2(-1, -2), new vec2(-1, -5), new vec2(-2, -6), new vec2(-2, -8), new vec2(-1, -9), new vec2(0, -8), new vec2(1, -9), new vec2(2, -8), new vec2(2, -6), new vec2(1, -5), new vec2(1, -2), new vec2(2, -1), new vec2(2, -3), new vec2(4, -5), new vec2(4, -4), new vec2(5, -4), new vec2(3, -2), new vec2(3, 1), new vec2(4, 0), new vec2(4, 3), new vec2(1, 4), new vec2(1, 3), new vec2(0, 5), new vec2(-1, 3), new vec2(-1, 4), new vec2(-4, 3), new vec2(-4, 0), new vec2(-3, 1), new vec2(-3, -2), new vec2(-5, -4)]);
	testPoly.setPosition(new vec2(65, 100));
	testPoly.setScale(10);
	var cols = startRay.polygonCollision(testPoly);
	console.log("testPoly boundingbox: " + testPoly.getBoundingBox().testIntersect(startRay).toString());
	
	testPoly.getBoundingBox().drawOutline(context, "#00f");
	testPoly.drawFill(context, "#bbb");
	startRay.draw(context);
	
	context.fillStyle = "#0b0";
	for(var i = 0; i < cols.length; i += 1){
		cols[i].rayTarget.draw(context);
		context.fillRect(cols[i].intersection.x-3, cols[i].intersection.y-3, 6, 6);
	}
}
*/

/* class vec2:
	data structure used for storing vectors,
	also contains useful methods for doing vector math
*/

class vec2{
	constructor(x = 0, y = 0){
		this.x = x;
		this.y = y;
	}
	
	normalized(magnitude = 1){
		//returns a vector 2 with the same direction as this but
		//with a specified magnitude
		return this.multiply(magnitude / this.distance());
	}
	inverted(){
		//returns the opposite of this vector
		return this.multiply(-1);
	}
	multiply(factor){
		//returns this multiplied by a specified factor		
		return new vec2(this.x * factor, this.y * factor);
	}
	plus(vect2){
		//returns the result of this added to another specified vector2
		return new vec2(this.x + vect2.x, this.y + vect2.y);
	}
	minus(vect2){
		//returns the result of this subtracted by another specified vector2
		return this.plus(vect2.inverted());
	}
	equals(vect2, leniency = 0){
		//returns true if the difference between the two vectors is less than the specified leniency
		return (
			Math.abs(this.x - vect2.x) <= leniency) && (
			Math.abs(this.y - vect2.y) <= leniency);
	}
	
	direction(){
		//returns the angle this vector is pointing in radians
		return Math.atan2(this.y, this.x);
	}
	distance(vect2 = null){
		//returns the distance between this and a specified vector2
		if(vect2 === null)
			vect2 = new vec2();
		var d = Math.sqrt(
			Math.pow(this.x - vect2.x, 2) + 
			Math.pow(this.y - vect2.y, 2));
		return d;
	}
	
	clone(){
		return new vec2(this.x, this.y);
	}
	
	static fromAng(angle, magnitude = 1){
		//returns a vector which points in the specified angle
		//and has the specified magnitude
		return new vec2(
			Math.cos(angle) * magnitude, 
			Math.sin(angle) * magnitude);
	}
	
	toString(){
		return "<" + this.x + "," + this.y + ">";
	}
}
class polygon{
	//type for drawing shapes and doing geometry calculations
	constructor(){
		this.parent = null; //for user data reference
		this._points = [];
		this._position = new vec2();
		this._scale = 1;
		this._rotation = 0;
		this._absVerts = [];
		this._boundingbox = null;
		this._flipped = false;
		this._rays = null;	//see 'ray.addPolygonRays(poly)'
	}
	
	getBoundingBox(){
		if(this._boundingBox == null)
			this.updateBoundingBox();
		return this._boundingbox;
	}
	updateBoundingBox(){
		var absverts = this.getAbsVerts();
		if(absverts.length < 1)
			return new box(this._position.x, this._position.y);
		var l = absverts[0].x;
		var r = absverts[0].x;
		var t = absverts[0].y;
		var b = absverts[0].y;
		for(var i = 1; i < absverts.length; i += 1){
			l = Math.min(l, absverts[i].x);
			r = Math.max(r, absverts[i].x);
			t = Math.min(t, absverts[i].y);
			b = Math.max(b, absverts[i].y);
		}
		this._boundingbox = new box(l, t, r-l, b-t);
	}
	getAbsoluteVertices(){
		if(this._absVerts == null)
			this.updateAbsVerts();
		return this._absVerts;
	}
	getAbsVerts(){
		return this.getAbsoluteVertices();
	}
	updateAbsVerts(){
		this._absVerts = [];
		for(var i = 0; i < this._points.length; i += 1){
			var v = this._points[i];
			v.x *= this._flipped ? -1 : 1;
			
			var ang = v.direction();
			var mag = v.distance();
			v = vec2.fromAng(ang + this._rotation, mag);
			
			v = v.multiply(this._scale);
			v = v.plus(this._position);
			this._absVerts.push(v);
		}
		this._rays = null;	//reset so they have to be recalculated when next called for
		this.updateBoundingBox();
	}
	setVerts(vertices){
		this._points = vertices;
		this.updateAbsVerts();
	}
	getVerts(){
		return this._points;
	}
	
	transformPoints(translate, scale = 1, rotate = 0){
		//transforms the point data of the polygon
		for(var i = 0; i < this._points.length; i += 1){
			var v = this._points[i];
			
			var ang = v.direction();
			var mag = v.distance();
			v = vec2.fromAng(ang + rotate, mag);
			
			v = v.multiply(scale);
			v = v.plus(translate);
			this._points[i] = v;
		}
		this._absVerts = null;
	}
	flipPoints(vertically = true, horizontally = false){
		// flips points along the relative axes
		// if vertically, flips ACROSS y-axis (x *= -1)
		// if horizontally, flips ACROSS x-axis (y *= -1)
		for(var i = 0; i < this._points.length; i += 1){
			var v = this._points[i];
			
			if(vertically) v.x *= -1;
			if(horizontally) v.y *= -1;
			
			this._points[i] = v;
		}
		this._absVerts = null;
	}
	movePos(translation){
		this._position = this._position.plus(translation);
		this._absVerts = null;
		return this;
	}	
	setPos(pos){
		this._position = pos;
		this._absVerts = null;
		return this;
	}
	getPos(){
		return this._position;
	}
	setScale(scale){
		this._scale = scale;
		this._absVerts = null;
		return this;
	}
	getScale(){
		return this._scale;
	}
	setRot(angle){
		this._rotation = angle;
		this._absVerts = null;
		return this;
	}
	getRot(){
		return this._rotation;
	}
	setFlipped(flip = true){
		this._flipped = flip;
		this._absVerts = null;
	}
	getFlipped(){
		return this._flipped;
	}
	getEdgeRays(){
		if(!this._rays)
			ray.addPolygonRays(this);
		return this._rays;
	}

	worldPointToLocal(position){
		//transforms an absolute position to the same position in the scope of this polygon
		var v = position;
		
		v = v.minus(this.getPosition());
		v = v.multiply(1 / this.getScale())
		
		var ang = v.direction();
		var mag = v.distance();
		v = vec2.fromAng(ang - this.getRotation(), mag);
		
		return v;
	}
	
	polygonIntersections(poly){
		//returns the intersections between this and another
		//polygon
		if(!box.testOverlap(this.getBoundingBox(), poly.getBoundingBox()))
			return [];
		var cols = [];
		var edges = this.getEdgeRays();
		var oEdges = poly.getEdgeRays();
		for(var i = 0;i < edges.length;i += 1){
			cols = cols.concat(edges[i].polygonCollision(poly));
		}
		return cols;
	}
	
	drawOutline(ctx, color = "#888", thickness = 1){
		var absverts = this.getAbsVerts();
		if(absverts.length < 2)
			return;
		ctx.strokeStyle = color;
		ctx.lineWidth = thickness;
		ctx.beginPath();
		ctx.moveTo(absverts[0].x, absverts[0].y);
		for(var i = 0; i < absverts.length; i += 1){
			var i2 = i + 1;
			if(i2 >= absverts.length)
				i2 = 0;
			ctx.lineTo(absverts[i2].x, absverts[i2].y);
		}
		ctx.stroke();
	}
	drawFill(ctx, color = "#888"){
		var absverts = this.getAbsVerts();
		if(absverts.length < 3)
			return;
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.moveTo(absverts[0].x, absverts[0].y);
		for(var i = 0; i < absverts.length; i += 1){
			var i2 = i + 1;
			if(i2 >= absverts.length)
				i2 = 0;
			ctx.lineTo(absverts[i2].x, absverts[i2].y);
		}
		ctx.fill();
	}
	
	static Rectangle(width, height = width){
		var p = new polygon();
		var verts = [
			new vec2(width / -2, height / -2),
			new vec2(width / -2, height / 2),
			new vec2(width / 2, height / 2),
			new vec2(width / 2, height / -2)
		];
		p.setVerts(verts);
		return p;
	}
	static Circle(radius, segments = 12){
		var p = new polygon();
		var verts = [];
		for (var i = 0; i < segments; i += 1){
			var ang = (i / segments) * (Math.PI * 2);
			var vec = vec2.fromAng(ang, radius);
			verts.push(vec);
		}
		p.setVerts(verts);
		return p;
	}
	
	toString(){
		return "polygon: " + this._points.toString();
	}
}
class box{
	//axis aligned bounding box
	constructor(x = 0, y = 0, w = 0, h = 0){
		this.position = new vec2(x, y);
		this.size = new vec2(w, h);
	}
	
	top(){
		return this.position.y;
	}
	bottom(){
		return this.position.y + this.size.y;
	}
	left(){
		return this.position.x;
	}
	right(){
		return this.position.x + this.size.x;
	}
	
	drawOutline(ctx, color = "#888", thickness = 1){
		ctx.strokeStyle = color;
		ctx.lineWidth = thickness;
		ctx.strokeRect(this.position.x, this.position.y, this.size.x, this.size.y);
	}
	drawFill(ctx, color = "#888"){
		ctx.fillStyle = color;
		ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
	}
	
	containsPoint(point){
		return (
			point.x >= this.position.x &&
			point.x <= this.right() &&
			point.y >= this.position.y &&
			point.y <= this.bottom());
	}
	testIntersect(testray){
		if(this.containsPoint(testray.getPosition()))
			return true;
		if(testray._isVertical){
			var testy = testray._m > 0 ? this.position.y : this.bottom();
			return (
				testray._origin.x >= this.position.x &&
				testray._origin.x <= this.right() &&
				testy <= testray.length);
		}
		
		//test points on edges
		var x_t = testray.getEndPosition().x;
		var xmin = Math.min(testray._origin.x, x_t);	//for making sure the intersect
		var xmax = Math.max(testray._origin.x, x_t);	//is in range of the ray
		var yal = testray.getY(this.position.x); //y at left
		if(yal >= this.position.y && yal <= this.bottom())
			if(xmin <= this.position.x && this.position.x <= xmax)
				return true;
		var yar = testray.getY(this.right());
		if(yar >= this.position.y && yar <= this.bottom())
			if(xmin <= this.right() && this.right() <= xmax)
				return true;
		var xat = testray.getX(this.position.y); //x at top
		if(xat >= this.position.x && xat <= this.right())
			if(xmin <= xat && xat <= xmax)
				return true;
		var xab = testray.getX(this.bottom());
		if(xab >= this.position.x && xab <= this.right())
			return xmin <= xab && xab <= xmax;
		return false;
	}
	static testOverlap(boxA, boxB){
		return !(
				boxB.left() > boxA.right() ||
				boxB.right() < boxA.left() ||
				boxB.top() > boxA.bottom() ||
				boxB.bottom() < boxA.top());
	}
	
	toString(){
		return "box: l:" + this.left() +
			" r:" + this.right() + 
			" t:" + this.top() + 
			" b:"	+ this.bottom();
	}
}
class ray{
	constructor(pos = new vec2(), angle = 0, length = Infinity){
		this.length = length;
		//do not directly modify _private _variables:
		this._parentPoly = null;
		this._origin = pos;
		this._m = 0;
		this._b = 0;
		this._isVertical = false;
		this._angle = 0;
		
		this.setAngle(angle);
		//would normally need to call this.recalculate but since it is
		//already called inside of this.setAngle, it would be redundant
	}
	
	getPosition(){
		return this._origin;
	}
	setPosition(pos){
		this._origin = pos;
		this.recalculate();
	}
	getEndPosition(){
		var mag = this.length;
		if(mag == Infinity)
			mag = 999999;
		return this._origin.plus(vec2.fromAng(this._angle).multiply(mag));
	}
	setEndPosition(pos){
		var mag = this._origin.distance(pos);
		var dir = pos.minus(this._origin).direction();
		this.length = mag;
		this._angle = dir;
		this.recalculate();
	}
	getAngle(){
		return this._angle;
	}
	setAngle(angle){
		//sets the angle that the ray points in
		//ensures that any given angle is wrapped between (-pi, pi]
		if(Math.abs(angle) > Math.PI)
			angle = angle % Math.PI * -1;
		if(angle == -Math.PI)
			angle = Math.PI;
		
		this._angle = angle;
		this.recalculate();
	}
	getSlope(){
		if(this._isVertical)
			return this._m * Infinity;
		return this._m;
	}
	getOffsetY(){
		if(this._isVertical)
			return this._m * -1 * Infinity;
		return this._b;
	}
	getY(x){
		//returns the y value that lies on the ray, given x
		if(this._isVertical){
			return x >= this.origin.x ? 
				this._m * Infinity : 
				this._m * -Infinity;
		}
		//the ray is stored as a simple formula in slope intercept form: 
		//y = m * x + b
		return this._m * x + this._b;
	}
	getX(y){
		//returns x of ray, given y
		if(this._m === 0)
			return this._origin.y;
		//x = (y-b)/m
		return (y - this._b) / this._m;
	}
	recalculate(){
		//recalculate the rays slope intercept formula variables
		if(Math.abs(Math.abs(this._angle) - Math.PI / 2)
				<= 0.0000001){										//if the angle is vertical,
			this._m = Math.sign(this._angle);	 //_m stores the direcction that
			this._b = 0;												//the ray is pointing in, while
			this._isVertical = true;						//_b is truncated
		}
		else{																 //if the angle is not vertical
			this._m = Math.tan(this._angle);//convert the angle to a slope
			this._b = this._origin.y - (this._m * this._origin.x);	//and find 
			this._isVertical = false;					 //the line's vertical offset
		}
	}
	
	intersection(otherRay){
		//returns the intesection point between this and specified
		//ray if there is one, otherwise returns null
		if(this._angle === otherRay._angle ||	 //impossible collisions
			this.getPosition().distance(otherRay.getPosition()) > this.length + otherRay.length)
			return null;
		
		if(this._isVertical) return this.intersect_vertical(otherRay);
		if(otherRay._isVertical) return otherRay.intersect_vertical(this);
		
		var intersect = new vec2();
		//calculate intersection
		intersect.x = (otherRay._b - this._b) / (this._m - otherRay._m);
		intersect.y = this._m * intersect.x + this._b;
		
		if(intersect.distance(this._origin) > this.length) return null;
		if(intersect.distance(otherRay._origin) > otherRay.length) return null;
		
		//just don't even ask. It's ugly. Basically this makes sure the intersection 
		//point is in front of the ray instead of behind it:
		var thisDir = Math.abs(this._angle) < Math.PI / 2 ? 1 : -1;
		var intDir = Math.sign(intersect.x - this._origin.x);
		if(thisDir != intDir) return null;
		
		var otherDir = Math.abs(otherRay._angle) < Math.PI / 2 ? 1 : -1;
		intDir = Math.sign(intersect.x - otherRay._origin.x);
		if(otherDir != intDir) return null;
		
		//if it passes the tests, we have a collision! :D
		return intersect;
	}
	intersect_vertical(otherRay){
		//parallel rays never intersect
		if(otherRay._isVertical) return null;
		
		//calculate vertical intersection
		var intersect = new vec2();
		intersect.x = this._origin.x;
		intersect.y = otherRay.getY(intersect.x);
		
		//ugly conditional bullshit below to assure that the collision point lies on the ray:
		//make sure intersect is not behind ray
		var thisDir = Math.sign(this._m);
		var intDir = Math.sign(intersect.y - this._origin.y);
		if(thisDir != intDir) return null;
		
		//make sure intersect distance is within the ray's specified length
		var thisDist = intersect.distance(this._origin);
		if(thisDist > this.length) return null;
		
		//make sure intersect distance is within the other ray's specified length
		var otherDist = intersect.distance(otherRay._origin);
		if(otherDist > otherRay.length) return null;
		
		//if it passes the tests, we have a collision! :D
		return intersect;
	}
	
	polygonCollision(poly){
		if(!poly.getBoundingBox().testIntersect(this))
			return [];
		var cols = [];
		for(var i = 0; i < poly.getEdgeRays().length; i += 1){
			var col = this.intersection(poly._rays[i]);
			if(col != null)
				cols.push(new rayCollision(col, this, poly._rays[i], poly, i));
		}
		return cols;
	}
	rayCast(polygonList){
		var cols = [];
		for(var pol = 0; pol < polygonList.length; pol += 1){
			cols = cols.concat(this.polygonCollision(polygonList[pol]));
		}
		return cols;
	}
	
	draw(ctx, color = "#f00", width = 1){
		ctx.strokeStyle = color;
		
		ctx.lineWidth = width * 2;
		ctx.beginPath();
		ctx.moveTo(this.getPosition().x, this.getPosition().y);
		var end = this.getPosition().plus(vec2.fromAng(this.getAngle(), this.length / 4));
		ctx.lineTo(end.x, end.y);
		ctx.stroke();
		
		ctx.lineWidth = width;
		ctx.beginPath();
		ctx.moveTo(this.getPosition().x, this.getPosition().y);
		var end = this.getEndPosition();
		ctx.lineTo(end.x, end.y);
		ctx.stroke();
	}
	
	static addPolygonRays(poly){
		//calculates the specified polygon's _rays from it's vertices
		var absVerts = poly.getAbsoluteVertices();
		poly._rays = [];
		for(var i = 0; i < absVerts.length; i += 1){
			var i2 = i + 1;
			if(i2 >= absVerts.length)
				i2 = 0;
			
			poly._rays.push(ray.fromPoints(absVerts[i], absVerts[i2]));
		}
	}
	static rayData(m, b, length = Infinity){
		var r	= new ray();
		r._angle = null;
		r._m = m;
		r._b = b;
		r.length = length;
		r._origin = new vec2();
		return r;
	}
	static fromPoints(start, end){
		var ang = end.minus(start).direction();
		var length = end.distance(start);
		var r = new ray(start, ang, length);
		return r;
	}
}
class rayCollision{
	constructor(collisionPoint, rayCasted = null, rayTarget = null, polyTarget = null, vertIndex = null){
		this.polygonTarget = polyTarget;
		this.rayCasted = rayCasted;
		this.rayTarget = rayTarget;
		this.intersection = collisionPoint;
		this.vertexIndex = vertIndex;
	}
}

function wrapValue(value, max){
	if(value < 0)
		return max + (value % max);
	if(value >= max)
		return value % max;
	return value;
}