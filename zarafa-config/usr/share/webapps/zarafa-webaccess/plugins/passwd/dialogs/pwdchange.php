<?
function getDialogTitle(){
    return _("Password change result");
}

function getBody() {
    // Please change backend here according your needs. Parameters must be provided currently in this order:
    // 1st string username
    // 2nd string old password
    // 3rd string new password
    // To change this, please modify the below sprintf!
    $passwd_cmd = "/usr/bin/zarafa-passwd -u '%s' -o '%s' -p '%s'";
    
    $username     = (isset($_POST["pwdchange_username"])? $_POST["pwdchange_username"] : null);
    $password     = (isset($_POST["pwdchange_oldpw"])   ? $_POST["pwdchange_oldpw"]    : null);
    $newpassword  = (isset($_POST["pwdchange_newpwd1"]) ? $_POST["pwdchange_newpwd1"]  : null);
    $newpassword2 = (isset($_POST["pwdchange_newpwd2"]) ? $_POST["pwdchange_newpwd2"]  : null);
    
    if ($username != null && 
	$password != null && 
	$newpassword != null && 
	$newpassword2 == $newpassword) {
        $mycmd = sprintf($passwd_cmd, $username, $password, $newpassword);

        exec($mycmd,$arrayout, $retval);
	if ($retval == 0) {
            echo _("Password changed successfully");
        } else {
	    echo _("An error occured!")."<BR>";
	    echo "<pre>".print_r($arrayout,false)."</pre>";
        }
    } else {
        echo _("Failed!")." ";
	if ($newpassword != $newpassword2) echo _("New Passwords don't match");
	if ($username == null) echo _("Username missing");
    }
}

function getJavaScript_onload(){
	echo "\t\t\t\t\twindow.setTimeout(\"parent.parentwindow.location.href='index.php?logout'\",5000);\n";
} 

?>