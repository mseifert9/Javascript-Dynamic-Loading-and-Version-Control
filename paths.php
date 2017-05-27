<?php
    // define paths for php - need both url and absolute paths for each location
    // LINK_ paths are the url for the cookie enabled domains
    // STATIC_ paths are the url for the cookieless domains
    // FULL_ paths are the absolute paths which correspond to the urls
    // _TOP_ROOT is the root of the Server in the domain tree
    // _SITE_ROOT is the root of the Site (domain)
    //	    if there is only one domain on the server, 
    //	    SITE_ROOT and TOP_ROOT paths will be the same
    //	    having both SITE_ROOT and TOP_ROOT defined allows pulling files from anywhere on the server for any of its site
    //	    in other words, it allows different sites to share images, js, and css resources
    define("LINK_TOP_ROOT", "http://mseifert/demo");
    define("LINK_SITE_ROOT", "http://mseifert/demo");
    define("STATIC_TOP_ROOT", "http://static-mseifert/demo");
    define("STATIC_SITE_ROOT", "http://static-mseifert/demo");
    define("STATIC_IMG_COMMON", "http://static-mseifert/demo/img");
    define("STATIC_JS_COMMON", "http://static-mseifert/demo/js");
    define("STATIC_CSS_COMMON", "http://static-mseifert/demo/css");
    define("FULL_TOP_ROOT", "D:/Website/mseifert/demo");
    define("FULL_SITE_ROOT", "D:/Website/mseifert/demo");
    define("FULL_IMG_COMMON", "D:/Website/mseifert/demo/img");
    define("FULL_JS_COMMON", "D:/Website/mseifert/demo/js");
    define("FULL_CSS_COMMON", "D:/Website/mseifert/demo/css");
?>
<script>
    // create the namespace
    var com = com || {};
    com.mseifert = com.mseifert || {common: {}};
    $msRoot = com.mseifert;
    $ms = $msRoot.common;
    // define url paths for javascript
    $ms.LINK_TOP_ROOT = "http://mseifert/demo"
    $ms.LINK_SITE_ROOT = "http://mseifert/demo"
    $ms.STATIC_TOP_ROOT = "http://static-mseifert/demo";
    $ms.STATIC_SITE_ROOT = "http://static-mseifert/demo";
    $ms.STATIC_IMG_COMMON = "http://static-mseifert/demo/img";
    $ms.STATIC_JS_COMMON = "http://static-mseifert/demo/js";
    $ms.STATIC_CSS_COMMON = "http://static-mseifert/demo/css";
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
function version($urlroot, $url){
    $fullroot = url2full($urlroot);
    // strrpos ($url, "?");
    $path = parse_url($url, PHP_URL_PATH);
    $query = parse_url($url, PHP_URL_QUERY);
    if (strlen($query) > 0){
	$query = "?" . $query;
    }
    $pathinfo = pathinfo($path);
    $ver = '.' . filemtime($fullroot . $path) . '.';
    $dir = $pathinfo['dirname'];
    if (strlen($dir) == 1){
	// "\" or "/"
	$dir == "";
    }
    return $urlroot . $dir . '/' . preg_replace('~.*\K\.~', $ver, $pathinfo['basename']) . $query;
}

// path is passed in url form from js
// convert it here to the absolute path
// this way, we do not need to expose the server structure in js files which can be seen in a browser window
function url2full($urlroot){
    $fullroot = "";
    switch ($urlroot){
	case STATIC_TOP_ROOT:
	case LINK_TOP_ROOT:
	    $fullroot = FULL_TOP_ROOT;
	    break;
	case STATIC_SITE_ROOT:
	case LINK_SITE_ROOT:
	    $fullroot = FULL_SITE_ROOT;
	    break;
	case STATIC_IMG_COMMON:
	    $fullroot = FULL_IMG_COMMON;
	    break;
	case STATIC_JS_COMMON:
	    $fullroot = FULL_JS_COMMON;
	    break;
	case STATIC_CSS_COMMON:
	    $fullroot = FULL_CSS_COMMON;
	    break;
	default:
	    errorlog("url2full error. No match for urlroot: " . $urlroot);
    }
    return $fullroot;
}
