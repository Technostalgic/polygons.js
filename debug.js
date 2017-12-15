function timeFunc(func){
	var tn = performance.now();
	func();
	console.log("method completed in: " + (performance.now() - tn).toString() + "ms");
}