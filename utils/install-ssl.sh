#!/bin/bash

keypath="/etc/ssl/private"
certpath="/etc/ssl/certs"
keysize="4096"
dhsize="2048"

echo
echo "Please do 'rm $keypath/zarafa.*' to recreate all ssl files."
echo

# Strong SSL Security
# https://raymii.org/s/tutorials/Strong_SSL_Security_On_nginx.html 
# https://cipherli.st/
# http://www.shellhacks.com/en/HowTo-Create-CSR-using-OpenSSL-Without-Prompt-Non-Interactive
if [ ! -f "$keypath/zarafa.key" ]
then
    echo "Creating default key ($keysize bit) to $keypath/zarafa.key"
    openssl genrsa -out $keypath/zarafa.key $keysize
else
    echo "Found default key ($keysize bit) under $keypath/zarafa.key"
fi

if [ ! -f "$keypath/zarafa.crt" ]
then
    echo "Creating default certificate (sha512 / 3650 days) to $keypath/zarafa.crt"    
    openssl req -new -sha512 -key $keypath/zarafa.key -out /tmp/zarafa.csr -subj "/CN=localhost"
    openssl x509 -req -days 3650 -in /tmp/zarafa.csr -signkey $keypath/zarafa.key -out $keypath/zarafa.crt 
else
    echo "Found certificate under $keypath/zarafa.crt"    
fi

echo "Trust own certificate for later connections"
find -L $certpath -samefile $keypath/zarafa.crt -exec rm {} \;
ln -s $keypath/zarafa.crt $certpath/zarafa.crt 
ln -s $keypath/zarafa.crt $certpath/$(openssl x509 -noout -hash -in $certpath/zarafa.crt).0 
update-ca-trust


if [ ! -f "$keypath/zarafa.dh" ]
then
    echo "Creating Diffie Hellman ($dhsize bit) precalculation to $keypath/zarafa.dh"
    openssl dhparam -out $keypath/zarafa.dh $dhsize
else
    echo "Found Diffie Hellman precalculation under $keypath/zarafa.dh"
fi

echo "Setting permissions to $keypath/zarafa.*"
chown root:root $keypath/zarafa.*
chmod 600 $keypath/zarafa.*

# crt must be readable for all users. or else no checks are possible
chmod 644 $keypath/zarafa.crt


