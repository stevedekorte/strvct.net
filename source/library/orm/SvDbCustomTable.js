/**
    * @module webserver/orm
    */

"use strict";

// Load STRVCT dependencies in correct order
require("../../../GameServer/site/strvct/source/boot/SvGlobals");
require("../../../GameServer/site/strvct/source/boot/Object_categorySupport");
require("/Users/steve/_projects/Active/undreamedof.ai/Servers/GameServer/site/strvct/source/library/ideal/categories/object/Object_ideal.js");
require("/Users/steve/_projects/Active/undreamedof.ai/Servers/GameServer/site/strvct/source/library/ideal/categories/String_ideal.js");

const SvDbTable = require("./SvDbTable");

/**
    * @class SvDbTable
    * @extends Base
    * @classdesc Represents a database table with its columns and provides table-level operations.
    * 
    * This class encapsulates table metadata and provides high-level CRUD operations that work
    * with row objects. It manages the relationship between table schema (columns) and data (rows),
    * and handles the mapping between raw database records and object instances.
    * 
    * Key responsibilities:
    * - Store table metadata (name, columns, row class mapping)
    * - Provide table-specific CRUD operations (selectRows, insertRow, updateRow, deleteRow)
    * - Handle row object creation and population from database records
    * - Manage column name-to-column object mapping for efficient lookups
    * - Support custom row classes for domain-specific table representations
    * 
    * The table delegates actual database operations to its parent SvDatabase instance while
    * providing a convenient interface for working with specific tables and their data.
    * 
    * Usage:
    * ```javascript
    * const table = database.tableWithName("users");
    * const rows = await table.selectRows({ limit: 10 });
    * const newRow = table.rowClass().clone();
    * newRow.setupFromDict({ name: "John", email: "john@example.com" });
    * await table.insertRow(newRow);
    * ```
    */

const SvDbCustomTable = (class SvDbCustomTable extends SvDbTable {

                /**
                    * @description Initialize prototype slots.
                    * @category Initialization
                    */
                initPrototypeSlots () {

                }

                /**
                    * @description Initialize prototype for the SvDbTable.
                    * @category Initialization
                    */
                initPrototype () {
                                // Prototype initialization will be implemented here
                }

                init () {
                                super.init();
                                return this;
                }

                setupCustomPrototype () {
                                // add methods for getting a row
                                // e.g. if this is a "Transactions" table, add a getTransactionWithId method
                                // that returns a PmTransaction row object
                                // implement using the Table.getRowForId method
                                
                                const name = this.tableName().sansSuffix("s").uncapitalized();
                                this.thisPrototype().addMethod(name + "WithId", async function (id) {
                                                return this.getRowForId(id);
                                });
                }

}).initThisClass();

module.exports = SvDbCustomTable;