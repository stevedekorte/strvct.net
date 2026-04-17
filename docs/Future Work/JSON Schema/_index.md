# JSON Schema

Expanding auto-generated JSON Schema coverage across slots, classes, and the domain model.

## Context

STRVCT automatically generates JSON Schema from the domain model — classes produce object schemas, slots produce property schemas, and cross-references between classes produce `$ref` and `definitions` entries. These schemas are used for AI tool calls (constraining function parameters), data exchange, and validation.

The current implementation covers the most common schema features, but there are gaps at both the slot level (individual property constraints) and the class level (object-wide constraints and composition). Closing these gaps would make the auto-generated schemas more precise, which directly improves AI behavior — tighter schemas reduce hallucinated parameters and improve structured output quality.

## Current Coverage

### Class-level (SvNode)

`SvNode.asJsonSchema()` generates object schemas with:

| JSON Schema keyword | Source | Notes |
|---|---|---|
| `type` | Always `"object"` | |
| `description` | `jsonSchemaDescription()` | Static method on each class |
| `properties` | `jsonSchemaProperties()` | Composed from slots marked `isInJsonSchema` |
| `required` | `jsonSchemaRequired()` | From slots marked `isRequired` |
| `additionalProperties` | `additionalProperties()` | Boolean — whether extra keys are accepted |
| `readOnly` | `jsonSchemaIsReadOnly()` | Optional, class-wide |
| `title` | `jsonSchemaTitle()` | Only emitted when different from class name |
| `$ref` | `jsonSchemaRef()` | For cross-class references |
| `definitions` | `jsonSchemaDefinitionsForRefSet()` | Collects all referenced classes recursively |

### Slot-level (Slot)

`Slot.asJsonSchema()` generates property schemas with:

| JSON Schema keyword | Slot API | Notes |
|---|---|---|
| `type` | `setSlotType()` | Mapped to JSON Schema types |
| `description` | `setDescription()` | |
| `title` | Auto-generated | From slot name |
| `default` | `initValue()` | When not `undefined` |
| `enum` | `setValidValues()` / `setValidItems()` | |
| `examples` | `setExamples()` | |
| `pattern` | `setJsonSchemaPattern()` | String regex |
| `readOnly` | `setIsReadOnly()` | |
| `items` | `setJsonSchemaItemsType()` | Array item type, description, uniqueItems, $ref |
| `properties` | `setFinalInitProto()` | Nested object schemas |
| `$ref` | Auto-generated | For slots referencing node classes |

## Missing Slot-Level Keywords

These JSON Schema keywords have no corresponding slot annotation yet:

### Numeric constraints

- **`minimum` / `maximum`** — bounded ranges for Number slots (e.g., ability scores 1–30, hit points 0–999)
- **`exclusiveMinimum` / `exclusiveMaximum`** — strict bounds
- **`multipleOf`** — step constraints (e.g., currency in increments of 0.01)

### String constraints

- **`minLength` / `maxLength`** — character limits for text fields
- **`format`** — semantic formats like `"date-time"`, `"email"`, `"uri"`, `"uuid"`. Particularly useful for AI — knowing a string is a UUID vs. a display name changes how the AI generates it

### Array constraints

- **`minItems` / `maxItems`** — collection size bounds
- **`uniqueItems`** — partially supported on item-typed arrays but not as a general slot annotation

## Missing Class-Level Keywords

### Composition

- **`oneOf` / `anyOf` / `allOf`** — union and intersection types. A slot that accepts "either a UoCharacter or a UoCreatureTemplate" currently can't express this. At the class level, this could describe polymorphic collections.
- **`const`** — fixed-value properties (more specific than a single-element enum)

### Conditional

- **`if` / `then` / `else`** — conditional validation. For example: if `characterClass` is "Wizard" then `spellSlots` is required; if `type` is "ranged" then `range` must be present. These constraints currently live only in code or prompt text.

### Object structure

- **`propertyNames`** — constraints on key names for Map-typed slots
- **`patternProperties`** — schema for properties matching a regex pattern
- **`minProperties` / `maxProperties`** — bounds on the number of properties

## Implementation Approach

### Slot-level additions

Each missing keyword follows the existing annotation pattern — a getter/setter pair on `Slot` that `asJsonSchema()` reads:

```javascript
// On Slot:
setMinimum (n) {
    this.setAnnotation("minimum", n);
    return this;
}

minimum () {
    return this.getAnnotation("minimum");
}

// In asJsonSchema():
const min = this.minimum();
if (min !== undefined) {
    schema.minimum = min;
}
```

The slot system's annotation mechanism already supports arbitrary key-value metadata, so no structural changes are needed — just adding the accessors and wiring them into `asJsonSchema()`.

### Class-level additions

Composition keywords (`oneOf`, `anyOf`) would need static methods on `SvNode` that `asJsonSchema()` includes in the class schema. Conditional keywords (`if`/`then`/`else`) are more complex — they'd require a way to express inter-slot dependencies at the class level, possibly as a static `jsonSchemaConditionals()` method that returns an array of condition objects.

### Validation unification

Currently, JSON Schema annotations are output-only — they describe the slot's contract to external consumers but don't enforce it at runtime. A natural extension would be to have the auto-generated setter validate against the same constraints:

- A `Number` slot with `setMinimum(0)` would reject negative values
- A `String` slot with `setMaxLength(100)` would warn on overflow
- A `String` slot with `setFormat("email")` could validate format

This would unify schema declaration and runtime validation, ensuring the contract described to AI consumers is actually enforced in the application. The existing `validatesOnSet` mechanism already provides the hook point — it just needs to consult the richer set of annotations.

## Richer Type Unions

Slots currently declare a single type via `setSlotType("String")`. Some slots legitimately accept multiple types — a value that could be a `String` or `null`, or a slot that holds either a `Number` or an `Array`. The type system doesn't express this, leading to validation warnings that must be suppressed.

A possible API:

```javascript
slot.setSlotType("String|null");
// or:
slot.setSlotTypes(["String", "Number"]);
```

This would generate `oneOf` or union types in JSON Schema and validate against any of the listed types at runtime.

## Open Questions

- Should all JSON Schema keywords be supported, or only those that map to runtime behavior? Keywords like `if`/`then`/`else` add schema expressiveness but may be complex to implement as runtime validation.
- How should schema versioning work? If the schema changes between app versions, should the schema include a `$id` with a version component?
- Could the framework auto-infer some constraints — for example, deriving `minimum: 0` from a slot named "count" or "quantity"? Or is explicit annotation always better?
- How should the schema handle slots that are writable by the app but read-only for AI? The current `readOnly` is all-or-nothing.
