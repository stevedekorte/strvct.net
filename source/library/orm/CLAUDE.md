# STRVCT ORM — working notes

A server-only ORM over Sequelize (SQLite in development, PostgreSQL in
production) with schema introspection, an Active Record row API, and
transactions tracked through Zone.js. `README.md` in this directory is the
reference: class hierarchy, usage examples, JSON schema format, test list.
This file is only the rules that are easy to get wrong.

## How this module is loaded (it is not like the rest of strvct)

- Node.js only, loaded with CommonJS `require`, **not** through `_imports.json`
  or the resource manager. `require` is correct here; do not "fix" it.
- Classes extend the webserver's `Base` (`webserver/Base.js`), not `SvNode`, and
  register with `.initThisClass()` as usual. Slots, `clone()`, and accessor
  naming (`_ivar` / `ivar()` / `setIvar()`) work the same way.
- The host server supplies the database: `SvDatabase` requires `../database`
  exporting `{ sequelize, initializeDatabase }`. The tests need the same, so
  they run only inside a host that provides it — not standalone from strvct.
- Zone.js is vendored in `external-libs/zonejs/` and initialized by `SvDbTx`.

**Open issue (2026-09-01):** the `require` paths at the top of `SvDatabase.js`
point to `../../../GameServer/site/strvct/…`, which does not resolve from this
directory, and it destructures `SvBase` from `webserver/`, which exports `Base`.
The module was evidently moved here from a server directory without its
requires being updated; it cannot load from this location until they are.

## Rules

- **Every database operation runs inside a transaction.** Create one with
  `database.newTx()` and do the work in `await tx.begin(async () => { … })`;
  table and row methods read the current transaction from the Zone context, so
  never pass `tx` around by hand and never touch `sequelize` directly.
  Operations outside a transaction must fail with a clear error, not fall
  through.
- Set row fields with `row.setRowKeyValue(key, value)` — it validates against
  the column (`SvDbDataType`) and tracks changes so `save()` writes only the
  fields in `changedDict()`. Rows are cached per table by primary key
  (`SvDbCache`: a small FIFO of strong refs over a weak map), so two lookups
  of the same id return the same object.
- Keep the ORM schema-independent: no hardcoded table or column names, no
  app-specific relationships. Introspection must tolerate a missing table,
  column, or constraint and keep going; log it, do not abort.
- Dialect differences (SQLite `PRAGMA` vs PostgreSQL `information_schema`) live
  in one place each; test against both when a change touches introspection or
  foreign-key detection.
- All type logic goes through `SvDbDataType` (`dataTypeForValue`,
  `validateValueForDbType`, `isValueCompatibleWithDbType`). Do not add ad-hoc
  type checks in `SvDbColumn` or `SvDbRow`.
- Root `CLAUDE.md` coding style applies: space before function parens, `Sv`
  prefix, JSDoc with `@category`, `Map` over object dictionaries.

## Tests

`tests/` holds one script per concern (`test.js` is the end-to-end pass). Run
them from a host that provides `../database`; there is no runner.
