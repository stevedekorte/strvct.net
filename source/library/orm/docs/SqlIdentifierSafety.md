# SQL identifier safety

Plan for closing the identifier-interpolation footgun in the ORM query
builder. Not scheduled; land it the next time `SvDatabase` query/insert/
update/delete is touched, or sooner if a caller is found passing
untrusted keys into `selectRows({ where })`.

Closed inbound scanner PR #50 (2026-09-13, OrbisAI/semgrep) instead of
landing it. That patch converted template literals to `+` concatenation
(no threat-model change) and allowlisted columns on `query()` / `insert()`
only. Do not repeat that shape.

## Problem

Values are already bound. Every `sequelize.query` in `SvDatabase.js` passes
`replacements`, so a value like `' OR 1=1` is a bound parameter, not SQL.

Identifiers are concatenated. Table names, column keys, and (if they were
ever emitted) sort columns are interpolated into the SQL string:

| Site | SQL | Identifier source |
| --- | --- | --- |
| `SvDatabase.query` | `SELECT * FROM ${tableName} WHERE ${key} = :${key}` | caller `tableName`, `searchOptions.where` keys |
| `SvDatabase.insert` | `INSERT INTO ${tableName} (${columns})` | caller `tableName`, `Object.keys(rowData)` |
| `SvDatabase.update` | `UPDATE ${tableName} SET ${key} = :${key} WHERE ${pk}` | caller keys; `pk` from schema |
| `SvDatabase.delete` | `DELETE FROM ${tableName} WHERE ${pk} = :pk` | `tableName` caller; `pk` from schema |
| `SvDbSchema` SQLite fallbacks | `PRAGMA table_info(${tableName})`, `foreign_key_list`, `INDEX_LIST`, `INDEX_INFO(${index.name})` | introspected names |

`searchOptions.sort` / `order` / `limit` / `page` are stuffed into
`queryOptions` and spread into raw `sequelize.query()`. Sequelize applies
those options to `Model.findAll`, not to a fully written SQL string, so
sort and pagination are currently no-ops. Tests already pass `sort:
"createdAt"` (`tests/test-db-operations.js`). Leaving sort unquoted next
to a "we hardened identifiers" change means the first person who later
appends `ORDER BY ${sort}` reintroduces injection on a field the tests
already feed through.

PostgreSQL introspection already binds `:tableName` as a *value* in
`information_schema` WHERE clauses. That path is fine.

## Threat model

This is a server-only ORM. It is not a live, independently exploitable
injection under the intended Active Record API:

- Table names come from schema introspection (`table.tableName()`).
- `setRowKeyValue` rejects unknown columns before anything is written.
- `getRowForId` builds `where` from `primaryKeyName()`.
- `insertRow` / `updateRow` send `row.asDict()`, whose keys are column names.

The footgun is the lower-level dict API. `database.query(tableName,
searchOptions)`, `insert` / `update` with raw `rowData`,
`selectRows({ where })`, and `getRowsWhereColumnNameHasValue(columnName,
value)` interpolate object keys. That becomes injection if a caller ever
does `where: req.body` or passes a user-supplied column name.

Treat it as a library invariant, not as an incident response: the query
builder must not concatenate a string it did not just look up on the
loaded schema.

## Non-goals

- Do not convert template literals to `+` concatenation to silence
  `utils.custom.sql-injection-template-literal`. Semantically identical,
  and leftover templates (`conditions.push(\`${key} = :${key}\`)`) still
  trip the rule.
- Do not copy-paste `tableWithName` / `columnWithName` checks at two call
  sites and leave `update()` / sort / PRAGMA alone.
- Do not generate Sequelize models per table just to get `findAll`. The
  ORM is schema-introspected on purpose (`CLAUDE.md`: no hardcoded table
  names). Stay on raw SQL; quote identifiers ourselves.
- Do not fix the stale `require` paths at the top of `SvDatabase.js` in
  the same change (already an open issue in `CLAUDE.md`).
- Do not add comments that assert "concatenation here is safe from SQL
  injection."

## Design

One helper, owned by the query builder, used on every concatenation path.

Look up against the loaded schema (fail closed). Quote the *schema*
name, never the caller string. Bind only values, with synthetic parameter
names so a weird column name cannot break `:replacements` syntax.

