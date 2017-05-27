# Javascript-Dynamic-Loading-and-Version-Control
Manage dynamic loading of dependent JavaScript files and functions with automatic versioning

**Purpose:**
This project allows specifying javascript files (or functions) to load with dependent javascript files (and functions) automatically and dynamically loading. Files are given a uniquely generated filename for browser cache version control.

**Methodology - **
Within each .js file, the list of dependent files is specified with an associated class object (namespace) which will be created. This object's existence is checked for and its existence is the verification that the dependent file has been loaded.

For example, hello.js may have the following declarations:

    var dependants = [
        {file: "custom-dialog.min.js", ns: "CustomDialog"},
        {file: function miscFn1(){doSomethingOnLoad("awesome!")}, 
            dependencies: [
                {file: function onload(){}}, 
                {file: "dragdrop.min.js", ns: "DragDrop"}
            ]
        }
    ]
    sourceFiles.add(dependants);
    sourceFiles.load();

Declarations listed are for files dependent on this file and / or functions that this file will use later. Declarations can include dependencies which must be loaded or executed first. In this example, the file dragdrop.min.js must be loaded and the window's load event must have fired before the function doSomethingOnLoad is run. The file dragdrop.min.js will be loaded immediately.

**demo.php (the main php file)**
1) Load the javascript common library (mseifert-sourcefiles.js)
2) Load a javascript file - e.g. hello.js
The PHP version() function adds the file timestamp to this file.

    <script src="<?php echo version(STATIC_JS_COMMON, 'hello.js') ?>"></script>

3) Specify the directories to poll on the server. 
The doVersionChecking() function makes an HTTP request to the server.
moddate.php is called and returns all file timestamps for the specified directories.

    <script>
        sourceFiles.doVersionChecking([
            // specify url of directories to read modification timestamps for
            $ms.STATIC_JS_COMMON
        ]);
    </script>   

**.htaccess**
    Removes the timestamp from the filename

    RewriteEngine On
        #Rules for Versioned Static Files
        RewriteRule ^(js|js-common|css|css-common|img|img-common)/(.+)\.([0-9])+\.(js|css|php|jpg|gif|png)(.*)$ $1/$2.$4$5 [L]

**paths.php**
    Contains the PHP constants and JS variables which contain URL and absolute paths to the files on the server.
    The server translates the URL paths to absolute paths in order to find the files and read the timestamps. 
    See paths.php for further info.
    Also contains common php functions including error checking code.

**moddate.php**
    Called by javascript requesting file information
    It returns timestamp information for the files in directories specified

**The Namespace**
    This project uses the com.mseifert namespace. In addition to this namespace, two global variables are used as shortcuts:
    $msRoot = com.mseifert
    $ms = $msRoot.common
