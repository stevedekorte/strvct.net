
## local web server

This is a minimal HTTPS web server for local testing. 
The command to run in the console is:

  node server.js


# generating a certificate

There should already be a self signed cerififcate in this folder,
but if not, or if it's expired, here's how to generate a new one:

Run the following in your shell:

  openssl req \
    -newkey rsa:2048 \
    -x509 \
    -new \
    -nodes \
    -keyout server.key \
    -out server.crt  \
    -subj /CN=test1   \
    -sha256  \
    -days 3650 
  
  
This key doesn't need to be kept secret as it's just to run a local web server for testing.
  