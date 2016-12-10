#!/bin/bash

function setconf() {
    # 1: field / 2: value / 3: file
    sed -i "s|^#*\s*\($1\).*|\1 = $2|" $3
}

installlog="/tmp/zarafa-install.log"

# CONFIG
# => defaults
for cfg in /usr/share/doc/zarafa/example-config/*.cfg; do
	install --backup=simple --suffix .pacsave -o zarafa -g zarafa -m 0600  ${cfg} /etc/zarafa
done

# => server.cfg
_mysql_password="$(< /dev/urandom tr -dc A-Za-z0-9 | head -c16)"
setconf "mysql_password" "${_mysql_password}" "/etc/zarafa/server.cfg"

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
/usr/share/doc/zarafa/zarafa-pietma/install-optimization.sh >> $installlog 2>> $installlog
echo "[DONE] Install optimizations"

# => mysql-database
if [[ -e "/var/lib/mysql" ]] \
 && [[ "$(ls -A /var/lib/mysql)" == "" ]];
then
	echo "[....] Initialize MySQL database"
	mysql_install_db --user=mysql --basedir=/usr --datadir=/var/lib/mysql | tail -n +1 >> $installlog 2>> $installlog
	echo "[DONE] Initialize MySQL database"    

	echo "[....] Start MySQL database"
	systemctl start mysqld >> $installlog 2>> $installlog
	echo "[DONE] Start MySQL database"	

	echo "[....] Secure MySQL database"	
	/usr/share/doc/zarafa/zarafa-pietma/install-mysql-secure.sh >> $installlog 2>> $installlog
	echo "[DONE] Secure MySQL database"		
	
	echo "[....] Create Zarafa database"	
	mysql -u root -e "CREATE DATABASE IF NOT EXISTS zarafa;" >> $installlog 2>> $installlog
	mysql -u root -e "GRANT ALL PRIVILEGES ON zarafa.* TO zarafa@localhost IDENTIFIED BY '${_mysql_password}';" >> $installlog 2>> $installlog
	echo "[DONE] Create Zarafa database"	
	
        echo "[....] Start Zarafa and install database tables (this will take a while >1min)"
	systemctl start zarafa-server >> $installlog 2>> $installlog
	sleep 60 >> $installlog 2>> $installlog
        echo "[DONE] Start Zarafa and install database tables"
        
        echo "[....] Stop Zarafa and MySQL"
	systemctl stop zarafa-server >> $installlog 2>> $installlog
	systemctl stop mysqld >> $installlog 2>> $installlog
        echo "[DONE] Stop Zarafa and MySQL"	
else
	echo
	echo "Please initialize MySQL:"
	echo
	echo "  $ mysql_install_db --user=mysql --basedir=/usr --datadir=/var/lib/mysql"
	echo
	echo "Please secure MySQL:"
	echo
	echo "  $ systemctl start mysqld"
	echo "  $ mysql_secure_installation"
	echo
	echo "Please create Zarafa database:"
	echo
	echo "  $ mysql -u root -p"
	echo "  mysql> CREATE DATABASE IF NOT EXISTS zarafa;"
	echo "  mysql> GRANT ALL PRIVILEGES ON zarafa.* TO zarafa@localhost IDENTIFIED BY '${_mysql_password}';"
	echo
	echo "Please start Zarafa-Server and create database tables"
	echo
	echo "  $ systemctl start zarafa-server"
fi

# => ssl-keys / -certificates
if [ ! -e "/etc/ssl/private/zarafa.key" ] \
 && [ ! -e "/etc/ssl/private/zarafa.crt" ] \
 && [ ! -e "/etc/ssl/private/zarafa.dh" ];
then
	echo "[....] Create SSL-Keys/Certificates and trust them (this will take a while >10min)"
	/usr/share/doc/zarafa/zarafa-pietma/install-ssl.sh | tail -n +1 >> $installlog 2>> $installlog
	echo "[DONE] Create SSL-Keys/Certificates and trust them"
else
    echo
    echo "Please create SSL-Keys/Certificates and add to trusted"
    echo 
    echo "  $ /usr/share/doc/zarafa/zarafa-pietma/install-ssl.sh"
    echo
fi

echo
echo "Open The Full Installation Log"
echo
echo "   $ cat ${installlog}"
echo
echo "Read More"
echo
echo "   https://wiki.archlinux.org/index.php/MySQL"
echo "   https://pietma.com/run-and-access-zarafa/"
echo "   https://pietma.com/optimize-zarafa-and-mysql-mariadb/"
echo
