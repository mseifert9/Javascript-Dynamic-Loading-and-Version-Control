<?php ob_start();
// this file is called by javascript requesting file information
// it returns timestamp information for the files in directories specified

// allow cross domain requests
header("Access-Control-Allow-Origin: *");

// common.php - and include file shared by demo.php and moddate.php
include "common.php";
if (!isset($_POST)) {
    return;
}
$otherdata = json_decode($_POST['otherData'], true);
$aurlpath = $otherdata['path'];
$filter = "";
$exclude = "";
if (isset($otherdata['filter'])){
    $filter = $otherdata['filter'];
}
if (isset($otherdata['exclude'])){
    $exclude = $otherdata['exclude'];
}

$validpassedpaths = array(
    STATIC_IMG_COMMON,
    STATIC_JS_COMMON,
    STATIC_CSS_COMMON,
    STATIC_TOP_ROOT
    );
$validpaths = array(
    FULL_IMG_COMMON,
    FULL_JS_COMMON,
    FULL_CSS_COMMON,
    FULL_TOP_ROOT
    );

if (!is_array($aurlpath)){
    $aurlpath = array($aurlpath);
}
$files = array();
for ($j = 0; $j < count($aurlpath); $j++){
    // path is passed in url form from js
    // convert it here to the absolute path
    // this way, we do not need to expose the server structure in js files which can be seen in a browser window
    $valid = false;
    $subdir = "";
    for ($i = 0; $i < count($validpassedpaths); $i++){
	if ($aurlpath[$j] === $validpassedpaths[$i]){
	    // exact valid path
	    $dir = $validpassedpaths[$i];
	    $valid = true;
	    break;
	}
    }
    if (!$valid){
	// test sub dir of valid path
	for ($i = 0; $i < count($validpassedpaths); $i++){
	    if (strpos($aurlpath[$j], $validpassedpaths[$i] . "/") === 0){
		// is sub dir of valid path
		$dir = $validpassedpaths[$i];
		$subdir = substr($aurlpath[$j], strlen($dir));
		$valid = true;
		break;
	    }
	}
    }
    if (!$valid){
	// invalid url - test if subdirctory (js, css, img) only was passed (default)
	// if so, translate to full absolute path
	$path = url2absolute($aurlpath[$j]);
	if (strlen($path) == 0){
	    return returnError("Error. Url directory is not valid: " . $aurlpath[$j]);
	}
    } else {
	// valid url passed, translate to full absolute path
        $path = url2absolute($dir);
    }
    if (strlen($path) == 0){
	return returnError("Error. Absolute directory not found for url: " . $aurlpath[$j]);
    }
    $path = $path . $subdir;
    
    $dir = dirname($path);
    $allowed = false;
    $validpathsempty = true;
    for ($i = 0; $i < count($validpaths); $i++){
	if ($validpaths[$i] !== ""){
	    $validpathsempty = false;
	}
	// validate the path is a specified directory or a subdirectory of the specified directory
	if ($dir == $validpaths[$i] ||
		$dir . "/" == substr($validpaths[$i], 0, strlen($dir . "/"))   ){
	    $allowed = true;
	    break;
	}
    }
    $data = array("status" => "", "result" => "");
    if (!$allowed && !$validpathsempty){
	return returnError("Error. Directory is not allowed: " . $aurlpath[$j]);
    }

    $handle = opendir($path);
    if ($handle === false) {
	return returnError("Error. Failed to open directory: " . $aurlpath[$j]);
    }
    while (false !== ($file = readdir($handle))) {
	if (strlen($filter) > 0){
	    if (!preg_match("/$filter/", $file)){
		continue;
	    }
	}
	if (strlen($exclude) > 0){
	    if (preg_match("/$filter/", $file)){
		continue;
	    }
	}	
	
	$basefile = $file;
	$file = $path . "/" . $basefile;

	if (is_file($file) && substr($basefile, 0, 1) != '.' && !strstr($file, '..') && !strstr($file, '#')) {
	    $time = filemtime($file);
	    $files[] = array("file" => $file, "baseFile" => $basefile, "time" => $time);
	}
    }
    //errorlog(v($files));
    closedir($handle);
}
$data['status'] = "Success";
$data['result'] = $files;

ob_clean();
ob_end_clean();
echo (json_encode($data));
errorlog("success");


function returnError($message){
    ob_clean();
    ob_end_clean();
    $data['status'] = $message;
    errorlog($data['status']);

    echo (json_encode($data));
}
