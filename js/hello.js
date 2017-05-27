var dependants = [
	{file: "bar.js", ns: "FooBar", subDir: "foo"},
	// preload image
	{file: "image.png", baseDir: "js", subDir: "img"},
]
$ms.sourceFiles.add(dependants);
$ms.sourceFiles.load();


$ms.Hello = {
  sayHello: function(text){
    var label = document.createElement("label");
    document.body.appendChild(label);
  	var foobar = $ms.FooBar.secretMessage;
    label.innerText = text + " - " + foobar;
    
    var img = document.createElement("img");
    img.src = $ms.STATIC_JS_COMMON + "/img/image.png"
    document.body.appendChild(img);
  }
}

