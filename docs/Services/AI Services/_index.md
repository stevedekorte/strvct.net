# AI Services

Framework architecture for multi-provider AI integration, streaming execution, tool calling, and model-first operability.

## Introduction & The Model-First AI Advantage

Strvct provides a comprehensive, multi-provider AI infrastructure built directly into the framework. Unlike traditional applications where AI integration requires writing bespoke API wrappers, per-screen tool specifications, and custom JSON serializers, Strvct's **Naked Objects** architecture makes the entire domain model **natively AI-operable** out of the box.

Because every domain class declares instance properties as **slots** with metadata annotations (`slotType`, `canEditInspection`, `isSubnodeField`), Strvct exposes a universal AI tool surface consisting of just two generic, constant-size functions:

1. **`schema-fetch`**: Inspects slot metadata to generate JSON schemas for any domain class or live object instance.
2. **`apply-patch`**: Validates and applies JSON patch payloads to mutate properties or update child relationships on live domain objects.

<svg viewBox="0 0 820 230" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="aai" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- Row 1: AI Agent (x: 25) -> Generic Tool Surface (x: 290) -->
  <rect class="box" x="25" y="20" width="240" height="50"/>
  <text x="40" y="38" class="b">AI Agent / LLM</text>
  <text x="40" y="56" class="dim">Generates JSON patches</text>

  <line class="flow" x1="265" y1="45" x2="290" y2="45" marker-end="url(#aai)"/>

  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="38" class="b">Generic Tool Surface</text>
  <text x="305" y="56" class="dim">schema-fetch &amp; apply-patch</text>

  <!-- Straight Down Flow to Annotation Bridge -->
  <line class="flow" x1="410" y1="70" x2="410" y2="95" marker-end="url(#aai)"/>

  <!-- Row 2: Strvct Annotation Bridge (x: 290) directly below Generic Tool Surface -->
  <rect class="fill" x="290" y="95" width="240" height="50"/>
  <text x="305" y="113" class="b">Strvct Annotation Bridge</text>
  <text x="305" y="131" class="dim">Slot metadata annotations</text>

  <!-- Flow to Bottom Row (3 Columns) -->
  <line class="flow" x1="410" y1="145" x2="410" y2="158"/>
  <line class="flow" x1="145" y1="158" x2="675" y2="158"/>

  <line class="flow" x1="145" y1="158" x2="145" y2="170" marker-end="url(#aai)"/>
  <line class="flow" x1="410" y1="158" x2="410" y2="170" marker-end="url(#aai)"/>
  <line class="flow" x1="675" y1="158" x2="675" y2="170" marker-end="url(#aai)"/>

  <!-- Row 3: 3 Uniform Boxes (x: 25, 290, 555) -->
  <rect class="box" x="25" y="170" width="240" height="50"/>
  <text x="40" y="188" class="b">UI Tile Updates</text>
  <text x="40" y="206" class="dim">Live view renders</text>

  <rect class="box" x="290" y="170" width="240" height="50"/>
  <text x="305" y="188" class="b">IndexedDB Pool</text>
  <text x="305" y="206" class="dim">Local persistence</text>

  <rect class="box" x="555" y="170" width="240" height="50"/>
  <text x="570" y="188" class="b">Sync Scheduler</text>
  <text x="570" y="206" class="dim">Deferred notifications</text>
</svg>

This tool surface remains **constant in size** whether an application contains 5 domain classes or 500. When an AI agent generates an invalid patch, the framework's rejected response returns the slot schema, enabling the LLM to self-correct in real time.

---

## Service & Request Factory Architecture

AI providers are implemented as paired service and request singletons inheriting from base infrastructure classes:

- **`SvAiService`**: High-level provider service singleton (e.g., `SvAnthropicService`, `SvGeminiService`, `SvOpenAiService`). Manages authentication, endpoint resolution, and model capability registries.
- **`SvAiRequest`**: Low-level HTTP request wrapper handling message formatting, custom headers, and streaming chunk parsing.

