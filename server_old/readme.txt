
To generate a self-signed certificate, run the following in your shell:


openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem

To run:

node app.js

To test:

curl -k https://localhost:8000


To use in chrome, you may need to do:

chrome://flags/#allow-insecure-localhost



/*
local_openssl_config="
[ req ]
prompt = no
distinguished_name = req_distinguished_name
x509_extensions = san_self_signed
[ req_distinguished_name ]
CN=$hostname
[ san_self_signed ]
subjectAltName = IP:1.2.3.4
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = CA:true
keyUsage = nonRepudiation, digitalSignature, keyEncipherment, dataEncipherment, keyCertSign, cRLSign
extendedKeyUsage = serverAuth, clientAuth, timeStamping
"

openssl req \
  -newkey rsa:2048 -nodes \
  -keyout "cert.key" \
  -x509 -sha256 -days 3650 \
  -config <(echo "$local_openssl_config") \
  -out "cert.crt"
openssl x509 -noout -text -in "cert.crt"
*/