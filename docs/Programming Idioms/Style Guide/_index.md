# Style Guide

Naming conventions, formatting rules, and code structure patterns.

## Classes

Class names use UpperCamelCase with a two-letter prefix indicating their origin:

- **`Sv`** -- framework classes: `SvNode`, `SvStorableNode`, `SvJsonGroup`, `SvNotificationCenter`
- **Application prefix** -- applications built on STRVCT should choose their own short prefix and use it consistently for all custom classes. The prefix doesn't need to be two characters -- any short, distinctive prefix works (`Uo`, `App`, `Xyz`). This prevents name collisions between framework, application, and third-party code.

The prefix is not applied to external libraries or JavaScript builtins extended via categories.

Acronyms are treated as a single capitalized unit: `SvJsonGroup` (not `SvJSONGroup`), `SvAiService`, `SvHttpResponseCodes`, `SvDbTable`.

**View classes** append `View` to the model class name. The framework uses this convention to automatically discover the view for a given node:

| Model class | View class |
|---|---|
| `SvNode` | `SvNodeView` |
| `SvField` | `SvFieldView` |

Classes use the self-initializing pattern -- the class expression is wrapped in parentheses and `.initThisClass()` is called inline:

```javascript
(class SvTimeFormatter extends SvNode {
    // ...
}.initThisClass());
```

This registers the class with the framework immediately upon evaluation.

## Slots

Slot names use lowerCamelCase. The slot system automatically generates a getter and setter from the name:

| Slot declaration | Getter | Setter |
|---|---|---|
| `newSlot("userName", "")` | `userName()` | `setUserName(value)` |
| `newSlot("is24Hour", false)` | `is24Hour()` | `setIs24Hour(value)` |
| `newSlot("subnodes", null)` | `subnodes()` | `setSubnodes(value)` |

Each slot declaration is wrapped in a block scope so `const slot` can be reused without naming collisions:

```javascript
initPrototypeSlots () {
    {
        const slot = this.newSlot("userName", "");
        slot.setSlotType("String");
    }
    {
        const slot = this.newSlot("isActive", false);
        slot.setSlotType("Boolean");
    }
}
```

### Boolean slots

Boolean slot names use a query-style prefix that reads naturally as a question:

| Prefix | Usage | Examples |
|---|---|---|
| `is` | Identity or state | `isComplete`, `isEditable`, `isLoggedIn` |
| `has` | Possession or presence | `hasShared`, `hasSelection` |
| `can` | Ability or permission | `canDelete`, `canReorderSubnodes`, `canInspect` |
| `should` | Configuration flags | `shouldStore`, `shouldStoreSlot`, `shouldStoreSubnodes` |
| `does` | Behavioral switches | `doesPadHours`, `doesHookSetter` |
| `shows` | Visibility toggles | `showsMeridiem`, `showsHours` |

## Instance Variables

Instance variables use an underscore prefix (`_userName`, `_isActive`) and are subject to three rules:

### 1. Always declare via `newSlot()`

Never assign an instance variable directly. All instance variables are created by the slot system in `initPrototypeSlots()`:

```javascript
// Correct
{
    const slot = this.newSlot("userName", "");
    slot.setSlotType("String");
}

// Wrong -- bypasses the slot system entirely
this._userName = "";
```

Declaring variables through `newSlot()` ensures they participate in the framework's infrastructure: getter/setter generation, dirty tracking, persistence, view synchronization, JSON Schema, and ARIA metadata. A manually assigned `_` variable gets none of this.

### 2. Internal access: use the getter

Within the same object, access instance variables through the generated getter (`this.userName()`), not directly (`this._userName`). The getter is the standard access path; direct access is reserved for rare, performance-critical cases where you intentionally need to skip hooks.

```javascript
// Standard -- uses the getter
formattedName () {
    return this.userName().toUpperCase();
}

// Avoid -- skips hooks, breaks the uniform access pattern
formattedName () {
    return this._userName.toUpperCase();
}
```

Bypassing the getter may seem harmless for reads, but it creates a maintenance hazard: if a subclass or category overrides the getter (to add lazy initialization, computed values, or delegation), direct `_` access silently bypasses that override.

### 3. External access: always use the getter

