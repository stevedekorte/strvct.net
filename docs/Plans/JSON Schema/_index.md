# JSON Schema

Expanding auto-generated JSON Schema coverage across slots, classes, and the domain model.

**Status:** slot-level keywords and validation against them are built (2026-11-17, see [What Was Built](#what-was-built)); `pattern` is checked too (2026-11-18); the only slot that declares a constraint is `SvToolCall.callId`'s pattern. **Left:** the class-level keywords, type unions. Leave `if`/`then`/`else` until a real case needs it.

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
| `pattern` | `setPattern()` | String regex; checked (was `setJsonSchemaPattern()`, schema-only, until 2026-11-18) |
| `readOnly` | `setIsReadOnly()` | |
| `items` | `setJsonSchemaItemsType()` | Array item type, description, uniqueItems, $ref |
| `properties` | `setFinalInitProto()` | Nested object schemas |
| `$ref` | Auto-generated | For slots referencing node classes |

### Already inconsistent (fixed 2026-11-17)

One annotation had two readers that disagreed: `SvFieldTile` emits `aria-valuemin` / `aria-valuemax` from a slot's `minimum` / `maximum` annotations, but `Slot.asJsonSchema()` doesn't emit those annotations. It only derives `minimum` and `maximum` from a contiguous integer `enum`. Wiring the annotation into the schema is the natural first change.

## Slot-Level Keywords

All of these now have a slot setter named after the keyword (`setMinimum(n)`, `setMaxLength(n)`, …), in `Slot_constraints.js`:

### Numeric constraints

- **`minimum` / `maximum`** — bounded ranges for Number slots (e.g., ability scores 1–30, hit points 0–999)
- **`exclusiveMinimum` / `exclusiveMaximum`** — strict bounds
- **`multipleOf`** — step constraints (e.g., currency in increments of 0.01)

### String constraints

- **`minLength` / `maxLength`** — character limits for text fields
- **`pattern`** — a regular expression the string must match
- **`format`** — semantic formats like `"date-time"`, `"email"`, `"uri"`, `"uuid"`. Particularly useful for AI — knowing a string is a UUID vs. a display name changes how the AI generates it

### Array constraints

- **`minItems` / `maxItems`** — collection size bounds
- **`uniqueItems`** — partially supported on item-typed arrays but not as a general slot annotation (not added)

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

## Implementation Approach (as planned)

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

**A new constraint applies to every record already stored**, the same way slot flags do. So it must never stop a record loading:

- **Loading** (`loadFromRecord`, `deserializeFromJson`, lazy materialization): warn and keep the value. The setter already only warns on a type mismatch; constraints should do the same.
- **Edits** (the user, a JSON patch from an AI): reject, with a message built from the annotation ("must be at least 0"). For AI patches the rejection goes back as a tool-call error, so the model can correct itself.
- **Field tiles** show the same message beside the field, which is the Data Validation idea from Emergent Capabilities: one set of annotations feeding the schema, the ARIA attributes and the error text.

## What Was Built

2026-11-17. `Slot_constraints.js`, a category of `Slot`, with `tests/headless/TestSlotConstraints.js`.

| Constraint | Applies to | Schema | Checked |
|---|---|---|---|
| `setMinimum` / `setMaximum` | Number | yes | yes |
| `setExclusiveMinimum` / `setExclusiveMaximum` | Number | yes | yes |
| `setMultipleOf` | Number | yes | yes, allowing for floating point |
| `setMinLength` / `setMaxLength` | String | yes | yes |
| `setPattern` | String | yes | yes (2026-11-18) |
| `setMinItems` / `setMaxItems` | Array | yes | yes |
| `setFormat` | String | yes | no |

One declaration has four readers:

- **The schema.** `Slot.asJsonSchema()` emits each declared keyword. A declared `maxLength` never raises the 16 KB cap a stored string already has.
- **The error sentence.** `slot.constraintErrorForValue(v)` returns "Must be at most 20." or `null`. It judges only the constraints for the value's type; the slot's type check is separate.
- **ARIA.** `SvFieldTile` reads `slot.minimum()` / `slot.maximum()`, the same values the schema emits.
- **The setter**, which warns and keeps the value.

Where an edit is refused:

- **A field.** `SvField.validateValue(v)` now returns the target slot's sentence (`SvField.targetSlot()` finds the slot), and `SvNumberField` adds it to its own checks. The field tile already showed a field's error and held the value back from the model, so nothing changed in the view.
- **A JSON patch.** The preflight refuses the whole batch before anything is applied, for the patched slot and for a field inside a value being added, with the sentence in the error the AI gets back.

Decisions made along the way:

- **The setter cannot refuse.** It can't tell a load from an edit, so the refusal lives where edits come in. Code that calls a setter directly with a bad value gets a warning, not an error.
- **The patch refusal assumes patches are edits.** Today the only caller of `applyJsonPatches` is the AI's `patchClientState` tool. If patches are ever used again to copy state from one machine to another, that path must skip the constraint check, or a value that loaded with a warning on the host would be refused on the client.
- **`format` is not checked.** It tells the AI what kind of string to write; checking each format is a separate piece of work.
- **`pattern` is checked (2026-11-18).** `setJsonSchemaPattern`, which predated this and was only emitted, became `setPattern`, one of the constraints: its sentence is "Must match the pattern ^call_\d+$", which suits an AI better than a person, and a malformed pattern throws where it is declared. Its one declarer is `SvToolCall.callId`, so a call id of another shape now warns in the setter (and is kept).
- **`SvNumberField`'s own `minValue` / `maxValue`** (used by sliders) are left as they are. A slot's `minimum` / `maximum` could feed them, which would retire the pair.

**No slot declares a constraint yet apart from `SvToolCall.callId`'s pattern**, in the framework or the app, so nothing else behaves differently until one does. Each one added is a decision about data already stored (it will warn on load) and about what the AI may write (it will be refused), so they are best added where a wrong value has been seen.

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
