#!/bin/bash -e

function setconf() {
    # 1: field / 2: value / 3: file
    sed -i "s|^#*\s*\($1\).*|\1 = $2|" $3
}

_installlog="/tmp/zarafa-install.log"
_databasename="zarafa"
_databaseuser="zarafa"
_databasepassword="$(< /dev/urandom tr -dc A-Za-z0-9 | head -c16)"

# CONFIG
# => ical.cfg
if [[ -e "/etc/localtime" ]];
then
	setconf "server_timezone" "$(readlink -f /etc/localtime | sed  's|/usr/share/zoneinfo/||' | tr '_' ' ')" "/etc/zarafa/ical.cfg"
fi

# => presence.cfg
_presence_password="$(< /dev/urandom tr -dc A-Za-z0-9 | head -c16)"
setconf "server_secret_key" "${_presence_password}" "/etc/zarafa/presence.cfg"

# => optimization
echo "[....] Install optimizations"
/usr/share/doc/zarafa/install-optimization.sh >> $_installlog 2>> $_installlog
echo "[DONE] Install optimizations"

# => mysql-database
# without password
mysqlexec="mysql -uroot -s -N -e"

if [[ -e "/var/lib/mysql" ]] \
 && [[ "$(ls -A /var/lib/mysql)" == "" ]];
then
	echo "[....] Initialize MySQL database"
	mysql_install_db --user=mysql --basedir=/usr --datadir=/var/lib/mysql | tail -n +1 >> $_installlog 2>> $_installlog
	echo "[DONE] Initialize MySQL database"    

	echo "[....] Start MySQL database"
	systemctl start mysqld >> $_installlog 2>> $_installlog
	echo "[DONE] Start MySQL database"	

	echo "[....] Secure MySQL database"	
	/usr/share/doc/zarafa/install-mysql-secure.sh >> $_installlog 2>> $_installlog
	echo "[DONE] Secure MySQL database"		
else
	_mysqlfound="yes"
	read -s -p "MySQL Root Password (or empty):" _mysqlpassword
	if [[ ! -z ${_mysqlpassword} ]];
	then
		mysqlexec="mysql -uroot -p${_mysqlpassword} -s -N -e"
	fi
fi

if [[ -z $($mysqlexec "show databases like '${_databasename}';") ]];
then
	echo "[....] Create Zarafa database"	
	# => server.cfg
	setconf "mysql_user" "${_databaseuser}" "/etc/zarafa/server.cfg"
	setconf "mysql_password" "${_databasepassword}" "/etc/zarafa/server.cfg"
	setconf "mysql_database" "${_databasename}" "/etc/zarafa/server.cfg"

	if [[ -z $($mysqlexec "use mysql; select * from user where user ='${_databaseuser}';") ]];
	then
		$mysqlexec "CREATE USER '${_databaseuser}'@'localhost' IDENTIFIED BY '${_databasepassword}';"
	else
		$mysqlexec "SET PASSWORD FOR '${_databaseuser}'@'localhost' = PASSWORD('${_databasepassword}');"
	fi
	mysql -u root -e "CREATE DATABASE IF NOT EXISTS ${_databasename};" >> $_installlog 2>> $_installlog
	mysql -u root -e "GRANT ALL PRIVILEGES ON ${_databasename}.* TO ${_databaseuser}@localhost;" >> $_installlog 2>> $_installlog
	echo "[DONE] Create Zarafa database"	
	
        echo "[....] Start Zarafa and install database tables (this will take a while >1min)"
	systemctl start zarafa-server >> $_installlog 2>> $_installlog
	sleep 60 >> $_installlog 2>> $_installlog
        echo "[DONE] Start Zarafa and install database tables"
        
        echo "[....] Stop Zarafa"
	systemctl stop zarafa-server >> $_installlog 2>> $_installlog
        echo "[DONE] Stop Zarafa"

	if [[ -z ${_mysqlfound} ]];
	then
		echo "[....] Stop MySQL"
		systemctl stop mysqld >> $_installlog 2>> $_installlog
		echo "[DONE] Stop MySQL"
	fi
fi

# => ssl-keys / -certificates
echo "[....] Create SSL-Keys/Certificates and trust them (this will take a while >10min)"
/usr/share/doc/zarafa/install-ssl.sh | tail -n +1 >> $_installlog 2>> $_installlog
echo "[DONE] Create SSL-Keys/Certificates and trust them"

echo
echo "Open The Full Installation Log"
echo
echo "   $ cat ${_installlog}"
echo
echo "Read More"
echo
echo "   https://wiki.archlinux.org/index.php/MySQL"
echo "   https://pietma.com/run-and-access-zarafa/"
echo "   https://pietma.com/optimize-zarafa-and-mysql-mariadb/"
echo
