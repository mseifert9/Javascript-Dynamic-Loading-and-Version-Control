# Dynamic JavaScript Loader
## Dynamic Loading of Javascript files and function with Version Control

This library will dynamically load javascript files (and functions), css, and images based on listed dependencies while also generating unique filenames for browser cache version control.

## Overview
Javascript code is often dependent on the existence of existing classes, functions, and elements, especially `document.body`. Because it is difficult to guarantee the order of loading of javascript, there needs to be a way to sequence dependencies. Instead of loading all javascript files up front (which also slows down load times), most files can be loaded dynamically and in the correct order from within javascript code.

## Implementation for Dynamic Loading
There are two basic ways to determine the necessary order of loading files
1) dependants: files and functions are loaded after a file loads. For example,
    1) the DragDrop class may have two supporting classes, Draggable and Droppable. If we load DragDrop, we want to automatically load Draggable and Droppable. Therefore, within the dragdrop.js class file, we specify a rule which auto loads the two other classes.    
2) dependencies: files are loaded and functions are run only after a condition is met. For example,
    1) a file with an existing object has been loaded. e.g. The `function foo()` must exist before the file `bar.js` is loaded.
    2) some custom condition has been met. e.g. `document.body` must be loaded before the `function sayHello()` is executed.

The first method (dependants) is accomplished by listing within each .js file, a list of dependent files. Each file is listed with an associated object name which will be used as verification that the dependent file has been loaded. This list is passed as an array of objects with the following properties:
```
	file:	name of file or function to load		
	ns:	name of the object whose existence will verify that the file has been loaded
	dir:	optional directory for the file (defaults to js - or whatever is specified in the path variable $ms.STATIC_JS_COMMON)
	subDir:  optional sub-directory under one of the path variables
```
For example, in my `dragdrop.js` file, I have the following:
```
    var dependants = [
	{file: "draggable.min.js", ns: "Draggable"},
	{file: "droppable.min.js", ns: "Droppable"},
    ]
    $ms.sourceFiles.add(dependants);
    $ms.sourceFiles.load();
```

The second method (dependencies) is accomplished by listing the dependencies in a file other than the one being loaded. Dependencies are 

For example, in the demo, `hello.js` the following dependant declarations are specified:
```
    /*  
     *  this file has two dependants which will be automatically queued for loading
     *      1. /js/foo/bar.js - which supplies $ms.FooBar.secretMessage()
     *      2. /img/star-18.png - which requires the document 'load' event to fire before the image is appended to the docuement
     */

    $ms.sourceFiles.add([
        {file: "bar.js", ns: "FooBar", subDir: "foo"},
        // preload image
	{file: "star-18.png", dependencies:[{file: $ms.sourceFiles.onloadTest}]}
    ]);
    $ms.sourceFiles.load();
```
A second example shows the pre-loading of an image file.
```
    {file: "map-hue.png", baseDir: "js", subDir: "colorpicker/img", id: "cp-map-hue-png", dependencies: [{file: $ms.sourceFiles.onloadTest}]}
```

NOTE: Special function which can be specified for the `file` property :
```
	$ms.sourceFiles.onloadTest	Tests for document.body being loaded
```

## Implementation for File Versioning
A common solution for maintaining javascript file versions is to dynamically append javascript filenames with a timestamp. If a file is modified, its timestamp changes and therefore the filename changes, refreshing browser caches with the new version. The `php` `filemtime()` function is used for this purpose and in this library, it is wrapped in the php fucntion `version()`. An `.htaccess`   `RewriteRule` is used to strip out the timestamps from the filenames. For example, the file `mseifert.js` can be read with a timestamp using:
```
	<script src="<?php echo version(STATIC_JS_COMMON, "/mseifert.js") ?>"></script>
```
However, when javascript files are loaded dynamically, we are running on the local machine and have lost the ability to directly use php for timestamp information. This library overcomes that limitation by calling `moddate.php` with the initializing of file versioning:



## Files in the project
### demo.php (the main php file)
- Loads the javascript common library (mseifert-sourcefiles.js)
- Loads the javascript demo file hello.js with timestamp information added to the filename.

Version checking is turned with a simple call, passing the directories to be polled on the server

    <script>
        sourceFiles.doVersionChecking([
            // specify url of directories to read modification timestamps for
            $ms.STATIC_JS_COMMON
        ]);
    </script>   

### .htaccess
Removes the timestamp from the filename
```
    RewriteEngine On
        #Rules for Versioned Static Files
        RewriteRule ^(js|js-common|css|css-common|img|img-common)/(.+)\.([0-9])+\.(js|css|php|jpg|gif|png)(.*)$ $1/$2.$4$5 [L]
```
### common.php
-- Contains the PHP constants and JS variables which contain URL and absolute paths to the files on the server.
-- The server translates the URL paths to absolute paths in order to find the files and read the timestamps. 
-- This file must be loaded BEFORE any others in this project. See common.php for further info.
-- Also contains common php functions including error checking code.

