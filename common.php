<?php
    /* define paths for php - need both url and absolute paths for each location
     * LINK_ paths are the urls for the cookie enabled domains - e.g. http://design.mseifert.com/demo
     * STATIC_ paths are the urls for the cookieless domains - e.g. http://staticdesign.mseifert.com/demo
     * FULL_ paths are the absolute paths which correspond to the urls - e.g. "/home/yourid/public_html/design/demo"
     * _TOP_ROOT is the root of the Server in the domain tree
     * _SITE_ROOT is the root of the Site (domain)
     *	    if there is only one domain on the server, 
     *	    SITE_ROOT and TOP_ROOT paths will be the same
     *	    having both SITE_ROOT and TOP_ROOT defined allows pulling files from anywhere on the server for any of its site
     *	    in other words, it allows different sites to share images, js, and css resources
     * STATIC_IMG_COMMON, STATIC_CSS_COMMON, STATIC_JS_COMMON are default url subdirectories - e.g. http://static-design/demo/img
     * 
     * if root paths are left blank and sub directories are specified for _JS_COMMON, _CSS_COMMON, _IMG_COMMON
     *	    will use the current directory as the relative root for all paths
     */
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


<?php
// php error checking
define('LOG_FILE', FULL_SITE_ROOT . '/error.log');
error_reporting(E_ALL);
ini_set('error_log', LOG_FILE);
ini_set('log_errors', true);

function logfile() {
    $dir = pathinfo(LOG_FILE, PATHINFO_DIRNAME);
    if (file_exists($dir)) {
	$logfile = LOG_FILE;
    } elseif (file_exists("." . $dir)) {
	// try one level up by adding a dot
	$logfile = "." . LOG_FILE;
    } else {
	// save in current directory 
	$logfile = pathinfo(LOG_FILE, PATHINFO_FILENAME);
    }
    return $logfile;
}

function errorlog($message) {
    try {
	$_SESSION['lastError'] = $message;
    } catch (Exception $ex) {
	
    }

    $message = PHP_EOL . "[" . date("Y-m-d H:i:s") . "] " . $_SERVER['REQUEST_URI'] . PHP_EOL . $message;
    file_put_contents(logfile(), PHP_EOL . $message . PHP_EOL, FILE_APPEND);
}

// common php functions
function version($urlpath, $url){
    $absolutepath = url2absolute($urlpath);
    // strrpos ($url, "?");
    $path = parse_url($url, PHP_URL_PATH);
    $query = parse_url($url, PHP_URL_QUERY);
    if (strlen($query) > 0){
	$query = "?" . $query;
    }
    $pathinfo = pathinfo($path);
    $ver = '.' . filemtime($absolutepath . $path) . '.';
    $dir = $pathinfo['dirname'];
    if (strlen($dir) == 1){
	// "\" or "/"
	$dir = "";
    }
    $urlpath = realurl($urlpath);
    return $urlpath . $dir . '/' . preg_replace('~.*\K\.~', $ver, $pathinfo['basename']) . $query;
}

function realurl($urlpath){
    // if url was passed as blank or a subdirectory only (js, css, img) - add the full url path
    if (strpos($urlpath, "/") !== false) {
	return $urlpath;
    }
    if ($urlpath == STATIC_JS_COMMON || $urlpath == STATIC_CSS_COMMON || $urlpath == STATIC_IMG_COMMON){
	return get_current_path() . "/" . $urlpath;
    } else if ($urlpath == ""){
	return get_current_path();
    }
    // leave untouched
    return $urlpath;
}

function get_current_path() {
    static $scheme, $host;
    $host = $_SERVER['SERVER_NAME'];
    $scheme = isset($_SERVER['REQUEST_SCHEME']) ? $_SERVER['REQUEST_SCHEME']
	: ('http'. (($_SERVER['SERVER_PORT'] == '443') ? 's' : ''));
    
    $uri = $_SERVER['REQUEST_URI'];
    $dirname = pathinfo($uri, PATHINFO_DIRNAME);
    
    return sprintf('%s://%s%s', $scheme, $host, $dirname);
}

// path is passed in url form from js
// convert it here to the absolute path
// this way, we do not need to expose the server structure in js files which can be seen in a browser window
function url2absolute($urlpath){
    $absolutepath = "";
    switch ($urlpath){
	case STATIC_TOP_ROOT:
	case LINK_TOP_ROOT:
	    $absolutepath = FULL_TOP_ROOT;
	    if ($absolutepath == ""){
		$absolutepath = __DIR__;
	    }
	    break;
	case STATIC_SITE_ROOT:
	case LINK_SITE_ROOT:
	    $absolutepath = FULL_SITE_ROOT;
	    if ($absolutepath == ""){
		$absolutepath = __DIR__;
	    }
	    break;
	case STATIC_IMG_COMMON:
	    $absolutepath = FULL_IMG_COMMON;
	    if ($absolutepath == ""){
		// default root to current directory and add subdirctory
		$absolutepath = __DIR__ . "/" . STATIC_IMG_COMMON;
	    }
	    break;
	case STATIC_JS_COMMON:
	    $absolutepath = FULL_JS_COMMON;
	    if ($absolutepath == ""){
		$absolutepath = __DIR__ . "/" . STATIC_JS_COMMON;
	    }
	    break;
	case STATIC_CSS_COMMON:
	    $absolutepath = FULL_CSS_COMMON;
	    if ($absolutepath == ""){
		$absolutepath = __DIR__ . "/" . STATIC_CSS_COMMON;
	    }
	    break;
	default:
	    errorlog("url2absolute error. No match for urlroot: " . $urlpath);
    }
    return $absolutepath;
}
