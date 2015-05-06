<?php
/* 
	config.php
	
	The config file for the webapp.
	All possible web client settings can be set in this file. Some settings 
	(language) can also be set per user or logon.

*/
	// Comment next line to disable the config check (or set FALSE to log the config errors)
	define("CONFIG_CHECK", TRUE);

	// Use these options to optionally disable some PHP configuration checks.
	// WARNING: these checks will disable checks regarding the security of the WebApp site configuration,
	// only change them if you know the consequences - improper use will lead to an insecure installation!
	define("CONFIG_CHECK_COOKIES_HTTP", FALSE);
	define("CONFIG_CHECK_COOKIES_SSL", FALSE);

	// Default Zarafa server to connect to.
	define("DEFAULT_SERVER","file:///var/run/zarafa");
	#define("DEFAULT_SERVER","file://\\\\.\\pipe\\zarafa");
	#define("DEFAULT_SERVER","http://localhost:236/zarafa");

	// When using a single-signon system on your webserver, but Zarafa is on another server
	// you can use https to access the zarafa server, and authenticate using an SSL certificate.
	define("SSLCERT_FILE", NULL);
	define("SSLCERT_PASS", NULL);

	// set to 'true' to strip domain from login name found from Single Signon webservers
	define("LOGINNAME_STRIP_DOMAIN", false);

	// Name of the cookie that is used for the session, we can also use an external cookie
	if (isset($_GET["external"]) && preg_match("/[a-z][a-z0-9_]+/i",$_GET["external"])){
		define("COOKIE_NAME",$_GET["external"]);
	}else{
		define("COOKIE_NAME","ZARAFA_WEBAPP");
	}

	// Defines the base url and end with a slash.
	$base_url = dirname($_SERVER["PHP_SELF"]);
	if(substr($base_url,-1)!="/") $base_url .="/";
	define("BASE_URL", $base_url);
	
	// Defines the base path on the server, terminated by a slash
	define('BASE_PATH', dirname($_SERVER['SCRIPT_FILENAME']) . "/");

	// Defines the temp path (absolute). Here uploaded attachments will be saved.
	// The web client doesn't work without this directory.
	define("TMP_PATH", "/var/lib/webapps/zarafa-webapp/tmp");

	// Define the server paths
	set_include_path(BASE_PATH. PATH_SEPARATOR . 
	                 BASE_PATH."server/PEAR/" .  PATH_SEPARATOR . 
	                 "/usr/share/php/");

	// Define the path to the plugin directory (No slash at the end)
	define("PATH_PLUGIN_DIR", "plugins");

	// Enable the plugins
	define("ENABLE_PLUGINS", true);

	// Define list of disabled plugins separated by semicolon
	define("DISABLED_PLUGINS_LIST", '');

	// Set addressbook for GAB not to show any users unless searching for a specific user
	define("DISABLE_FULL_GAB", false);

	// Set the threshold for the addressnook to only show a full contactlist when the number of rows 
	// do not exeed this threshold. Otherwise the user can only use the search. Enter any number above
	// zero to set the threshold or -1 to always show the list or 0 to always hide the full list.
	define("DISABLE_FULL_CONTACTLIST_THRESHOLD", -1);
	
	// Set true to show public folders in hierarchy, false will disable public folders in hierarchy.
	define('ENABLE_PUBLIC_FOLDERS', true);

	// Booking method (true = direct booking, false = send meeting request)
	define('ENABLE_DIRECT_BOOKING', true);

	// Enable GZIP compression for responses
	define('ENABLE_RESPONSE_COMPRESSION', true);

	/**************************************\
	* Memory usage and timeouts            *
	\**************************************/
	
	// This sets the maximum time in seconds that is allowed to run before it is terminated by the parser.	
	ini_set('max_execution_time', 300); // 5 minutes

	// BLOCK_SIZE (in bytes) is used for attachments by mapi_stream_read/mapi_stream_write
	define('BLOCK_SIZE', 1048576);

	// Time that static files may exist in the client's cache (13 weeks)
	define('EXPIRES_TIME', 60*60*24*7*13);

	// Time that the state files are allowed to survive (in seconds)
	// For filesystems on which relatime is used, this value should be larger then the relatime_interval
	// for kernels 2.6.30 and above relatime is enabled by default, and the relatime_interval is set to
	// 24 hours.
	define('STATE_FILE_MAX_LIFETIME', 28*60*60);

	// Time that attachments are allowed to survive (in seconds)
	define('UPLOADED_ATTACHMENT_MAX_LIFETIME', 6*60*60);

	/**************************************\
	* Languages                            *
	\**************************************/

	// Location to the translations
	define("LANGUAGE_DIR", "server/language/");
	
	// Defines the default interface language. This can be overriden by the user.
	// This language is also used on the login page
	if (isset($_ENV['LANG']) && $_ENV['LANG']!="C"){
		define('LANG', $_ENV["LANG"]); // This means the server environment language determines the web client language.
	}else{
		define('LANG', 'de_DE.UTF-8'); // default fallback language
	}

	// List of languages that should be enabled in the logon
	// screen's language drop down.  Languages should be specified
	// using <languagecode>_<regioncode>[.UTF-8], and separated with
	// semicolon.  A list of available languages can be found in
	// the manual or by looking at the list of directories in
	// /usr/share/zarafa-webapp/server/language .
	define("ENABLED_LANGUAGES", "de_DE;en_GB;en_US;fr_FR;he_IL;it_IT;nl_NL;pt_BR;ru_RU;tr_TR;zh_CN;pl_PL;ru_RU");

	// Defines the default time zone, change e.g. to "Europe/London" when needed
	if(function_exists("date_default_timezone_set")) {
		if(!ini_get('date.timezone')) {
			date_default_timezone_set('Europe/London');
		}
	}


	/**************************************\
	* Debugging                            *
	\**************************************/

	ini_set("display_errors", false);
	error_reporting(0);
	
	if (file_exists("debug.php")){
		include("debug.php");
	}else{
		// define empty dump function in case we still use it somewhere
		function dump(){}
	}
?>
