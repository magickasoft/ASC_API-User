#!/bin/bash
SRV_NAME="api-user"
docker stop $SRV_NAME
docker rm --force $SRV_NAME
docker rmi --force asc/$SRV_NAME

#tar cvzf asc.tar.gz -C ./  ../package.json ../[a-z]*/ --exclude='node_modules' --exclude='container'
tar cvzf asc.tar.gz -C ./ ./package.json ./auth/* ./config/* ./lib/* ./models/* ./routes/* ./server/* ./swagger/*

docker build -t asc/$SRV_NAME .

rm -rf asc.tar.gz

./run.sh
