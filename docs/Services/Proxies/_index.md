# Proxies

Configurable reverse-proxy servers for API routing.

## ProxyServers

A collection of configurable reverse-proxy server entries. Used to route API calls through a local or cloud proxy (e.g. Firebase Functions) rather than calling provider APIs directly from the browser. Each `ProxyServer` node has slots for domain, subdomain, port, and security settings — all editable through the generated inspector UI.
