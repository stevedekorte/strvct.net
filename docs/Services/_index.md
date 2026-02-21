# Services

AI, cloud, media, and IoT service integrations.

## Overview

The `Services` singleton is the root container for all service integrations. Each service is a standard Strvct node with slots, persistence, and automatic UI — the same patterns used for domain objects apply to service configuration. Users can inspect and configure services (API keys, model selection, proxy settings) through the generated interface without any custom settings UI.

## Architecture

Services follow the node/slot pattern but are not a single class hierarchy. AI services share a common base class (`AiService`), while non-AI services (Firebase, YouTube, Speech-to-Text) extend `SvSummaryNode` or `SvStorableNode` directly. What unifies them is the Strvct infrastructure: slots for configuration, notifications for state changes, and automatic UI generation for settings.

```
Services (singleton)
 ├── AI Services (extend AiService)
 │    ├── AnthropicService      — Claude models
 │    ├── GeminiService         — Gemini models
 │    │    └── Text to Video    — Video generation prompts
 │    ├── OpenAiService         — GPT models
 │    │    ├── Text to Image    — DALL-E image generation
 │    │    ├── Text to Speech   — TTS sessions
 │    │    └── Style Transfers  — Image style transfer
 │    ├── ImagineProService     — Midjourney via ImaginePro API
 │    │    └── Image Prompts    — Image generation prompts
 │    ├── GroqService           — Fast inference
 │    ├── DeepSeekService       — DeepSeek models
 │    └── XaiService            — Grok models
 │
 ├── Cloud Storage
 │    └── FirebaseService
 │         ├── Firestore Database — Document database
 │         └── Firebase Storage   — File hosting
 │
 ├── Media Services
 │    ├── YouTubeService
 │    │    └── Audio Player     — Music/audio playback
 │    └── SpeechToTextSessions  — Browser speech recognition
 │
 ├── Infrastructure
 │    └── ProxyServers          — Configurable API proxies
 │
 └── IoT
      └── HomeAssistants        — Home Assistant integration
```

## AiServiceKit

`AiServiceKit` is the shared infrastructure that all AI services build on. It defines the base classes, request handling, conversation management, tool calling, response parsing, and prompt composition.

### AiService

The base class for AI service providers. Each subclass is a singleton representing one provider (Anthropic, OpenAI, Gemini, etc.). Key responsibilities:

- **Authentication** — `apiKeyOrUserAuthToken()` prefers a Firebase bearer token from `SvCredentialManager`, falling back to a stored API key. This allows both direct API access during development and proxied access through Firebase Functions in production.
- **Model registry** — Each service defines a `modelsJson()` method returning its available models with context limits and capability flags (temperature, top-p, image generation, etc.).
- **Request class resolution** — `chatRequestClass()` uses naming convention (`GeminiService` resolves to `GeminiRequest`) so no explicit registration is needed when adding providers.

### AiChatModel

Represents one model offered by a service. Slots include `modelName`, `inputTokenLimit`, `outputTokenLimit`, and capability flags like `supportsTemperature`, `supportsTopP`, and `supportsImageGeneration`. The `Services` node exposes helper methods to query models across all providers: `chatModels()`, `chatModelNames()`, `chatModelWithName()`.

### AiRequest

The base HTTP request wrapper for API calls. Manages streaming responses via a delegate protocol:

- `onRequestBegin` / `onRequestComplete` / `onRequestError`
- `onStreamStart` / `onStreamData` / `onStreamEnd`

Each AI service has a paired request subclass (e.g. `AnthropicRequest`, `GeminiRequest`) that handles provider-specific message formatting, headers, and response parsing. This is the only class that needs to know about the provider's wire format.

### Conversations and Messages

`AiConversation` extends a generic `Conversation` base class, adding AI-specific state: the selected chat model, token tracking, response message class, and tool call management. `AiMessage` extends `ConversationMessage` with role support (system, user, assistant), where role names are mapped to each provider's conventions by the service.

### Tool Calling

The `AssistantToolKit` coordinates structured function calling between AI models and application code:

