#!/bin/bash


function calc() {
    echo -n $(awk "BEGIN { print $1 }")
}

function round() {
    echo -n $(awk "BEGIN { rounded = sprintf(\"%.0f\", $1); print rounded }")
    # "
}

function floor() {
    echo -n ${1/.*}
}

function ceiling() {
    if [[ "$(floor $1)" = "$1" ]];
    then
	echo -n "$1"
    else
        echo -n $(calc "$(floor $1) + 1") #"
    fi
}

function set() {
    # 1: field / 2: value / 3: file / 4: prefix
    sed -i "s|^$4\($1\).*|\1 = $2|" $3
}


memory_total=$(calc "$(cat /proc/meminfo | grep 'MemTotal' | grep -oh '[0-9]*') / 1024") # "

innodb_buffer_pool_size_ratio="0.25"
innodb_buffer_pool_size=$(calc "$memory_total * $innodb_buffer_pool_size_ratio")
innodb_log_file_size_ratio="0.25"
innodb_log_file_size=$(calc "$innodb_buffer_pool_size * $innodb_log_file_size_ratio") # "
total_filesystem="$innodb_log_file_size"
total_fixed_instance="112" # MB
total_instance=$(calc "$total_fixed_instance + $innodb_buffer_pool_size")
total_connection="18.656" # MB
max_connections_ratio="0.25"
max_connections=$(floor $(calc "(($memory_total - $total_instance) * $max_connections_ratio) / $total_connection")) # "
threads=$(round $(calc "($max_connections - 1) / 2")) #"
zarafa_users=$threads
cache_cell_size_ratio="0.25"
cache_cell_size=$(calc "$memory_total * $cache_cell_size_ratio")
cache_object_size=$(calc "0.1 * $zarafa_users")
cache_indexedobject_size=$(calc "0.5 * $zarafa_users")
total_fixed_zarafa="30"
total_zarafa=$(calc "$total_fixed_zarafa + $cache_cell_size + $cache_object_size + $cache_indexedobject_size")
memory_used=$(calc "$total_instance + ($total_connection * $max_connections) + $total_zarafa") # "
memory_free=$(calc "$memory_total - $memory_used")
memory_used_prc=$(calc "($memory_used / $memory_total) * 100") # "
memory_free_prc=$(calc "($memory_free / $memory_total) * 100") # "


echo 
echo "MYSQL"
echo
echo "total_fixed_instance: $total_fixed_instance MB"
echo "innodb_buffer_pool_size_ratio: $innodb_buffer_pool_size_ratio"
echo "innodb_buffer_pool_size: $innodb_buffer_pool_size MB"
echo "max_connections_ratio: $max_connections_ratio"
echo "max_connections: $max_connections"
echo "=> total_instance: $total_instance MB"
echo
echo "=> total_connection: $total_connection MB"
echo
echo "innodb_log_file_size_ratio: $innodb_log_file_size_ratio"
echo "innodb_log_file_size: $innodb_log_file_size MB"
echo "=> total_filesystem: $total_filesystem MB"
echo
echo "ZARAFA"
echo
echo "total_fixed_zarafa: $total_fixed_zarafa"
echo "cache_cell_size_ratio: $cache_cell_size_ratio"
echo "cache_cell_size: $cache_cell_size MB"
echo "cache_object_size: $cache_object_size MB"
echo "cache_indexedobject_size: $cache_indexedobject_size MB"
echo "threads: $threads"
echo "=> total_zarafa: $total_zarafa MB"
echo
echo "TOTAL"
echo
echo "memory_total: $memory_total MB"
echo "memory_used: $memory_used MB"
echo "memory_free: $memory_free MB"
echo "memory_used_prc: $memory_used_prc %"
echo "memory_free_prc: $memory_free_prc %"
echo "zarafa_users: $zarafa_users"

mysqlconf="my.cnf.cust"
cp -f my.cnf $mysqlconf
set "innodb_buffer_pool_size" "$(ceiling ${innodb_buffer_pool_size})M" ${mysqlconf}
set "max_connections" "$max_connections" ${mysqlconf}
set "innodb_log_file_size" "$(ceiling ${innodb_log_file_size})M" ${mysqlconf}

zarafaconf="server.cfg.cust"
cp -f "server.cfg" $zarafaconf
set "cache_cell_size" "$(ceiling ${cache_cell_size})M" ${zarafaconf} "#*\s*"
set "cache_object_size" "$(ceiling ${cache_object_size})M" ${zarafaconf} "#*\s*"
set "cache_indexedobject_size" "$(ceiling ${cache_indexedobject_size})M" ${zarafaconf} "#*\s*"

