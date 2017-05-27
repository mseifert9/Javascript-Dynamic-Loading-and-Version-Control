$ms.sourceFiles.add([
    /*	hello.js is used for the demo.php
     *	this file has two dependants which will be automatically queued for loading
     *	    1.	/js/foo/bar.js - which supplies $ms.FooBar.secretMessage()
     *	    2.	/img/star-18.png - which requires the document 'load' event to fire before the image is appended to the docuement
     */
    {file: "bar.js", ns: "FooBar", subDir: "foo"},
    // preload image
    {file: "star-18.png", dependencies:[{file: function onload(){}}]}
]);
$ms.sourceFiles.load();


$ms.Hello = {
    sayHello: function(text){
	var label = document.createElement("label");
	document.body.appendChild(label);
	label.innerText = text;
	label.onclick = function(){
	    // $ms.FooBar.secretMessage() is from a dependent js file
	    var foobar = $ms.FooBar.secretMessage();
	    label.innerText = text + " - " + foobar;

	    if (!document.getElementById("star")){
		var img = document.createElement("img");
		img.id = "star";
		img.src = $ms.STATIC_IMG_COMMON + "/star-18.png"
		document.body.appendChild(img);
	    }
	}    
    }
}

