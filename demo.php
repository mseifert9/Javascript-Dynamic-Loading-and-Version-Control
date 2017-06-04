<?php 
    // common.php 
    //	    defines php path constants and js path variables
    //	    creates the js namespace where the paths are stored
    //	    contains basic error checking code - error.log in the demo directory will contain php errors
    include "common.php" ;
?>

<!-- Load the javascript common library which extends the namespace and adds to it shared functions-->
<script src="<?php echo version(STATIC_JS_COMMON, '/mseifert-sourcefiles.js') ?>"></script>

<script>
    // check file times to manage js file versions for dynamically loaded files (files not explicitly loaded by php)
    // specify url of directories to read file times for
    $ms.sourceFiles.doVersionChecking([
	$ms.STATIC_JS_COMMON
    ]);

    /*	dynamically load the javascript function doSomething() with the two dependencies:
     *	    1) the document is loaded
     *	    2) hello.js is loaded
     *	hello.js will be automatically queued for loading
     *	in addition, hello.js specifies to dynamically load the dependent files /js/foo/bar.js and /img/star-18.png
    */    
    $ms.sourceFiles.add([
	    {file: function doSomething(){$ms.Hello.sayHello("Click Me")}, 
		dependencies: [{file: $ms.sourceFiles.onloadTest}, {file: "hello.js", ns: "Hello"}]}
    ]);
    $ms.sourceFiles.load();
</script>
