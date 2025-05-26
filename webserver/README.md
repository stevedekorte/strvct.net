# WebServer - Shared Base Classes

This folder contains the shared base classes used by both the GameServer and AccountServer implementations.

## Architecture

The WebServer module provides a common foundation for building HTTPS/HTTP servers with request handling capabilities. Both GameServer and AccountServer extend these base classes to add their specific functionality.

## Classes

### BaseHttpsServer
The base server class that provides:
- HTTPS/HTTP server setup with configurable SSL certificates
- Request routing to handler classes
- Configurable hostname and port
- Protocol detection (HTTP vs HTTPS)

### BaseHttpsServerRequest  
The base request handler class that provides:
- URL parsing and query parameter extraction
- Path-based routing with customizable handlers
- File serving with MIME type detection
- ACME challenge support for SSL certificate validation
- Helper methods for JSON responses
- Request body reading and parsing
- Error handling utilities

### Supporting Classes
- **Base.js** - Base class with slot/property management
- **MimeExtensions.js** - MIME type detection for file extensions
- **AutoRelaunch.js** - Server auto-restart mechanism
- **getGlobalThis.js** - Cross-platform global object helper

## Usage

### GameServer
```javascript
const { BaseHttpsServer } = require("../../../../../../WebServer");

class SvHttpsServer extends BaseHttpsServer {
    serverName() {
        return "GameServer";
    }
    
    requestClass() {
        return SvHttpsServerRequest;
    }
}
```

### AccountServer
```javascript
const { BaseHttpsServer } = require("../../WebServer");

class StrvctHttpsServer extends BaseHttpsServer {
    serverName() {
        return "AccountServer";
    }
    
    requestClass() {
        return StrvctHttpsServerRequest;
    }
}
```

## Extension Points

When extending the base classes, override these methods:

### In your Server class:
- `serverName()` - Return your server's display name
- `requestClass()` - Return your custom request handler class

### In your Request handler class:
- `shouldHandleFileRequest(path)` - Determine if a path should be handled as a file
- `handleCustomRequest()` - Handle non-file requests (APIs, proxies, etc.)
- Add any custom routing logic by overriding the `process()` method

## Features

- **SSL/TLS Support** - Built-in HTTPS with certificate management
- **Static File Serving** - Automatic MIME type detection and caching headers
- **ACME Challenge** - Support for Let's Encrypt certificate validation
- **Extensible Routing** - Easy to add custom endpoints and handlers
- **Error Handling** - Consistent error responses with customizable messages
- **Request Body Parsing** - Built-in JSON body parsing utilities
- **CORS Support** - Can be added in subclasses as needed