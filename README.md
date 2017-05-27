# Javascript-Dynamic-Loading-and-Version-Control
Manage dynamic loading of dependent JavaScript files and functions with automatic versioning

**Purpose:**
To dynamically load javascript files (and functions) based on listed dependencies while also generating unique filenames for browser cache version control.

**Methodology:**
Within each .js file, a list of dependent files is specified. Each file is listed with an associated object name which will be used as verification that the dependent file has been loaded.

For example, hello.js may have the following dependant declarations:

    $ms.sourceFiles.add([
         *	this file has two dependants which will be automatically queued for loading
         *	    1.	/js/foo/bar.js - which supplies $ms.FooBar.secretMessage()
         *	    2.	/img/star-18.png - which requires the document 'load' event to fire before the image is appended to the docuement
         */
        {file: "bar.js", ns: "FooBar", subDir: "foo"},
        // preload image
        {file: "star-18.png", dependencies:[{file: function onload(){}}]}
    ]);
    $ms.sourceFiles.load();

Declarations listed are for files dependent on this file and / or functions that this file will use later. Declarations can include dependencies which must be loaded or executed first. In this example, when the file hello.js is loaded, the above declaration will automatically load the file bar.js. In addition, it will also preload the image file star-18.png when the window's load event is fired.

<b>Files in the project</b>

<b>demo.php (the main php file)</b>

- Loads the javascript common library (mseifert-sourcefiles.js)
- Loads the javascript file hello.js
The PHP version() function adds the file timestamp to hello.js.
_

    <script src="<?php echo version(STATIC_JS_COMMON, 'hello.js') ?>"></script>

- Specify the directories to poll on the server. 
The doVersionChecking() function makes an HTTP request to the server.
moddate.php is called and returns all file timestamps for the specified directories.
_

    <script>
        sourceFiles.doVersionChecking([
            // specify url of directories to read modification timestamps for
            $ms.STATIC_JS_COMMON
        ]);
    </script>   

<b>.htaccess:</b>
    Removes the timestamp from the filename

    RewriteEngine On
        #Rules for Versioned Static Files
        RewriteRule ^(js|js-common|css|css-common|img|img-common)/(.+)\.([0-9])+\.(js|css|php|jpg|gif|png)(.*)$ $1/$2.$4$5 [L]

<b>common.php:</b>
    Contains the PHP constants and JS variables which contain URL and absolute paths to the files on the server.
    The server translates the URL paths to absolute paths in order to find the files and read the timestamps. 
    See common.php for further info.
    Also contains common php functions including error checking code.

<b>moddate.php:</b>
    Called by javascript requesting file information
    It returns timestamp information for the files in directories specified

<b>mseifert-sourcefiles.js</b>
    The javascript project library

<b>hello.js</b>
    A sample javascript file which is loaded with depandant conditions.

<b>bar.js</b>
    A sample javascript file to demonstrate dynamic loading using a dependency declaration.
    
<b>star-18.img</b>
    An image file to demonstrate dynamic loading of an image (used to prelaod images for performance and user experience).
    
<b>The Namespace:</b>
    This project uses the com.mseifert namespace. In addition to this namespace, two global variables are used as shortcuts:
    $msRoot = com.mseifert
    $ms = $msRoot.common