<svg viewBox="0 0 820 170" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="asv" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="40" class="b">SvAiService</text>
  <text x="305" y="58" class="dim">Base Provider Service</text>

  <line class="flow" x1="410" y1="70" x2="410" y2="85"/>
  <line class="flow" x1="145" y1="85" x2="675" y2="85"/>

  <line class="flow" x1="145" y1="85" x2="145" y2="100" marker-end="url(#asv)"/>
  <line class="flow" x1="410" y1="85" x2="410" y2="100" marker-end="url(#asv)"/>
  <line class="flow" x1="675" y1="85" x2="675" y2="100" marker-end="url(#asv)"/>

  <rect class="box" x="25" y="100" width="240" height="50"/>
  <text x="40" y="120" class="b">SvAnthropicService</text>
  <text x="40" y="138" class="dim">Pairs with SvAnthropicRequest</text>

  <rect class="box" x="290" y="100" width="240" height="50"/>
  <text x="305" y="120" class="b">SvGeminiService</text>
  <text x="305" y="138" class="dim">Pairs with SvGeminiRequest</text>

  <rect class="box" x="555" y="100" width="240" height="50"/>
  <text x="570" y="120" class="b">SvOpenAiService</text>
  <text x="570" y="138" class="dim">Pairs with SvOpenAiRequest</text>
</svg>

### Automatic Factory Resolution

`SvAiService` resolves its paired request class dynamically using naming conventions (`SvGeminiService` automatically pairs with `SvGeminiRequest`). Adding a new AI provider requires implementing the service and request subclass without registering explicit factory hooks.

### Authentication & Token Flow

Authentication is resolved via `apiKeyOrUserAuthToken()`:
1. First checks `SvCredentialManager` for a Firebase bearer token (for production apps proxying requests through Firebase Cloud Functions to protect secrets).
2. Falls back to a client-stored API key (for local development or direct user API key entry).

---

## AI Model Registry (`SvAiChatModel`)

`SvAiChatModel` represents a specific LLM model instance (e.g., `claude-3-5-sonnet`, `gemini-1.5-pro`, `gpt-4o`). Each model definition includes:

- `modelName`: Standard provider model identifier string.
- `inputTokenLimit` / `outputTokenLimit`: Context window limits.
- Capability Flags: `supportsTemperature`, `supportsTopP`, `supportsImageGeneration`, `supportsVideoGeneration`, `supportsTools`.

The global `Services` node provides global helper methods to query models across all registered providers:

```javascript
const models = Services.shared().aiServices().chatModels();
const model  = Services.shared().aiServices().chatModelWithName("claude-3-5-sonnet");
```

---

## Conversations & Messaging (`SvAiConversation` & `SvAiMessage`)

`SvAiConversation` manages conversational state, token counts, system prompts, tool call history, and active LLM chat requests.

- **`SvAiMessage`**: Extends standard conversation messages with role designations (`system`, `user`, `assistant`).
- **Role Mapping**: Provider services map generic role names to provider-specific conventions automatically (e.g., mapping `assistant` to `model` for Gemini APIs).

---

## The Assistant ToolKit & Function Execution

Structured tool calling is coordinated by `SvAssistantToolKit`:

<svg viewBox="0 0 820 170" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="atk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- Row 1: 2 Boxes (w: 240, h: 50) -->
  <rect class="box" x="140" y="20" width="240" height="50"/>
  <text x="155" y="38" class="b">AI Response Stream</text>
  <text x="155" y="56" class="dim">&lt;tool-call name="rollDice"&gt;</text>

  <line class="flow" x1="380" y1="45" x2="440" y2="45" marker-end="url(#atk)"/>

  <rect class="fill" x="440" y="20" width="240" height="50"/>
  <text x="455" y="38" class="b">SvAssistantToolKit</text>
  <text x="455" y="56" class="dim">Function Dispatcher</text>

  <!-- Flow to Row 2 -->
  <line class="flow" x1="560" y1="70" x2="560" y2="85"/>
  <line class="flow" x1="260" y1="85" x2="560" y2="85"/>

  <line class="flow" x1="260" y1="85" x2="260" y2="100" marker-end="url(#atk)"/>
  <line class="flow" x1="560" y1="85" x2="560" y2="100" marker-end="url(#atk)"/>

  <!-- Row 2: 2 Boxes (w: 240, h: 50) -->
  <rect class="box" x="140" y="100" width="240" height="50"/>
  <text x="155" y="120" class="b">Streaming Execution</text>
  <text x="155" y="138" class="dim">Triggers audio &amp; FX inline</text>

  <rect class="box" x="440" y="100" width="240" height="50"/>
  <text x="455" y="120" class="b">Completion State Patch</text>
  <text x="455" y="138" class="dim">Mutates live domain nodes</text>
