

// A naive attempt at getting the global `this`. Don’t use this!
function getGlobalThis() {
	if (typeof globalThis !== 'undefined') return globalThis;
	if (typeof self !== 'undefined') return self;
	if (typeof window !== 'undefined') {
		window.global = window
		return window;
	}
	if (typeof global !== 'undefined') {
		global.window = global
		return global;
	}
	// Note: this might still return the wrong result!
	if (typeof this !== 'undefined') return this;
	throw new Error('Unable to locate global `this`');
  };
  getGlobalThis().getGlobalThis = getGlobalThis;


  getGlobalThis().root_require = function (path) {
	//console.log("root_require " + path)
	//console.log("__dirname " + __dirname)

	const fs = require('fs');

	const fullPath = __dirname + "/../" + path // back one folder from server
	console.log("root_require fullPath " + fullPath)

	/*
	if (fullPath === "/Users/steve/_projects/strvct/server/.././source/library/ideal/categories/Image-ideal.js") {
		console.log("-- error?")
	}
	*/

	if (!fs.existsSync(fullPath)) {
		console.log("missing " + fullPath)
	}
	return require(fullPath)
}

/*
function Globals_set(name, value) {
	if (IsInBrowser()) {
		window[name] = value 
	} else {
		global[name] = value
	}

	return value
}

function Globals_setup() {
	getGlobalThis()
	try {
		globalThis.x = 1
		window = globalThis
		console.log(">>>  window = globalThis")
	} catch {
		globalThis = window
		console.log(">>>  globalThis = window")
	}
}

Globals_setup()
*/


const https = require('https');
const fs = require('fs');
//var vm = require('vm')

/*
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
*/

const options = {
	key: fs.readFileSync('server.key'),
	cert: fs.readFileSync('server.crt')
  };

function Path_extension(filepath) {
     return filepath.split('.').pop();
}

require("./mime_extensions.js")
console.log("loaded mime extensions")
/*
require("../source/boot/ResourceLoader.js")
*/

//vm.runInThisContext(fs.readFileSync(__dirname + "/mime_extensions.js"))

//vm.runInThisContext(fs.readFileSync(__dirname + "/../source/boot/ResourceLoader.js"))

https.createServer(options, function (request, res) {
	//res.write("request:\n");


	/*
	const keys = []
	
	for (k in request) {
		keys.push(k)
	}
	keys.sort()
	
	keys.forEach((k) => {
		const v = request[k]
		const t = typeof(v)
		if (["string", "number"].contains(t) ) {
			res.write("  " + k + ": '" + v + "'\n" );
		} else {
			res.write("  " + k + ": " + t + "\n" );			
		}
	})
	*/
	
	//console.log("request:")
	console.log("request url:" + request.url)
	//console.log("  decoded url:" + decodeURI(request.url))
	//res.write("  path: '" + url.pathname + "'\n" );			
	const url = new URL("https://hostname" + request.url)
	const path = ".." + decodeURI(url.pathname)

	var queryDict = {}
	Array.from(url.searchParams.entries()).forEach(entry => queryDict[entry[0]] = entry[1])

	if (Object.keys(queryDict).length > 0) {
		console.log("  queryDict = ",  queryDict)
		/*
		const resultJson = app.handleServerRequest(request, result, queryDict)
		JSON.stringify(resultJson)
		res.write(data.toString());		
		//console.log("  sent " + data.length + " bytes")	
		res.end();
		return
		*/
	}

	//console.log("  path:" + path)

	if (path.indexOf("..") !== 0) {
		res.writeHead(401, {});
		res.end()
		console.log("  error: invalid path ", path)
		return 
	}
	const ext = Path_extension(path)
	//console.log("  ext:" + ext)

    if(!ext) {
		res.writeHead(401, {});
		res.end()
		console.log("  error: no file extension ", ext)
		return 
	}

	/*

	how to handle non-file requests?

	http://host/path?query

	ignore path, send decoded query dict to app handleQuery(queryDict) method? 

	*/

	var contentType = fileExtensionToMimeTypeDict["." + ext]

	if (!contentType) {
		res.writeHead(401, {})
		res.end()
		console.log("  error: invalid extension ", ext)
		return 
	}

	// if it's a file request

    if(!fs.existsSync(path)) {
		res.writeHead(401, {});
		res.end()
		console.log("  error: missing file ", path)
		return 
	}

	res.writeHead(200, {
		'Content-Type': contentType,
		'Access-Control-Allow-Origin': '*',
	});

	var data = fs.readFileSync(path)
	//res.write(data.toString());		
	res.write(data);		
	//console.log("  sent " + data.length + " bytes")	
	res.end();
}).listen(8000);

console.log("listening on port 8000 - connect with https://localhost:8000/index.html")
// https://localhost:8000/