Accessing another object's instance variables directly (`other._userName`) is never acceptable. External code must always go through the public getter (`other.userName()`). This isn't just convention -- the setter performs dirty tracking for persistence, posts `didUpdateSlot` notifications, and schedules view sync. A direct `other._name = x` silently breaks storage, UI updates, and any observers watching that slot.

```javascript
// Correct
player.setUserName("Alice");
const name = player.userName();

// Wrong -- breaks persistence, notifications, and view sync
player._userName = "Alice";
const name = player._userName;
```

## Methods

Methods use lowerCamelCase. There is no `get` prefix -- a bare noun is the getter. This follows the Uniform Access Principle: `node.name()` and `node.formattedName()` look identical at call sites, so callers don't know or care whether a value is stored or computed. The naming doesn't leak implementation details into the API.

### Short methods

Methods should do one thing. If a method is growing long, extract named helper methods -- even if each helper is only called once. Small methods with descriptive names are easier to read, override, and debug than large methods with inline comments explaining each section.

### Method chaining

Setters and configuration methods return `this` to support chaining:

```javascript
slot.setSlotType("String").setShouldStoreSlot(true).setSyncsToView(true);
```

All `init` methods (`init()`, `finalInit()`, `afterInit()`) should also return `this`.

### Getters and setters

- **Getter**: `propertyName()` -- bare name, no prefix
- **Setter**: `setPropertyName(value)` -- `set` prefix, UpperCamelCase property name
- **Computed getters**: descriptive name for the derived value: `formattedValue()`, `visibleClassName()`, `hoursString()`

Do **not** use ES6 `get`/`set` property definitions. Beyond conflicting with the slot system, ES6 getters make property access and method calls syntactically indistinguishable -- `obj.name` could be a simple read or an expensive computation. With `obj.name()`, the parentheses consistently signal "this is a method call", which matters in a framework where slot access triggers hooks.

### Lifecycle methods

The initialization chain uses reserved names in a fixed order:

1. `initPrototypeSlots()` -- declare slots
2. `initPrototype()` -- configure class-wide behavior
3. `init()` -- basic instance setup
4. `finalInit()` -- complex initialization, object relationships
5. `afterInit()` -- post-initialization tasks

`initPrototypeSlots()` and `initPrototype()` should **never** call `super` -- the framework walks the class hierarchy automatically, calling each level in base-to-derived order. Adding `super` would cause each level to execute multiple times. The other init methods (`init()`, `finalInit()`, `afterInit()`) **should** call `super`.

### Event methods

Three prefix conventions distinguish when and how events are handled:

| Prefix | Timing | Examples |
|---|---|---|
| `will` | Before something happens | `willRemoveSubnode()` |
| `did` | After something happened | `didUpdateSlot()`, `didChangeSubnodeList()`, `didInit()` |
| `on` | In response to an external event | `onDragSourceBegin()`, `onSoundEnded()`, `onBrowserDropChunk()` |

`did` and `will` are typically used for internal lifecycle notifications. `on` is used for callbacks from other objects (delegates, gesture recognizers, external events).

### Async methods

Async methods use the `async` keyword and an `async` prefix in the method name:

```javascript
async asyncStoreBlob (blob) { ... }
async asyncGetBlob (hash) { ... }
async asyncCollectUnreferencedKeySet () { ... }
```

The prefix makes async operations searchable (`grep "asyncLoad"` finds all of them) and self-documenting at call sites -- `await node.asyncLoadChildren()` is immediately clear without checking the declaration.

### Factory methods

- `clone()` -- standard instantiation (called on the class: `SvNode.clone()`)
- `shared()` -- singleton access (called on the class: `SvNotificationCenter.shared()`)
- `newSlot()`, `newSubnode()`, `newObservation()` -- create and return a child object owned by the receiver

## Categories

Category files use an underscore to separate the base class name from the category purpose:

```
SvJsonGroup.js                  // base class
SvJsonGroup_patches.js          // JSON Patch operations
SvJsonGroup_clientState.js      // client state tool methods
SvTile_dragging.js              // drag behavior
SvTile_keyboard.js              // keyboard handling
```

The category class name matches the filename: `SvJsonGroup_patches`, `SvTile_dragging`. The underscore convention makes it easy to see at a glance which class is being extended and what the extension adds.

See [Categories](../Categories/index.html) for details on how categories work.

