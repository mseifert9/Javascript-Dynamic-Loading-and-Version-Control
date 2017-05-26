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
		{file: new Function("return function versionChecking" + sourceFiles.versionCheck.length + "(){sourceFiles.versionChecking(" + JSON.stringify(path) + ")}")()}
	    ];
	    sourceFiles.add(dependencies);
	    sourceFiles.load();
	},
	add: function(source){
	    if (!Array.isArray(source)){
		source = [source];
	    }
	    for (var i = 0; i < source.length; i++){
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
		    var baseFile = source[i].file.substr(source[i].file.lastIndexOf("/") + 1);
		    var split = baseFile.split("?");
		    baseFile = split[0];
		    source[i].baseFile = baseFile
		    var ext = baseFile.substr(baseFile.lastIndexOf(".") + 1);
		    if (ext == "js"){
			source[i].type = "js";
		    } else if (ext == "css"){
			source[i].type = "css";
		    } else if (ext == "php"){
			if (baseFile.indexOf("css.php") !== -1){
			    source[i].type = "css";
			} else {
			    source[i].type = "php";
			}
		    } else if (["jpg", "png", "gif"].indexOf(ext) !== -1){
			source[i].type = "img";
		    } else {
			source[i].type = "unknown";
			console.log("Source File unknown type for: " + source[i].file);
		    }
		    
		    var dir = sourceFiles.buildUrl();
		    
		    var subDir = "";
		    if (source[i].file.indexOf("/") !== -1) {
			// full directory explicitly set
		    } else if (typeof source[i].subDir !== "undefined"){
			// relative to specified or default subDir
			subDir = "/" + source[i].subDir;			
		    }
		    source[i].file = dir + subDir + "/" + source[i].file;
		    source[i].loaded = false;
		}
		// test if file already added to load queue
		if (sourceFiles.queued.indexOf(source[i].baseFile) !== -1) continue;
		
		if (source[i].dependencies){
		    for (var j = 0; j < source[i].dependencies.length; j++){
			// queue the dependencies
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
	    var url = $ms.LINK_SITE_ROOT + "/moddate.php";
	    var data = {path: path};
	    data = JSON.stringify(data);
	    var http = new XMLHttpRequest();
	    var params = "id=moddate-js&url=" + url + "&otherData=" + data;
	    http.open("POST", url, true);

	    //Send the proper header information along with the request
	    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	    http.onreadystatechange = function() {//Call a function when the state changes.
		if(http.readyState == 4 && http.status == 200) {
		    //alert(http.responseText);
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
	buildUrl: function(dir){
	    if (typeof dir == "undefined" || dir == "js-common"){
		// default = js-common
		if (typeof $ms.STATIC_JS_COMMON !== "undefined"){
		    return $ms.STATIC_JS_COMMON;
		}
		return sourceFiles.currentDir() + "/js-common";		
	    } else if (dir == "css-common"){
		if (typeof $ms.STATIC_CSS_COMMON !== "undefined"){
		    return $ms.STATIC_CSS_COMMON;
		}
		return sourceFiles.currentDir() + "/css-common";		
	    } else if (dir == "img-common"){
		if (typeof $ms.STATIC_IMG_COMMON !== "undefined"){
		    return $ms.STATIC_IMG_COMMON;
		}
		return sourceFiles.currentDir() + "/img-common";
	    } else if (dir == "root"){
		if (typeof $ms.STATIC_TOP_ROOT !== "undefined"){
		    return $ms.STATIC_TOP_ROOT;
		}
		return sourceFiles.currentDir();
	    } else {
		console.log("sourceFiles => Invalid dir specified: " + dir);
		return "";
	    }
	},
	currentDir: function(){
	    return window.location.origin ? window.location.origin + '/' : window.location.protocol + '/' + window.location.host;
	},
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
