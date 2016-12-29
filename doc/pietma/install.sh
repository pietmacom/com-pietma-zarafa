#!/bin/bash -e

function setconf() {
    # 1: field / 2: value / 3: file
    sed -i "s|^#*\s*\($1\).*|\1 = $2|" $3
}

_basedir="$(dirname $0)"
_databasename="zarafa"
_databaseuser="zarafa"
_databasepassword="$(< /dev/urandom tr -dc A-Za-z0-9 | head -c16)"
# without password
mysqlexec="mysql -uroot -s -N -e"




if [[ -e "/etc/localtime" ]];
then
	echo "[....] Set timezone for ical service"
	setconf "server_timezone" "$(readlink -f /etc/localtime | sed  's|/usr/share/zoneinfo/||' | tr '_' ' ')" "/etc/zarafa/ical.cfg"
	echo "[DONE] Set timezone for ical service"
else
	echo "[SKIP] Set timezone for ical service - Not found /etc/localtime"
fi


echo "[....] Generate password for zarafa presence service"
_presence_password="$(< /dev/urandom tr -dc A-Za-z0-9 | head -c16)"
setconf "server_secret_key" "${_presence_password}" "/etc/zarafa/presence.cfg"
echo "[DONE] Generate password for zarafa presence service"


echo
read -p ":: Copy and override NGINX, PHP, POSTFIX, SASL settings? [Y/n] " _response
echo
if [[ "${_response,,}" = "y" ]];
then
    echo "[....] Copy and override NGINX, PHP, POSTFIX, SASL settings"
    cp -rf ${_basedir}/configs/nginx /etc    
    ln -sf /etc/nginx/sites-available/* /etc/nginx/sites-enabled/
    
    cp -rf ${_basedir}/configs/php /etc
    cp -rf ${_basedir}/configs/postfix /etc
    
    cp -rf ${_basedir}/configs/sasl /etc
    cp -rf ${_basedir}/configs/conf.d /etc
    echo "[DONE] Copy and override NGINX, PHP, POSTFIX, SASL settings"
    
    if [[ -z $(grep "smtps" /etc/services) ]]; then 
	echo "[....] Add smtps to /etc/services"
	echo >> /etc/services
	echo "smtps             465/tcp" >> /etc/services
	echo "smtps             465/udp" >> /etc/services
	echo "[DONE] Add smtps/465 to /etc/services"	
    else
	echo "[SKIP] Add smtps to /etc/services - found"
    fi
else
    echo "[SKIP] Copy and override NGINX, PHP, POSTFIX, SASL settings"
fi


if [[ -e "/var/lib/mysql" ]] \
 && [[ "$(ls -A /var/lib/mysql)" == "" ]];
then
	echo "[....] Install optimizations"
	${_basedir}/install-optimization.sh
	echo "[DONE] Install optimizations"

	echo "[....] Initialize MySQL database"
	mysql_install_db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
	echo "[DONE] Initialize MySQL database"    

	echo "[....] Start MySQL database"
	systemctl start mysqld
	echo "[DONE] Start MySQL database"	

	echo "[....] Secure MySQL database"	
	${_basedir}/install-mysql-secure.sh
	echo "[DONE] Secure MySQL database"		
else
	echo "[SKIP] Install optimizations - Not empty /var/lib/mysql"
	echo "[SKIP] Initialize MySQL database - Not empty /var/lib/mysql"
	echo "[SKIP] Secure MySQL database - Not empty /var/lib/mysql"
	
	echo
	_mysqlfound="yes"
	read -s -p ":: Please enter MySQL Root Password (or empty) " _mysqlpassword
	if [[ ! -z "${_mysqlpassword}" ]];
	then
		mysqlexec="mysql -uroot -p${_mysqlpassword} -s -N -e"
	fi
	echo
	echo
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
	mysql -u root -e "CREATE DATABASE IF NOT EXISTS ${_databasename};"
	mysql -u root -e "GRANT ALL PRIVILEGES ON ${_databasename}.* TO ${_databaseuser}@localhost;"
	echo "[DONE] Create Zarafa database"	
	
        echo "[....] Start Zarafa, install database tables and public store (this will take a while >1min)"
	systemctl start zarafa-server
	zarafa-admin -s
	sleep 60
        echo "[DONE] Start Zarafa, install database tables and public store"
        
        echo "[....] Stop Zarafa"
	systemctl stop zarafa-server
        echo "[DONE] Stop Zarafa"

	if [[ -z ${_mysqlfound} ]];
	then
		echo "[....] Stop MySQL"
		systemctl stop mysqld
		echo "[DONE] Stop MySQL"
	fi
else
	echo "[SKIP] Create Zarafa database - Database found"
fi


echo "[....] Create SSL-Keys/Certificates and trust them (this will take a while >10min)"
${_basedir}/install-ssl.sh
echo "[DONE] Create SSL-Keys/Certificates and trust them"


echo
read -p ":: Enable and start services MYSQLD, ZARAFA-SERVER, ZARAFA-GATEWAY, ZARAFA-SPOOLER, ZARAFA-DAGENT, ZARAFA-ICAL, PHP-FPM, NGINX, SASLAUTHD, POSTFIX [Y/n] " _response
echo
if [[ "${_response,,}" = "y" ]];
then
    echo "[....] Enable and start services"
    systemctl enable mysqld
    systemctl enable zarafa-server
    systemctl enable zarafa-gateway
    systemctl enable zarafa-spooler
    systemctl enable zarafa-dagent
    systemctl enable zarafa-ical
    systemctl enable php-fpm
    systemctl enable nginx
    systemctl enable saslauthd
    systemctl enable postfix

    systemctl start mysqld
    systemctl start zarafa-server
    systemctl start zarafa-gateway
    systemctl start zarafa-spooler
    systemctl start zarafa-dagent
    systemctl start zarafa-ical
    systemctl start php-fpm
    systemctl start nginx
    systemctl start saslauthd
    systemctl start postfix
    echo "[DONE] Enable and start services"
else
    echo "[SKIP] Enable and start services"
fi


echo
echo "Read More"
echo
echo "   https://wiki.archlinux.org/index.php/MySQL"
echo "   https://pietma.com/run-and-access-zarafa/"
echo "   https://pietma.com/optimize-zarafa-and-mysql-mariadb/"
echo
