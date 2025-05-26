# WebServer Redesign Notes

## Overview
Redesign the WebServer to use a plugin-based architecture where request handlers are loaded dynamically from a configuration file.

## Key Changes

### 1. BaseHttpsServer Changes
- Remove the need for server subclasses (GameHttpsServer, AccountHttpsServer)
- Add support for `--config` command line argument
- Load request handler classes dynamically from config file
- Use a plugin pattern where handlers are selected based on `canHandleUrl()` method

### 2. Request Handler Classes
Split BaseHttpsServerRequest into multiple specialized classes:
- **AcmeChallengeRequest** - Handles ACME challenge requests
- **FileRequest** - Handles static file serving (catch-all)

Each request handler must implement:
- `static canHandleUrl(urlObject)` - Returns true if can handle the URL
- `process()` - Handles the request

### 3. Configuration File Format
```json
{
  "requestClasses": [
    {
      "className": "AcmeChallengeRequest",
      "path": "./requests/AcmeChallengeRequest.js"
    },
    {
      "className": "FileRequest",
      "path": "./requests/FileRequest.js"
    }
  ]
}
```

### 4. Usage Changes

#### Old Way (GameServer):
```javascript
const GameHttpsServer = require("./GameHttpsServer.js");
const server = GameHttpsServer.clone();
server.setPort(8000);
server.run();
```

#### New Way:
```javascript
const { BaseHttpsServer } = require("../WebServer");
const server = BaseHttpsServer.clone();
server.setPort(8000);
server.setConfigPath("./game-server-config.json");
server.run();
```

### 5. Server-Specific Request Handlers

For GameServer, create:
- **GameErrorLogRequest** - Handles /log_error endpoint
- **GameProxyRequest** - Handles proxy requests
- **GameFileRequest** - Extends FileRequest with game-specific logic

For AccountServer, create:
- **AccountAuthRequest** - Handles /auth/* endpoints
- **AccountApiRequest** - Handles /api/* endpoints
- **AccountProxyRequest** - Handles AI API proxy requests
- **AccountStripeRequest** - Handles Stripe endpoints
- **AccountFileRequest** - Extends FileRequest with template processing

### 6. Benefits
- No need for server subclasses
- Easy to add new request handlers
- Clear separation of concerns
- Reusable request handlers across servers
- Configuration-driven architecture

### 7. Migration Path
1. Implement the new BaseHttpsServer with config loading
2. Create the base request handler classes
3. Create server-specific request handlers
4. Update main.js files to use new pattern
5. Remove old server subclasses
6. Test thoroughly