- **`ToolDefinitions`** — A registry of available tools, each defined with a name, description, typed parameters, and return types.
- **`ToolCalls`** — A queue of pending and completed invocations from the AI.
- **Execution timing** — Tools can run during streaming (real-time effects like sound), after response completion (state changes), or during narration playback (synchronized audio effects).

Tools are defined on model objects using the slot/method system:

```javascript
const tool = this.methodNamed("rollDice");
tool.setDescription("Roll dice for a check");
tool.addParameter("notation", "String", "Dice notation like 2d6+3");
tool.setIsToolable(true);
```

The AI invokes tools via structured tags in its response. Results are collected and — for non-silent tools — sent back to the AI in a follow-up message.

### Response Parsing

`AiParsedResponseMessage` handles structured tag extraction from AI responses. Tags like `<tool-call>`, `<narration>`, `<quote>`, and `<sentence>` are parsed incrementally during streaming, enabling real-time processing before the full response arrives. A voice narration category routes speakable content to the TTS pipeline as it's parsed.

### Prompt Composition

`AiPromptComposer` assembles prompts from modular template files using three substitution patterns:

- `{{file$FileName.txt}}` — Include the contents of another file (recursive)
- `{{$methodName}}` — Call a method on the target object and insert the result
- `{{$tableOfContents}}` — Auto-generate a table of contents from headings

This allows complex system prompts to be built from reusable, domain-specific components without string concatenation in code.

## AI Services

Each AI provider is implemented as a service/request pair. The service defines available models and authentication; the request handles the provider's specific API format.

| Service | Provider | Key Capabilities |
|---|---|---|
| `AnthropicService` | Anthropic | Claude models, tool calling with Anthropic-specific schema |
| `GeminiService` | Google | Gemini models, text-to-video generation |
| `OpenAiService` | OpenAI | GPT models, DALL-E image generation, text-to-speech, style transfer |
| `ImagineProService` | ImaginePro | Midjourney image generation via API |
| `GroqService` | Groq | Fast inference with OpenAI-compatible API |
| `DeepSeekService` | DeepSeek | Code-focused models |
| `XaiService` | xAI | Grok models with OpenAI-compatible API |

### Adding a New AI Provider

Adding a provider requires two classes and one registration:

1. **`NewProviderService`** extending `AiService` — define `modelsJson()` with available models, set the endpoint URL, and configure role name mappings if they differ from the defaults.
2. **`NewProviderRequest`** extending `AiRequest` — implement `buildBody()` for the provider's message format and `readDataChunk()` for streaming response parsing.
3. **Register** the service as a slot in `Services.initPrototypeSlots()`.

The naming convention (`NewProviderService` resolves to `NewProviderRequest`) handles the wiring automatically. If the provider uses an OpenAI-compatible API, the request class can be minimal.

## Cloud Storage Services

### FirebaseService

Integrates with Firebase for cloud persistence and file storage. Unlike AI services, `FirebaseService` extends `SvSummaryNode` directly and contains two sub-services:

- **`FirestoreDatabaseService`** — Document and collection access via Firestore. Provides query building, real-time listeners, and CRUD operations through Strvct node wrappers (`FirestoreNode`, `FirestoreQuery`).
- **`FirebaseStorageService`** — File upload and download via Firebase Storage, with permission management.

## Media Services

### YouTubeService

Manages YouTube-based audio playback using an iframe-embedded player. Used for background music during game sessions. Contains a `YouTubeAudioPlayer` subnode with playback controls.

### SpeechToTextSessions

Wraps the browser's native `SpeechRecognition` API for voice input. Each session tracks recognition state, language settings, and transcription results via a delegate pattern. Not a cloud service — all processing happens in the browser.

## Infrastructure

### ProxyServers

A collection of configurable reverse-proxy server entries. Used to route API calls through a local or cloud proxy (e.g. Firebase Functions) rather than calling provider APIs directly from the browser. Each `ProxyServer` node has slots for domain, subdomain, port, and security settings — all editable through the generated inspector UI.

## IoT

### HomeAssistants

Integration with Home Assistant instances for IoT device control. The entire Home Assistant entity model (areas, devices, entities, states) is mapped to Strvct nodes, making the HA hierarchy navigable and inspectable through the standard UI. Supports multiple HA instances.