## Protocols

Protocol class names **must** end with `Protocol` (enforced at runtime by `initThisProtocol()`):

```
SvAudioClipProtocol
SvAudioClipDelegateProtocol
SvDragSourceProtocol
SvDragDestinationProtocol
```

Delegate protocols follow the pattern `SvThingDelegateProtocol` -- naming the object that receives the callbacks, not the object that sends them.

Protocol files follow the standard one-class-per-file rule and live alongside the classes they relate to, not in a central directory:

```
library/node/audio/SvAudioClipProtocol.js
library/node/audio/SvAudioClipDelegateProtocol.js
library/node/node_views/.../SvTilesView/SvDragSourceProtocol.js
library/node/node_views/.../SvTilesView/SvDragDestinationProtocol.js
```

See [Protocols](../Protocols/index.html) for details on defining and implementing protocols.

## Files and directories

**One class per file.** The filename matches the class name: `SvNode.js`, `SvTimeFormatter.js`. Category files follow the `ClassName_category.js` pattern. This makes finding a class's source trivial -- the filename is the class name -- and matches the `_imports.json` resource loading system's assumption of one declaration per file.

**No import/require.** STRVCT uses its own resource loading system based on `_imports.json` files, not standard JavaScript modules. The CAM (Content-Addressable Memory) loader provides content-based caching, deduplication, and atomic updates that standard ES modules can't. Do not add `import` or `require` statements to framework code.

**Directory names** are lowercase or lowerCamelCase, organized by function:

| Directory | Purpose |
|---|---|
| `library/ideal/` | Base classes, formatters, utilities |
| `library/node/` | Node hierarchy, storage, views |
| `library/view/` | View layer, DOM abstractions |
| `library/services/` | AI, cloud storage, media services |
| `browser-only/` | Excluded in Node.js environments |
| `server-only/` | Excluded in browser environments |

## Notifications

Notification names follow the `did`/`will` pattern used by event methods. When stored as a slot for reuse, they use a `Note` suffix:

```javascript
// Declaring a notification slot
this.newSlot("didUpdateNodeNote", null);

// Posting
this.postNoteNamed("onRequestNavigateToNode", this);
```

## Slot types

The `setSlotType()` method takes a string matching either a JavaScript built-in or a STRVCT class name:

- **Primitives**: `"String"`, `"Number"`, `"Boolean"`, `"Array"`, `"Date"`
- **Framework types**: `"SvNode"`, `"SvNotification"`, `"SvSubnodesArray"`
- **Semantic types**: `"Action"`, `"UUID"`, `"Integer"`, `"Float"`

These are used for type checking, JSON Schema generation, and documentation -- not for runtime enforcement in most cases.

## Things to avoid

- **ES6 `get`/`set` property definitions** -- use `foo()` / `setFoo()` instead. ES6 getters hide method calls behind property-access syntax, making it impossible to distinguish a simple read from a computation with side effects.
- **`import` / `require`** -- use the `_imports.json` resource loading system. The CAM loader provides content-based caching and atomic updates that standard ES modules can't.
- **`super` in `initPrototypeSlots` / `initPrototype`** -- the framework walks the hierarchy automatically. Adding `super` causes each level to execute multiple times.
- **`instance.hasOwnProperty()`** -- use `Object.hasOwn(instance, key)` instead. `hasOwnProperty` is a prototype method that can be shadowed by an object's own property; `Object.hasOwn()` is a static method that can't be overridden.
- **Plain objects as dictionaries** -- use `Map` for key-value collections. Plain objects risk prototype pollution (`toString`, `constructor` as key names), only support string keys, and lack `.size`.
- **Direct instance variable access** -- see [Instance Variables](#instance-variables) for the full rules. In short: always use the getter.

## Formatting

Style rules enforced by ESLint:

- **Space before parentheses** in all function and method declarations: `initPrototype () {`, not `initPrototype() {`. This isn't just cosmetic -- it makes text search unambiguous: `methodName (` finds definitions, `methodName(` finds call sites.
- **Four-space indentation**, no tabs.
- **Semicolons required** at the end of statements. Avoids Automatic Semicolon Insertion edge cases, which matters more than usual in a codebase that loads code via `eval`.

These apply to function declarations, expressions, async functions, and method definitions uniformly.
