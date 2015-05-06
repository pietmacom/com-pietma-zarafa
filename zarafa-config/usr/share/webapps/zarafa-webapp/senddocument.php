<?php
// Include backwards compatibility
require_once("server/sys_get_temp_dir.php");
require_once("server/util.php");

//unique id for attachment
$tmpname = tempnam(sys_get_temp_dir(), md5(uniqid(rand(),true)));

// Move the uploaded file the the tmpname
move_uploaded_file($_FILES["file"]["tmp_name"], $tmpname);

//returns query string to script file
echo "&attachment_id=".mb_basename($tmpname)."&name=".$_FILES["file"]["name"];
?>
