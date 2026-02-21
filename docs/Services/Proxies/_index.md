# Proxies

Client-side proxy configuration for routing API calls through intermediary servers.

## Overview

These classes do not run proxy servers — they are client-side configuration nodes that store proxy server connection details and rewrite API URLs to route through a proxy. The actual proxy server (e.g. a Firebase Function or local HTTPS reverse proxy) runs separately.

The primary use case is routing AI service API calls through a proxy that holds the real API keys, so that browser clients never see provider credentials directly. The client sends a Firebase user auth token to the proxy, and the proxy adds the appropriate API key before forwarding the request.

## ProxyServers

`ProxyServers` is a singleton collection of `ProxyServer` entries, accessible via `ProxyServers.shared()`. In practice, a single `DefaultProxyServer` entry handles all routing, accessible via `ProxyServers.shared().defaultServer()`.

Users can add, remove, and reorder proxy entries through the generated inspector UI. All entries are persisted to IndexedDB.

## ProxyServer

Each `ProxyServer` node stores the connection details for one proxy endpoint:

| Slot | Type | Default | Purpose |
|---|---|---|---|
| `isSecure` | Boolean | `true` | Use `https` or `http` |
| `subdomain` | String | `""` | Optional subdomain prefix |
| `domain` | String | `""` | Base domain (e.g. `localhost`, `example.com`) |
| `port` | Number | `0` | Port number (0 or null omits port from URL) |
| `path` | String | `""` | URL path (e.g. `/proxy`) |
| `parameterName` | String | `null` | Query parameter name for the target URL |
| `isDisabled` | Boolean | `false` | When true, returns target URLs unchanged |

All configuration slots are persisted and editable through the generated inspector.

### URL Rewriting

The core method is `proxyUrlForUrl(targetUrl)`, which rewrites a direct API URL into a proxied one:

```
Target:  https://api.openai.com/v1/chat/completions
Proxied: https://localhost:8443/proxy?proxyUrl=https%3A%2F%2Fapi.openai.com%2Fv1%2Fchat%2Fcompletions
```

The target URL is passed as a query parameter (named by `parameterName`), so the proxy server can decode it, forward the request to the real provider, and stream the response back.

If `isDisabled` is true, the target URL is returned unchanged — useful for direct API access during development.

## DefaultProxyServer

`DefaultProxyServer` extends `ProxyServer` and auto-configures itself from the browser's current page URL on startup. For a page served at `https://localhost:8443`, it defaults to:

- `isSecure`: `true`
- `hostname`: `localhost`
- `port`: `8443`
- `path`: `/proxy`
- `parameterName`: `"proxyUrl"`

This means the proxy is assumed to run on the same origin as the application by default. Applications can override these settings programmatically via `setupForConfigDict()` using build-time environment configuration.

## Integration with AI Services

`AiRequest` has a `needsProxy` slot (default `true`). When making an API call, the request checks this flag and rewrites the URL if needed:

```javascript
async activeApiUrl () {
    let url = this.apiUrl();  // e.g. "https://api.openai.com/v1/chat/completions"
    if (this.needsProxy()) {
        url = ProxyServers.shared().defaultServer().proxyUrlForUrl(url);
    }
    return url;
}
```

This applies to all AI service requests (chat, image generation, text-to-speech, video generation) and also to image/media downloads that would otherwise be blocked by CORS in production.
