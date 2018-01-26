#!/bin/bash -e

function setconf() {
    # 1: field / 2: value / 3: file
    sed -i "s|^#*\s*\($1\).*|\1 = $2|" $3
}

while getopts :s: opt;
do
    case $OPTARG in
    s) _silent="y" ;;
    esac
done

_basedir="$(dirname $0)"
_databasename="kopano"
_databaseuser="kopano"
_databasepassword="$(< /dev/urandom tr -dc A-Za-z0-9 | head -c16)"
# without password
mysqlexec="mysql -uroot -s -N -e"




if [[ -e "/etc/localtime" ]];
then
	echo "[....] Set timezone for ical service"
	setconf "server_timezone" "$(readlink -f /etc/localtime | sed  's|/usr/share/zoneinfo/||' | tr '_' ' ')" "/etc/kopano/ical.cfg"
	echo "[DONE] Set timezone for ical service"
else
	echo "[SKIP] Set timezone for ical service - Not found /etc/localtime"
fi


echo "[....] Generate password for kopano presence service"
_presence_password="$(< /dev/urandom tr -dc A-Za-z0-9 | head -c16)"
setconf "server_secret_key" "${_presence_password}" "/etc/kopano/presence.cfg"
echo "[DONE] Generate password for kopano presence service"


if [[ -z "${_silent}" ]];
then
    echo
    read -p ":: Copy and override NGINX, PHP, POSTFIX, SASL settings? [Y/n] " _response
    echo
else
    _response="y"
fi
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
	if [[ -z "${_silent}" ]];
	then
	    read -s -p ":: Please enter MySQL Root Password (or empty) " _mysqlpassword
	else
	    _mysqlpassword=""
	fi
	if [[ ! -z "${_mysqlpassword}" ]];
	then
		mysqlexec="mysql -uroot -p${_mysqlpassword} -s -N -e"
	fi
	echo
	echo
fi

if [[ -z $($mysqlexec "show databases like '${_databasename}';") ]];
then
	echo "[....] Create Kopano database"	
	# => server.cfg
	setconf "mysql_user" "${_databaseuser}" "/etc/kopano/server.cfg"
	setconf "mysql_password" "${_databasepassword}" "/etc/kopano/server.cfg"
	setconf "mysql_database" "${_databasename}" "/etc/kopano/server.cfg"

	if [[ -z $($mysqlexec "use mysql; select * from user where user ='${_databaseuser}';") ]];
	then
		$mysqlexec "CREATE USER '${_databaseuser}'@'localhost' IDENTIFIED BY '${_databasepassword}';"
	else
		$mysqlexec "SET PASSWORD FOR '${_databaseuser}'@'localhost' = PASSWORD('${_databasepassword}');"
	fi
	mysql -u root -e "CREATE DATABASE IF NOT EXISTS ${_databasename};"
	mysql -u root -e "GRANT ALL PRIVILEGES ON ${_databasename}.* TO ${_databaseuser}@localhost;"
	echo "[DONE] Create Kopano database"	
	
        echo "[....] Start Kopano, install database tables and public store (this will take a while >1min)"
	systemctl start kopano-server
	kopano-admin -s
	sleep 60
        echo "[DONE] Start Kopano, install database tables and public store"
        
        echo "[....] Stop Kopano"
	systemctl stop kopano-server
        echo "[DONE] Stop Kopano"

	if [[ -z ${_mysqlfound} ]];
	then
		echo "[....] Stop MySQL"
		systemctl stop mysqld
		echo "[DONE] Stop MySQL"
	fi
else
	echo "[SKIP] Create Kopano database - Database found"
fi


echo "[....] Create SSL-Keys/Certificates and trust them (this will take a while >10min)"
${_basedir}/install-ssl.sh
echo "[DONE] Create SSL-Keys/Certificates and trust them"


if [[ -z "${_silent}" ]];
then
    echo
    read -p ":: Enable and start services MYSQLD, KOPANO-SERVER, KOPANO-GATEWAY, KOPANO-SPOOLER, KOPANO-DAGENT, KOPANO-ICAL, PHP-FPM, NGINX, SASLAUTHD, POSTFIX [Y/n] " _response
    echo
else
    _response="n"    
fi
if [[ "${_response,,}" = "y" ]];
then
    echo "[....] Enable and start services"
    systemctl enable mysqld
    systemctl enable kopano-server
    systemctl enable kopano-search
    systemctl enable kopano-gateway
    systemctl enable kopano-spooler
    systemctl enable kopano-dagent
    systemctl enable kopano-ical
    systemctl enable php-fpm
    systemctl enable nginx
    systemctl enable saslauthd
    systemctl enable postfix

    systemctl start mysqld
    systemctl start kopano-server
    systemctl start kopano-search
    systemctl start kopano-gateway
    systemctl start kopano-spooler
    systemctl start kopano-dagent
    systemctl start kopano-ical
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
echo "   https://pietma.com/run-and-access-kopano/"
echo "   https://pietma.com/optimize-kopano-and-mysql-mariadb/"
echo
