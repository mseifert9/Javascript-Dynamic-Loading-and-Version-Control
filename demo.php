$ms.sourceFiles.doVersionChecking([
	// check file times to manage js file versions for dynamically loaded files (files not explicitly loaded below)
	// specify url of directories to read file times for
	$ms.STATIC_JS_COMMON
]);

$ms.sourceFiles.add([
	{file: function doSomething(){sayHello(Date.now())}, dependencies: [{file: function onload(){}}, {file: "hello.js", ns: "Hello"}]}
]);
$ms.sourceFiles.load();
