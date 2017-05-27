/*
 * 
 * put all classes in com.mseifert name space
 * two alias in the public space are used:
 *	$msRoot => com.mseifert
 *	$ms	=> com.mseifert.common
 */
var com = com || {};
$msRoot = com.mseifert = function () {
    var topLevelDomain = "com";
    var namespace = "mseifert";
    
    function createNS(newSpace) {
	var parts = newSpace.split('.'),
		parent = this;
	if (parts.length >= 2 && parts[0] == topLevelDomain && parts[1] == namespace) {
	    // passed as com.mseifert....
	    parts = parts.slice(2);
	}
	for (var i = 0, length = parts.length; i < length; i++) {
	    parent[parts[i]] = parent[parts[i]] || {};
	    parent = parent[parts[i]];
	}
	return parent;
    }
    function getChildClasses(obj, className) {
	// combine an existing class with a newly created one
	// used when a parent class has child classes which get created before the parent
	// or when a class is split across multiple files
	if (typeof className == "undefined"){
	    var ns;
	    if (typeof $msRoot !== "undefined"){
		ns = $msRoot;
	    }
	} else {
	    ns = $msRoot[className];
	}
	if (ns) {
	    for (var prop in ns) {
		if (ns.hasOwnProperty(prop)) {
		    // add child class to the obj
		    obj[prop] = ns[prop];
		}
	    }
	}
    }

    var msRoot =  {
	    createNS: createNS,
	    getChildClasses: getChildClasses
	}
    getChildClasses(msRoot);
    return msRoot;    
}();

