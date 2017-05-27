<?php
    // define paths for php - need both url and absolute paths for each location
    define("STATIC_TOP_ROOT", "http://static-mseifert/demo");
    define("STATIC_IMG_COMMON", "http://static-mseifert/demo/img-common");
    define("STATIC_JS_COMMON", "http://static-mseifert/demo/js-common");
    define("STATIC_CSS_COMMON", "http://static-mseifert/demo/css-common");
    define("FULL_TOP_ROOT", "D:/Website/mseifert/demo");
    define("FULL_IMG_COMMON", "D:/Website/mseifert/demo/img-common");
    define("FULL_JS_COMMON", "D:/Website/mseifert/demo/js-common");
    define("FULL_CSS_COMMON", "D:/Website/mseifert/demo/css-common");
?>
<script>
    // define url paths for javascript
	$ms.STATIC_TOP_ROOT = "http://static-mseifert/demo";
	$ms.STATIC_IMG_COMMON = "http://static-mseifert/demo/img-common";
	$ms.STATIC_JS_COMMON = "http://static-mseifert/demo/js-common";
	$ms.STATIC_CSS_COMMON = "http://static-mseifert/demo/css-common";
</script>

<!-- Load the javascript library which creates the namespace and has shared functions-->
<script src="<?php echo version(STATIC_JS_COMMON, '/mseifert-sourcefiles.js') ?>"></script>

<script>
$ms.sourceFiles.doVersionChecking([
	// check file times to manage js file versions for dynamically loaded files (files not explicitly loaded below)
	// specify url of directories to read file times for
	$ms.STATIC_JS_COMMON
]);

/*  dynamically load a javascript file and execute a js function 
    the function sayHello() contained in hello.js will be called once the following two dependencies are met:
    1) the document is loaded
    2) hello.js is loaded (which will happen automatically)
    
    in addition hello.js won't load until a dependency defined within it is loaded
*/    
$ms.sourceFiles.add([
	{file: function doSomething(){sayHello(Date.now())}, dependencies: [{file: function onload(){}}, {file: "hello.js", ns: "Hello"}]}
]);
$ms.sourceFiles.load();
</script>