```javascript
quoteTable (tableName) {
    const table = this.tableWithName(tableName);
    if (!table) {
        throw new Error(`Table ${tableName} not found in schema`);
    }
    return {
        table,
        sql: sequelize.getQueryInterface().quoteIdentifier(table.tableName())
    };
}

quoteColumn (table, columnName) {
    const column = table.columnWithName(columnName);
    if (!column) {
        throw new Error(`Column ${columnName} not found in table ${table.tableName()}`);
    }
    return {
        column,
        sql: sequelize.getQueryInterface().quoteIdentifier(column.columnName())
    };
}
```

`tableWithName` / `columnWithName` are exact `===` against introspected
names (fail-closed for case, dotted names, aliases). That is the
allowlist. Quoting is the dialect layer (`"name"` on Postgres, the
SQLite equivalent via the same `QueryInterface` method) so reserved-word
and mixed-case names survive.

Bind parameter names are synthetic (`c0`, `c1`, …), not the caller key
and not the column name. Values go in `replacements`; identifiers never
do.

`searchOptions.order` is allowlisted to `ASC` / `DESC` (case-insensitive
in, uppercase out). Anything else throws.

### Call sites

**`query`.** Resolve the table once. For each own key of
`searchOptions.where`, quote the column and bind the value. Emit
`ORDER BY` / `LIMIT` / `OFFSET` in the SQL when those options are
present:

- `sort` → quoted column (required if `order` is set).
- `order` → `ASC` or `DESC`.
- `limit` / offset from `page` → integers, bound as replacements, not
  concatenated. `parseInt` alone is not enough; reject non-finite /
  negative values.

**`insert`.** Quote the table. Quote every `rowData` key. Unknown keys
throw (today they are interpolated). The Active Record path is unchanged
because `asDict()` only contains schema columns.

**`update`.** Same as insert for SET keys. The WHERE column is the
schema primary-key name, also quoted. This is the path PR #50 left open.

**`delete`.** Quote the table and the schema primary-key name.

**`SvDbSchema` SQLite PRAGMA fallbacks.** Quote `tableName` and
`index.name` with `quoteIdentifier`. Names come from Sequelize's table
list / PRAGMA output (trusted), but the helper is the only legal way to
put a name into SQL, so use it here too. Leave the Postgres
`information_schema` query on `:tableName` replacements.

### Prototype keys

Iterate own keys only (`Object.hasOwn` / `Object.keys`). Schema lookup
already rejects `__proto__` unless a column is actually named that; do
not special-case names.

## Behavior changes

- Unknown table or column throws, including extra keys on
  `database.insert` / `update` / `query` where. Direct dict-API callers
  that today smuggle unknown keys into SQL will start failing. That is
  the point.
- `selectRows({ limit, page, sort, order })` starts meaning what the
  README already documents. Callers passing `limit: 10` currently get
  every matching row; after this they get 10. Update
  `tests/test-db-operations.js` to assert the limit rather than only
  logging `pagedRows.length`.
- Quoted identifiers change the SQL text (`SELECT * FROM "orders"` vs
  `SELECT * FROM orders`). No change for ordinary unreserved names;
  reserved-word / mixed-case Postgres names start working.

## Tests

New host-run script `tests/test-sql-identifiers.js` (same constraint as
the other ORM tests: needs `../database`). Cover:

1. Unknown table name throws and does not call `sequelize.query`.
2. Unknown where / insert / update key throws.
3. A key such as `id;drop` or `id) --` never reaches Sequelize (spy or
   wrap `sequelize.query`, assert the SQL contains only quoted schema
   identifiers).
4. `order` other than ASC/DESC throws; `sort` that is not a column
   throws.
5. `limit` is visible in the issued SQL (or in the result count on a
   table with more rows than the limit).
6. Happy path: valid where + sort + limit still returns the expected
   row, SQLite and Postgres if the host can run both.

Do not rely on existing tests. They only exercise valid column names via
`setRowKeyValue` / `asDict()`.

## Sequence

One PR. Splitting "allowlist query/insert" from "allowlist update" from
"emit ORDER BY" is how PR #50 shipped an incomplete claim of safety.

1. Add `quoteTable` / `quoteColumn` (and the ASC/DESC helper) on
   `SvDatabase`.
2. Switch `query` / `insert` / `update` / `delete` to them; emit sort /
   limit / offset in `query` SQL.
3. Switch `SvDbSchema` PRAGMA strings.
4. Add `tests/test-sql-identifiers.js`; tighten the pagination
   assertion in `test-db-operations.js`.
5. Run the ORM tests from a host that provides `../database`, both
   dialects if available.

No public API change. `selectRows({ where, sort, order, limit, page })`
keeps its shape; it starts enforcing it.
