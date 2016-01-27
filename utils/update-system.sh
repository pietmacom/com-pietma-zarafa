#!/bin/bash -e

##
# I found no way to find split-packages. So I asume all parts are
# generated during compilation and served by pietma.com.
#
# 1. I update strict and installed depending on strict from pietma.com 
# 2. I ignore strict and installed depending on strict them at system update
#
##

# for textmatches in pacman
LANG=en_US

echo ; echo "### Pacman database update"

pacman -Sy


echo ; echo "### Retriving package dependencies"

allpackages=$(pacman -Slq pietma)
grouppackages=$(pacman -Sgq zarafa)
strictpackages=$(echo "$grouppackages" | xargs -l1 -n 1 pacman -Si | grep "Depends On.*" | sed "s/^.*\: //g" | sed "s/  /\n/g" | grep -P ".*?[a-zA-Z](=|<)[0-9\.]" | sed "s/[=<>].*//g" | sort | uniq)

# for all packages: pactree -s -d 1 -r -l
depends=$(join <(echo "$strictpackages" | xargs -l1 -n1 pactree -d 1 -r -l | sort | uniq) <(echo "$allpackages" | sort))
depends=$(join -v 1 <(echo "$depends") <(echo "$grouppackages") | sort)
depends=$(join -v 1 <(echo "$depends") <(echo "$strictpackages") | sort)

echo ; echo "### Component update"

updatestrict=$(echo "$strictpackages" | sed "s/^/pietma\//g")
echo "### Update strict packages from pietma" 
echo "$updatestrict" ; echo

updatedepends=$(echo "$depends" | sed "s/^/pietma\//g")
echo "### Update installed packages that depend on strict served by pietma"
echo "$updatedepends" ; echo

pacman -S --needed $(echo "$updatestrict" | xargs) $(echo "$updatedepends" | xargs)


echo ; echo "### Systemupdate"

ignorestrict=$(echo "$strictpackages" | sed "s/^/--ignore /g") 
echo "### Ignore strict packages served by pietma"
echo "$ignorestrict" ; echo

ignoredepends=$(echo "$depends" | sed "s/^/--ignore /g")
echo "### Ignore installed packages that depend on strict served by pietma"
echo "$ignoredepends" ; echo

pacman -Su $(echo "$ignorestrict" | xargs) $(echo "$ignoredepends" | xargs)