### moddate.php
-- Called by javascript requesting file information for dynamically loaded files.
-- Returns timestamp information for the files in directories specified

### mseifert-sourcefiles.js
-- The javascript project library. 
-- This file contains the common namespace functions as well as including the sourceFiles object which contains the functions that manage the queue and versioning.
-- This file must be loaded BEFORE any calls to the `sourcefile` functions.

### hello.js
A sample javascript file which creates the user interface and loads depandant files (javascript and image).

### bar.js
A sample javascript file to demonstrate dynamic loading using a dependency declaration.
    
### star-18.img
An image file to demonstrate dynamic loading of an image (used to prelaod images for performance and user experience).
    
## The Namespace
This project uses the com.mseifert javascript namespace. In addition to the namespace, two global variables are used as shortcuts:
``` 
    $msRoot = com.mseifert
    $ms = $msRoot.common
```
These variables are defined first in `common.php` so that the path variables are immediately available. These variable are defined again  in mseifert-sourcefiles.js. This second definition will keep existing properties and add to them using the nifty `getChildClasses` function.

## The Path Variables
`common.php` contains the definitions for path variables.
```
    /* 
     * javascript: URL paths must be defined
     * php: URL and absolute (FULL) paths must be defined
     * LINK_ paths are the urls for the cookie enabled domains - e.g. http://design.mseifert.com/demo
     * STATIC_ paths are the urls for the cookieless domains (can be the same as LINK_ if there is not a separate cookieless domain) - 
     *    e.g. http://staticdesign.mseifert.com/demo
     * FULL_ paths are the absolute paths which correspond to the urls - e.g. "/home/yourid/public_html/design/demo"
     * FULL_TOP_ROOT and STATIC_TOP_ROOT are the root of the Server in the domain tree (absolute and url respectively)
     * FULL_SITE_ROOT and STATIC_SITE_ROOT are the root of the Site (domain).
     *	  if there is only one domain on the server, 
     *	  SITE_ROOT and TOP_ROOT paths will be the same
     *	  having both SITE_ROOT and TOP_ROOT defined allows pulling files from anywhere on the server for any of its site
     *	  in other words, it allows different sites to share images, js, and css resources
     * STATIC_IMG_COMMON, STATIC_CSS_COMMON, STATIC_JS_COMMON are default url subdirectories - e.g. http://static-design/demo/img
     * 	  FULL_IMG_COMMON, FULL_CSS_COMMON, FULL_JS_COMMON are the absolute equivalents
     * if root paths are left blank and only sub directories are specified for STATIC_JS_COMMON, STATIC_CSS_COMMON, STATIC_IMG_COMMON
     *	  the current directory will be used as the relative root for all paths. This is the default.
     */
<?php     
    define("LINK_TOP_ROOT", "");
    define("LINK_SITE_ROOT", "");
    define("STATIC_TOP_ROOT", "");
    define("STATIC_SITE_ROOT", "");
    define("STATIC_IMG_COMMON", "img");
    define("STATIC_JS_COMMON", "js");
    define("STATIC_CSS_COMMON", "css");
    define("FULL_TOP_ROOT", "");
    define("FULL_SITE_ROOT", "");
    define("FULL_IMG_COMMON", "");
    define("FULL_JS_COMMON", "");
    define("FULL_CSS_COMMON", "");
?>
<script>
    // create the namespace
    var com = com || {};
    com.mseifert = com.mseifert || {common: {}};
    $msRoot = com.mseifert;
    $ms = $msRoot.common;
    // define url paths for javascript
    $ms.LINK_TOP_ROOT = "";
    $ms.LINK_SITE_ROOT = "";
    $ms.STATIC_TOP_ROOT = "";
    $ms.STATIC_SITE_ROOT = "";
    $ms.STATIC_IMG_COMMON = "img";
    $ms.STATIC_JS_COMMON = "js";
    $ms.STATIC_CSS_COMMON = "css";
</script>
```
## Working Demo
A live working demo of this library can be found at http://design.mseifert.com/demo-sourcefile/demo.php
It is very basic and shows the two basic work flows described above: dependants and dependencies.

The demo consists of dynamically loading the function **$ms.Hello.sayHello("Click Me")** which displays the label "Click Me." 
This function has the two dependencies:
- hello.js must be loaded first
- the document load event must fire first

hello.js loads two dependant files, 
- **star-18.png** - demonstrating preloading of images
- **/foo/bar.js** - demonstrating loading depandant js files and also custom directories

Clicking on the "Click Me" label will access functions from **/foo/bar.js** and use the loaded image **star-18.png**.

The path variables in **common.php** can be left blank and the project will use the default subdirectories of js, css, and img relative to the installation. To modify this project for your own purposes, see **common.php** for customizing the paths.
