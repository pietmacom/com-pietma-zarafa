#!/bin/bash

keypath="/etc/ssl/private"
certpath="/etc/ssl/certs"
keysize="4096"
dhsize="2048"

echo
echo "Please do 'rm $keypath/kopano.*' to recreate all ssl files."
echo

# Strong SSL Security
# https://raymii.org/s/tutorials/Strong_SSL_Security_On_nginx.html 
# https://cipherli.st/
# http://www.shellhacks.com/en/HowTo-Create-CSR-using-OpenSSL-Without-Prompt-Non-Interactive
if [ ! -f "$keypath/kopano.key" ]
then
    echo "Creating default key ($keysize bit) to $keypath/kopano.key"
    openssl genrsa -out $keypath/kopano.key $keysize
else
    echo "Found default key under $keypath/kopano.key"
fi

if [ ! -f "$keypath/kopano.crt" ]
then
    echo "Creating default certificate (sha512 / 3650 days) to $keypath/kopano.crt"    
    openssl req -new -sha512 -key $keypath/kopano.key -out /tmp/kopano.csr -subj "/CN=localhost"
    openssl x509 -req -days 3650 -in /tmp/kopano.csr -signkey $keypath/kopano.key -out $keypath/kopano.crt 
else
    echo "Found certificate under $keypath/kopano.crt"    
fi

echo "Trust own certificate for later connections"
find -L $certpath -samefile $keypath/kopano.crt -exec rm {} \;
ln -s $keypath/kopano.crt $certpath/kopano.crt 
ln -s $keypath/kopano.crt $certpath/$(openssl x509 -noout -hash -in $certpath/kopano.crt).0 
update-ca-trust


if [ ! -f "$keypath/kopano.dh" ]
then
    echo "Creating Diffie Hellman ($dhsize bit) precalculation to $keypath/kopano.dh"
    openssl dhparam -out $keypath/kopano.dh $dhsize
else
    echo "Found Diffie Hellman precalculation under $keypath/kopano.dh"
fi

echo "Setting permissions to $keypath/kopano.*"
chown root:root $keypath/kopano.*
chmod 600 $keypath/kopano.*

# crt must be readable for all users. or else no checks are possible
chmod 644 $keypath/kopano.crt


