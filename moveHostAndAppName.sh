#!/bin/sh

NEW_HOST=$1
NEW_APP=$2

grep tekmonks.com -l -I -r . | xargs sed -i 's/tekmonks.com/'$NEW_HOST'/g'

grep 'apps/tekmonks' -l -I -r . | xargs sed -i 's=apps/tekmonks='$NEW_APP'=g'

cp frontend/$NEW_APP/index_monkshu.html ../monkshu/frontend/index.html

cp -R frontend/$NEW_APP/img ../monkshu/frontend/img