</svg>

### 1. Tool Registration
Methods on model nodes are marked as toolable during slot setup:

```javascript
const tool = this.methodNamed("rollDice");
tool.setDescription("Roll dice for a combat check");
tool.addParameter("notation", "String", "Standard dice notation like 2d6+3");
tool.setIsToolable(true);
```

### 2. Execution Timing Phases
Tools execute at specific points in the response lifecycle:
- **Streaming Phase (`onStreamData`):** Executes in real time while tokens arrive (e.g., playing a sound effect or triggering a UI animation).
- **Completion Phase (`onRequestComplete`):** Executes after the full response is validated (e.g., applying state mutations to domain nodes).
- **Narration Phase (`onPlayback`):** Executes synchronized with Text-To-Speech (TTS) voice audio playback.

---

## Incremental Streaming Response Parser (`SvAiParsedResponseMessage`)

AI responses arrive as continuous token streams. `SvAiParsedResponseMessage` parses structured XML tags incrementally during streaming without waiting for full response completion:

- `<tool-call>`: Extracted and dispatched immediately to `SvAssistantToolKit`.
- `<narration>`: Extracted and routed directly to the TTS voice audio queue for zero-latency speech synthesis.
- `<thought>` / `<quote>` / `<sentence>`: Extracted for structured UI display in chat message views.

---

## Modular Prompt Composition (`SvAiPromptComposer`)

`SvAiPromptComposer` builds complex system prompts dynamically using modular text template files without manual string concatenation in JavaScript:

```
[ Template File: SystemPrompt.txt ]
"System rules: {{file$Rules.txt}}
 Current Character: {{$characterSummary}}
 Available Actions: {{$tableOfContents}}"
```

### Supported Substitution Directives:
1. `{{file$Path/ToFile.txt}}`: Recursively embeds the contents of a secondary prompt template file.
2. `{{$methodName}}`: Executes a getter method on the target domain object and inserts the string result.
3. `{{$tableOfContents}}`: Generates a structured table of contents from headings in the prompt document.

---

## Provider Support Matrix

| Service Class | Provider | Key Capabilities & Models |
|---|---|---|
| `SvAnthropicService` | Anthropic | Claude 3.5 Sonnet, Claude 3 Opus, native tool use |
| `SvGeminiService` | Google | Gemini 1.5 Pro/Flash, text-to-video, multimodal inputs |
| `SvOpenAiService` | OpenAI | GPT-4o, DALL-E 3 image generation, TTS voice synthesis |
| `SvGroqService` | Groq | Ultra-low-latency inference (OpenAI compatible) |
| `SvDeepSeekService` | DeepSeek | DeepSeek V3 / R1 reasoning models |
| `SvXaiService` | xAI | Grok 2 models (OpenAI compatible) |
| `SvImagineProService`| ImaginePro | Midjourney image generation via proxy API |

---

## Adding a New AI Provider

To add a new AI provider, implement two classes following naming conventions:

1. **Service Subclass (`SvNewProviderService.js`):**
   ```javascript
   (class SvNewProviderService extends SvAiService {
       modelsJson () {
           return [
               { name: "new-model-v1", inputTokenLimit: 128000, outputTokenLimit: 4096 }
           ];
       }
   }.initThisClass());
   ```

2. **Request Subclass (`SvNewProviderRequest.js`):**
   ```javascript
   (class SvNewProviderRequest extends SvAiRequest {
       buildBody () {
           // Format message payload for API endpoint
       }
       readDataChunk (chunk) {
           // Parse streaming SSE chunks
       }
   }.initThisClass());
   ```

3. **Slot Registration:** Declare the new service slot in `Services.initPrototypeSlots()`. The service/request factory automatically binds `SvNewProviderService` to `SvNewProviderRequest`.
