
To generate a self-signed certificate, run the following in your shell:


openssl req \
  -newkey rsa:2048 \
  -x509 \
  -new \
  -nodes \
  -keyout server.key \
  -out server.crt  \
  -subj /CN=test1   \
  -sha256  \
  -days 3650  \
  -addext "subjectAltName = DNS:foo.co.uk,IP:127.0.0.1,IP:192.168.1.1" \
  -addext "extendedKeyUsage = serverAuth"
  
  
  
  