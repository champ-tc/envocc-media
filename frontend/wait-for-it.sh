#!/bin/sh
# wait-for-it.sh (ไม่ควรเรียกตัวเองเด็ดขาด)
host=$(echo $1 | cut -d: -f1)
port=$(echo $1 | cut -d: -f2)

timeout=${2:-30}

echo "⏳ Waiting for $host:$port to be ready..."

for i in $(seq $timeout); do
    nc -z $host $port >/dev/null 2>&1 && echo "✅ $host:$port is up" && exit 0
    sleep 1
done

echo "❌ Timeout waiting for $host:$port"
exit 1
