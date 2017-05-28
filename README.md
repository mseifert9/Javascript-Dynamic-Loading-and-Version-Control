## Dynamic Loading of Javascript files and function with Version Control

**Purpose:**
To dynamically load javascript files (and functions) based on listed dependencies while also generating unique filenames for browser cache version control.

**Methodology:**
Within each .js file, a list of dependent files is specified. Each file is listed with an associated object name which will be used as verification that the dependent file has been loaded.

For example, hello.js may have the following dependant declarations:

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

Declarations listed are for files dependent on this file and / or functions that this file will use later. Declarations can include dependencies which must be loaded or executed first. In this example, when the file hello.js is loaded, the above declaration will automatically load the file bar.js. In addition, it will also preload the image file star-18.png when the window's load event is fired.

## Files in the project

**demo.php (the main php file)**

- Loads the javascript common library (mseifert-sourcefiles.js)
- Loads the javascript demo file hello.js with timestamp information added to the filename.

Version checking is turned with a simple call, passing the directories to be polled on the server

    <script>
        sourceFiles.doVersionChecking([
            // specify url of directories to read modification timestamps for
            $ms.STATIC_JS_COMMON
        ]);
    </script>   

**.htaccess:**
    Removes the timestamp from the filename

    RewriteEngine On
        #Rules for Versioned Static Files
        RewriteRule ^(js|js-common|css|css-common|img|img-common)/(.+)\.([0-9])+\.(js|css|php|jpg|gif|png)(.*)$ $1/$2.$4$5 [L]

**common.php:**
    Contains the PHP constants and JS variables which contain URL and absolute paths to the files on the server.
    The server translates the URL paths to absolute paths in order to find the files and read the timestamps. 
    See common.php for further info.
    Also contains common php functions including error checking code.

**moddate.php:**
    Called by javascript requesting file information
    It returns timestamp information for the files in directories specified

**mseifert-sourcefiles.js**
    The javascript project library. This file contains the common namespace functions as well as including the sourceFiles object which contains the functions that manage the queue and versioning.

**hello.js**
    A sample javascript file which creates the user interface and loads depandant files (javascript and image).

**bar.js**
    A sample javascript file to demonstrate dynamic loading using a dependency declaration.
    
**star-18.img**
    An image file to demonstrate dynamic loading of an image (used to prelaod images for performance and user experience).
    
## The Namespace
This project uses the com.mseifert javascript namespace. In addition to the namespace, two global variables are used as shortcuts:
    
    $msRoot = com.mseifert
    $ms = $msRoot.common

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
