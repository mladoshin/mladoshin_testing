#!/bin/sh
# wait-for-it.sh: Wait for a service to be available

set -e

host="$1"
shift
cmd="$@"

until nc -z -v -w30 $host 2>/dev/null; do
  echo "Waiting for $host to be available..."
  sleep 1
done

echo "$host is up - executing command"
exec $cmd
