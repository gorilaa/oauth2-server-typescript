#!/bin/bash
cd ..

echo | ssh-keygen -t rsa -b 4096 -m PEM -f oauth2.key -P ''

openssl rsa -in oauth2.key -pubout -outform PEM -out oauth2.key.pub

mv oauth2.key oauth-private.key
mv oauth2.key.pub oauth-public.key