# Javascript-Dynamic-Loading-and-Version-Control
Manage dynamic loading of dependent JavaScript files and functions with automatic versioning

This project allows specifying a single js file and have all dependent js files dynamically loaded. The dynamically loaded files will be given a filename which has been appended with its timestamp. An .htaccess rule will filters out the timestamp.

Methodology:

Within each .js file, I specify the list of dependent files with the associated created class object (ns) so I know when the dependent file has been loaded.

For example, my.js may have the following declarations:

    var dependants = [
        {file: "custom-dialog.min.js", ns: "CustomDialog"},
        {file: function miscFn1(){doSomethingOnLoad()}, dependencies: [{file: function onload(){}}, {file: "dragdrop.min.js", ns: "DragDrop"}]}
    ]
    sourceFiles.add(dependencies);
    sourceFiles.load();

Note: All declarations listed in a .js file are for files dependent on this file. Declarations can include dependencies which must be loaded or executed first. In this example, the file dragdrop.min.js must be loaded and the window's load event must have fired before the function doSomethingOnLoad is run. But the file custom-dialog.min.js will be loaded immediately.

Within include.php, I load the single file my.js (the PHP version() function adds the file timestamp for this file).

    <script src="<?php echo version(STATIC_JS_COMMON, 'js-common/my.js') ?>"></script>

Within include.php, I specify the directories to poll on the server. The doVersionChecking() function makes an HTTP request to the server which returns all file timestamps for the specified directories (I'm happy to post this code if anyone would find this helpful).

    <script>
        sourceFiles.doVersionChecking([
            // specify url of directories to read file times for
            $ms.STATIC_JS_COMMON,
            $ms.STATIC_JS_COMMON + "/subdir"
        ]);
    </script>   

.htaccess code - to remove the timestamp from the filename

    RewriteEngine On
        #Rules for Versioned Static Files
        RewriteRule ^(js|js-common|css|css-common|img|img-common)/(.+)\.([0-9])+\.(js|css|php|jpg|gif|png)(.*)$ $1/$2.$4$5 [L]

Source Files included with this project:
  JavaScript code for dynamic loading.
  PHP code for returning the files with their associated timestamps.

Note: all STATIC_ (PHP) and $ms.STATIC_ (JS) variables contain URL paths to the files on the server. The server translates the URL paths to absolute paths in order to find the files and read the timestamps.
