// IndexedDB module for Node.js
//
// Jesús Leganés Combarro "Piranna" <piranna@gmail.com>
//
// This module implements the IndexedDB specification using the LevelDB module
// as underlying database engine. It's mainly intention is to port client-side
// IndexedDB intensive applications to Node.js.
//
// It is based on IndexedDB-javascript.js polyfill from ShareIt! project
// https://github.com/piranna/ShareIt


var leveldb = require('leveldb');


function IDBRequest()
{
  this.target = {};
};
IDBRequest.prototype =
{
  set onsuccess(func)
  {
    this._onsuccess = func;
    var event = {target: this.target};
    func.call(this, event);
  }
};

function IDBOpenDBRequest()
{
  IDBRequest.call(this);

//      this.prototype.__defineSetter__("onupgradeneeded", function(func)
//      {
//        var event = {target: this.target}
//        func.call(this, event)
//      })
};
IDBOpenDBRequest.prototype = new IDBRequest();


function IDBCursor()
{
  this._objects = [];
  this._index = 0;

  this.continue = function()
  {
    this._index += 1;

    var event = {target: {}};
    if(this.value)
        event.target.result = this;
    this._request._onsuccess(event);
  };
}
IDBCursor.prototype =
{
  get value()
  {
    return this._objects[this._index];
  }
};

function IDBObjectStore()
{
  var objects = {}

  this.add = function(value, key)
  {
    return this.put(value, key);
  }
  this.get = function(key)
  {
    var request = new IDBRequest();
        request.result = objects[key];
    return request;
  }
  this.openCursor = function(range)
  {
    var request = new IDBRequest();

    if(Object.keys(objects).length)
    {
        // Fill the cursor with the objectstore objects
        var cursor = new IDBCursor();
        for(var key in objects)
            cursor._objects.push(objects[key]);

        // Link the request and the cursor between them
        request.target.result = cursor;
        cursor._request = request;
    }

    return request;
  }
  this.put = function(value, key)
  {
    if(this.keyPath)
    {
       if(key)
           throw DOMException;
       key = value[this.keyPath];
    }

   if(!key)
       throw DOMException;

    objects[key] = value;

    var request = new IDBRequest();
        request.result = objects[key];
    return request;
  };
}

function IDBTransaction()
{
  this.objectStore = function(name)
  {
    return this.db._stores[name];
  };
}

function IDBDatabase()
{
  this._stores = {};

  this.createObjectStore = function(name, optionalParameters)
  {
    var objectStore = new IDBObjectStore();
    if(optionalParameters)
        objectStore.keyPath = optionalParameters.keyPath;

    this._stores[name] = objectStore;
  }

  this.setVersion = function(version)
  {
    this.version = version;

    return new IDBRequest();
  }

  this.transaction = function(storeNames, mode)
  {
    var result = new IDBTransaction();
        result.db = this;

    return result;
  };
}


exports.open = function(name, version)
{
  var request = new IDBOpenDBRequest();

  leveldb.open(name, {create_if_missing: true}, function(error, handle)
  {
    var db = new IDBDatabase();
        db._handle = handle;

    request.result = db;
  });

  return request;
};