$ms = $msRoot.common = function () {
    // manage dynamic loading of source files (js, css, img) and js functions
    var sourceFiles = {
	queued: [],
	loading: [],
	source: [],
	fileInfo: [],
	versionCheck: [],	// array of version check requests
	versionCheckPaths: [],	    // list of paths checked with version checking
	doVersionChecking: function(path){
	    // set function sourceFiles.versionChecking as a dependency
	    // file times will be retrieved from server before any dependent js files
	    // each js file will have file time added to the name to mangage file versions
	    // .htaccess removes the file version from the file name	    
	    var dependencies = [
		// all functions must have a unique name - create one on the fly
		{file: new Function("return function versionChecking" + sourceFiles.versionCheck.length + "(){$ms.sourceFiles.versionChecking(" + JSON.stringify(path) + ")}")()}
	    ];
	    sourceFiles.add(dependencies);
	    sourceFiles.load();
	},
	add: function(source){
	    if (!Array.isArray(source)){
		source = [source];
	    }
	    for (var i = 0; i < source.length; i++){
		// passed properties of source:
		// baseDir	base directory flag
		//		js = common js directory
		//		css = common css directory
		//		img = common img directory
		//		root = root server directory
		//		site = root site directory
		//		empty = use extension to determine common directory
		// subDir	directory under the base directory
		// file		file name without path and with optional passed parameters - full path will be added to the property
		//		OR function
		// dependencies	object containing source files - has same properties as source and will add recursively
		
		// additional propterties set internally
		// baseFile	file name stripped of passed parameters (calculated from file)
		//		OR function name
		// type		type of file (js, css, img)
		// loaded	flag that file has been loaded
		
		// test if namespace specified and if already exists
		if (sourceFiles.alreadyLoadedNs(source[i].ns)) continue;
		
		if (typeof source[i].file == "function"){
		    var funcName = sourceFiles.functionName(source[i].file);
		    source[i].baseFile = funcName;
		    source[i].loaded = false;
		    source[i].type = "function";
		    if (funcName == "onload"){
			if (document.readyState === "complete" || document.readyState === "interactive"){
			    // condition already satisfied
			    sourceFiles.onload({target: {src: sourceFiles.source[i].baseFile}});
			} else {
			    window.addEventListener("load", sourceFiles.load);
			}
		    }
		} else {
		    source[i].baseFile = source[i].file.split("?")[0];
		    var ext = source[i].baseFile.substr(source[i].baseFile.lastIndexOf(".") + 1);
		    if (ext == "js"){
			source[i].type = "js";
		    } else if (ext == "css"){
			source[i].type = "css";
		    } else if (ext == "php"){
			if (source[i].baseFile.indexOf("css.php") !== -1){
			    // css files which are being processed via php (so can pass variables)
			    source[i].type = "css";
			} else {
			    source[i].type = "unknown";
			    console.log("Don't know what to do with source file type `php`: " + source[i].file);
			}
		    } else if (["jpg", "png", "gif"].indexOf(ext) !== -1){
			source[i].type = "img";
		    } else {
			source[i].type = "unknown";
			console.log("Source File unknown type for: " + source[i].file);
		    }
		    var dir = sourceFiles.buildUrlPath(source[i].baseDir, source[i].type);		    
		    var subDir = "";
		    if (typeof source[i].subDir !== "undefined"){
			// add preceeding forward slash if not already there
			subDir = (source[i].subDir.indexOf("/") !== 0 ? "/" : "") + source[i].subDir;
		    }
		    // add the full path to the file
		    source[i].file = dir + subDir + "/" + source[i].file;
		    source[i].loaded = false;
		}
		// test if file already added to load queue
		if (sourceFiles.queued.indexOf(source[i].baseFile) !== -1) continue;
		
		if (source[i].dependencies){
		    for (var j = 0; j < source[i].dependencies.length; j++){
			// recursively add the dependencies
			sourceFiles.add(source[i].dependencies[j]);
		    }
		} else {
		    source[i].dependencies = [];
		}
		// add to queue to be loaded
		// flag file is queued for loading
		sourceFiles.queued.push(source[i].baseFile);
		    
		sourceFiles.source.push(source[i]);
	    }
	},
	load: function(){
	    var versionCheckLength = sourceFiles.versionCheck.length;
	    for (var i = 0; i < sourceFiles.versionCheck.length; i++){
		if (sourceFiles.versionCheck[i].timeStamp > 0 && !sourceFiles.versionCheck[i].complete){
		    // if the response from the server not yet received - set interval to wait for it
		    if (typeof sourceFiles.versionCheck[i].interval !== "undefined"){
			// interval already running
			return;
		    }
		    sourceFiles.versionCheck[i].interval = setInterval(function(){
			if (sourceFiles.versionCheck[i].complete || Date.now() - sourceFiles.versionCheck[i].timeStamp >= sourceFiles.versionCheckingTimeout){
			    clearInterval(sourceFiles.versionCheck[i].interval);
			    if (!sourceFiles.versionCheck[i].complete){
				console.log("Timeout checking js version (" + i + ")");
			    }
			    sourceFiles.versionCheck[i].complete = true;
			    sourceFiles.load();
			}
		    }, 10);
		    return;
		}
	    }
	    for (var i = 0; i < sourceFiles.source.length; i++){
		if (versionCheckLength !== sourceFiles.versionCheck.length){
		    // if version checking has been added - start over
		    sourceFiles.load();
		    return;
		}
		// remove dependencies that are already loaded
		sourceFiles.removeDependencies(sourceFiles.source[i]);
		// load all files with no dependencies
		if (sourceFiles.source[i].dependencies.length == 0){
		    if (sourceFiles.source[i].loaded) {
			// file already loaded
			continue;
		    } else if (typeof sourceFiles.source[i].file == "function"){
			// function - execute the function
			var funcName = sourceFiles.functionName(sourceFiles.source[i].file);
			if (funcName == "onload"){
			    // special function that has no body
			    var result = (document.readyState === "complete" || document.readyState === "interactive");
			} else {
			    var result = sourceFiles.source[i].file();
			}
			if (result !== false){
			    sourceFiles.source[i].loaded = true;
			    sourceFiles.onLoad({target: {src: sourceFiles.source[i].baseFile}});
			}
			continue;
		    }
		    // test if namespace specified and if already exists
		    if (sourceFiles.alreadyLoadedNs(sourceFiles.source[i].ns)) continue;
		    if (sourceFiles.loading.indexOf(sourceFiles.source[i].baseFile) !== -1) continue;
		    
		    var version = "";
		    if (sourceFiles.fileInfo.find(function(fileInfo){
			if (fileInfo.baseFile == sourceFiles.source[i].baseFile){
			    version = '.' + fileInfo.time + '.';
			    return true;
			}
			})) {
			// keep baseFile the same - change the full filename with version
			// replaces my.file.js with my.file.123456.js where 123456 is the file timestamp
			sourceFiles.source[i].file = sourceFiles.source[i].file.replace(/\.(?!.*?\.)/, version);
		    }
		    // flag loading file
		    sourceFiles.loading.push(sourceFiles.source[i].baseFile);

		    // file - load the source file
		    loadSourceFile(sourceFiles.source[i].file, sourceFiles.source[i].type, sourceFiles.onLoad)
		}
	    }
	},
	alreadyLoadedNs: function(ns){
	    // test if namespace specified and if already exists
	    if (typeof ns == "undefined") return false;
	    var exists = true;
	    var path = ns.split(".");
	    for (var j = 0; j < path.length; j++){
		if (typeof $msRoot[path[j]] == "undefined"){
		    // namespace not yet created
		    return false;
		}
	    }
	    // namespace exists
	    return true;
	},
	onLoad: function(e){
	    // flag file as loaded
	    var baseFile = e.target.src.substr(e.target.src.lastIndexOf("/") + 1);
	    var split = baseFile.split("?");
	    baseFile = split[0];
	    // remove the version timestamp from the filename
	    baseFile = baseFile.replace(/(.+)\.([0-9])+\.(js|css|php|jpg|gif|png)$/, "$1.$3");
	    for (var i = 0; i < sourceFiles.source.length; i++){
		if (sourceFiles.source[i].baseFile == baseFile){
		    sourceFiles.source[i].loaded = true;
		    if (sourceFiles.source[i].onLoad){
			// custom onLoad
			sourceFiles.source[i].onLoad();
		    }
		    break;
		}
	    }
	    sourceFiles.load();
	},
	removeDependencies: function(source){
	    if (!source.loaded){
		for (var j = source.dependencies.length - 1; j >=0; j--){
		    // test if namespace specified and if already exists
		    if (typeof source.dependencies[j].ns !== "undefined" && sourceFiles.alreadyLoadedNs(source.dependencies[j].ns)){
			// loaded - remove the dependencey
			source.dependencies.splice(j, 1);
			continue;
		    }
		    for (var k = 0; k < sourceFiles.source.length; k++){
			var source2 = sourceFiles.source[k];
			if (source2.baseFile == source.dependencies[j].baseFile){
			    // found the dependency
			    if (source2.loaded){
				// loaded - remove the dependencey
				source.dependencies.splice(j, 1);
			    }
			    break;
			}
		    }
		}
	    }
	},
	versionChecking: function(path){
	    // poll server for file times for specified directories
	    if (!Array.isArray(path)){
		path = [path];
	    }
	    sourceFiles.versionCheck.push({});	    
	    var versionCheck = sourceFiles.versionCheck[sourceFiles.versionCheck.length - 1]	    
	    versionCheck.id = sourceFiles.versionCheck.length;
	    versionCheck.timeStamp = Date.now();
	    versionCheck.complete = false
	    versionCheck.path = path;
	    var url = sourceFiles.buildUrlPath("site") + "/moddate.php";
	    var data = {path: path};
	    data = JSON.stringify(data);
	    var http = new XMLHttpRequest();
	    var params = "id=moddate-js&url=" + url + "&otherData=" + data;
	    http.open("POST", url, true);

	    //Send the proper header information along with the request
	    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	    http.onreadystatechange = function() {//Call a function when the state changes.
v("state: " + http.readyState, "status: " + http.status, "Text: " + http.responseText);
		if(http.readyState == 4 && http.status == 200) {
		    var response = http.responseText;
		    var data = JSON.parse(response);
		    var error = false;
		    if (typeof data !== "object" || !data.status){
			console.log("Invalid version checking response: " + response);
			error = true;
		    } else if (data.status.toLowerCase().indexOf("error") !== -1){
			console.log(data.status);
			error = true;
		    } else if (data.status.toLowerCase().indexOf("success") == -1){
			console.log("Unknown response (missing success): " + response);
			error = true;
		    }
		    if (!error){
			console.log("Version information loaded");
			sourceFiles.fileInfo = sourceFiles.fileInfo.concat(data.result);
		    }
		    // if there was an error, will load files without version info
		    versionCheck.complete = true;
		    sourceFiles.load();
		}
	    }
	    http.send(params);
	},
	functionName: function(func){
	    // ^function	starts with the function keyword
	    // \s+		any number of spaces
	    // (?:bound\s*)	non capturing group - optionally match the word bound with any number of trailing spaces
	    // ([^\(\s]+)	capture one or more character not in the set => left parenthesis, white space
	    //			anoymous functions will return null
	    //			bound functions will return the function name without the keyword bound
	    //			an anonymous bound function will return the function name `bound`
	    if (typeof func == "function"){
		func = func.toString();
	    }
	    var result = /^function\s+(?:bound\s*)?([^\(\s]+)/.exec(func);
	    return result ? result[1] : "";
	},
	buildUrlPath: function(baseDir, type){
	    baseDir = baseDir || type || "";
	    var urlDir = function(_baseDir){
		if (_baseDir.indexOf("/") !== -1){
		    // specified path - relative to current path
		    // to use relative to different path, use one of the flags below
		    return _baseDir;
		} else if (_baseDir.indexOf("js") !== -1){
		    return "STATIC_JS_COMMON";
		} else if (_baseDir.indexOf("css") !== -1){
		    return "STATIC_CSS_COMMON";
		} else if (_baseDir.indexOf("img") !== -1){
		    return "STATIC_IMG_COMMON";
		} else if (_baseDir.indexOf("static-site") !== -1){
		    // cookieless domain
		    return "STATIC_SITE_ROOT";
		} else if (_baseDir.indexOf("site") !== -1){
		    // cookied domain
		    return "LINK_SITE_ROOT";
		} else if (_baseDir.indexOf("root") !== -1 || _baseDir == ""){
		    // root of server at top of domain tree
		    return "STATIC_TOP_ROOT";
		} else {
		    // invalid - unless new namespace property added to match
		    return _baseDir;
		}
	    }(baseDir);
	    
	    if (typeof $ms[urlDir] !== "undefined"){
		// standard diredctory stored in namespace variable
		if ($ms[urlDir] == ""){
		    // default url is empty - use the current directory
		    return sourceFiles.currentDir();
		}
		// return defined directory
		return $ms[urlDir];
	    } else {
		// return current directlry plus whatever was passed 
		return sourceFiles.currentDir() + urlDir;
	    }
	},
	currentDir: function(){
	    var root = window.location.origin ? window.location.origin : window.location.protocol + '/' + window.location.host;
	    var pathname = window.location.pathname;
	    var path = pathname.substring(0, pathname.lastIndexOf('/'))
	    return root + path;
	}
    }

    // dynamically load a js or css file
    function loadSourceFile(filename, filetype, onloadFn) {
	if (typeof filetype == "undefined") {
	    filetype = filename.substr(filename.lastIndexOf('.') + 1)
	}
	if (filetype == "js") {
	    // load js file
	    var item = document.createElement('script');
	    item.type = "text/javascript";
	    item.src = filename;
	} else if (filetype == "css") {
	    //load CSS file
	    var item = document.createElement("link");
	    item.rel = "stylesheet";
	    item.type = "text/css";
	    item.href = filename;
	} else if (filetype == "img") {
	    // preloading images
	    var item = document.createElement("img");
	    item.style.display = "none";
	    item.src = filename;
	}
	if (typeof onloadFn !== "undefined") {
	    item.onload = onloadFn;
	    //item.onreadystatechange = runFn;
	}
	if (typeof item != "undefined") {
	    if (filetype == "img"){
		document.body.appendChild(item);
	    } else {
		document.head.appendChild(item);
	    }
	} 
    }
    var common = {
	sourceFiles: sourceFiles,
    }
    $msRoot.getChildClasses(common, "common");
    return common;
}();
	
