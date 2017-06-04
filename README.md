# MS Dynamic JavaScript Loader
## Dynamic Loading of Javascript files and function with Version Control

This library will dynamically load javascript files (and functions), css, and images based on listed dependencies while also generating unique filenames for browser cache version control.

## Overview
Javascript code is often dependent on the existence of existing classes, functions, and elements, especially `document.body`. Because it is difficult to guarantee the order of loading of javascript, there needs to be a way to sequence dependencies. Instead of loading all javascript files up front (which also slows down load times), most files can be loaded dynamically and in the correct order from within javascript code.

## Implementation
There are two basic ways to determine the necessary oder of loading files
1) dependants: files and functions are loaded after a file loads. For example,
    1) the DragDrop class may have two supporting classes, Draggable and Droppable. If we load DragDrop, we want to automatically load Draggable and Droppable. Therefore, within the dragdrop.js class file, we specify a rule which auto loads the two other classes.    
2) dependencies: files are loaded and functions are run only after a condition is met. For example,
    1) a file with an existing object has been loaded. e.g. The `function foo()` must exist before the file `bar.js` is loaded.
    2) some custom condition has been met. e.g. `document.body` must be loaded before the `function sayHello()` is executed.

The first method above is accomplished by listing within each .js file, a list of dependent files. Each file is listed with an associated object name which will be used as verification that the dependent file has been loaded. For example, in my `dragdrop.js` file, I have the following:
```
    var dependants = [
	{file: "draggable.min.js", ns: "Draggable"},
	{file: "droppable.min.js", ns: "Droppable"},
    ]
    $ms.sourceFiles.add(dependants);
    $ms.sourceFiles.load();
```

The second method above is accomplished by listing the dependencies in a file other than the one being l
```
    {file: "map-hue.png", baseDir: "js", subDir: "colorpicker/img", id: "cp-map-hue-png", dependencies: [{file: $ms.sourceFiles.onloadTest}]}
```

2) A common solution for maintaining javascript file versions is to dynamically append javascript filenames with a timestamp. If a file is modified, its timestamp changes and therefore the filename changes, refreshing browser caches with the new version. .htaccess is used to strip out the timestamps from the filenames. The filename is usually read using the `php` `filemtime()` function. However, when javascript files are loaded dynamically, we are running on the local machine and have lost the ability to directly use php for timestamp information. This library overcomes that limitation.

For example, in the demo, `hello.js` has the following dependant declarations:
```
    /*  
     *  this file has two dependants which will be automatically queued for loading
     *      1. /js/foo/bar.js - which supplies $ms.FooBar.secretMessage()
     *      2. /img/star-18.png - which requires the document 'load' event to fire before the image is appended to the docuement
     */

    $ms.sourceFiles.add([
        {file: "bar.js", ns: "FooBar", subDir: "foo"},
        // preload image
        {file: "star-18.png", dependencies:[{file: function onload(){}}]}
    ]);
    $ms.sourceFiles.load();
```
A second example shows the pre-loading of an image file.
```
    <script src="<?php echo 'http://path/to/file.' . filemtime(/path/to/file.js) . '.js') ?>"></script>
```

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
## Working Demo
A live working demo of this library can be found at http://design.mseifert.com/demo-sourcefile/demo.php
It is very basic and shows the two basic work flows:

- dependants: files and functions that are loaded after a file loads and 
- dependencies: files and functions which must be loaded for a file or function to load

dependencies: [{file: function onload(){}}, {file: "hello.js", ns: "Hello"}]

The demo consists of dynamically loading the function **$ms.Hello.sayHello("Click Me")** which displays the label "Click Me." 
This function has the two dependencies:
- hello.js must be loaded first
- the document load event must fire first

hello.js loads two dependant files, 
- **star-18.png** - showing preloading of images
- **/foo/bar.js** - demonstrating loading depandant js files and also custom directories

Clicking on the "Click Me" label will access functions from **/foo/bar.js** and use the loaded image **star-18.png**.

The path variables in **common.php** can be left blank and the project will use the default subdirectories of js, css, and img relative to the installation. To modify this project for your own purposes, see **common.php** for customizing the paths.
