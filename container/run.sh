#!/bin/bash
SRV_NAME="api-user"
docker stop $SRV_NAME
docker rm $SRV_NAME
docker run -p 3000:3000 -d --name $SRV_NAME asc/$SRV_NAME
