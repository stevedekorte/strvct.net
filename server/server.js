
/*
getGlobalThis().root_require = function (path) {
  //console.log("root_require " + path)
  //console.log("__dirname " + __dirname)

  const fs = require('fs');

  const fullPath = __dirname + "/../" + path // back one folder from server
  console.log("root_require fullPath " + fullPath)

  if (!fs.existsSync(fullPath)) {
	  console.log("missing " + fullPath)
  }
  return require(fullPath)
}
*/

require("./getGlobalThis.js")

// ---------------------------------------------------------------------

const https = require('https');
const fs = require('fs');
//var vm = require('vm')

class StrvctHttpsServer {
	constructor() {
		this._options = {
			key: fs.readFileSync('keys/server.key'),
			cert: fs.readFileSync('keys/server.crt')
		};

		this._server = null;
		this._port = 8000;
	}

	port() {
		return this._port;
	}

	options() {
		return this._options;
	}

	pathExtensionFor(filepath) {
		return filepath.split('.').pop();
	}

	requestDescription(request) {
		let s = ""
		const keys = []

		for (k in request) {
			keys.push(k)
		}
		keys.sort()

		keys.forEach((k) => {
			const v = request[k]
			const t = typeof (v)
			if (["string", "number"].contains(t)) {
				s += "  " + k + ": '" + v + "'\n";
			} else {
				s += "  " + k + ": " + t + "\n";
			}
		})
		return s
	}


	run() {
		require("./mime_extensions.js")
		console.log("loaded mime extensions")
		/*
		require("../source/boot/ResourceLoader.js")
		//vm.runInThisContext(fs.readFileSync(__dirname + "/mime_extensions.js"))
		//vm.runInThisContext(fs.readFileSync(__dirname + "/../source/boot/ResourceLoader.js"))
		*/

		this._server = https.createServer(this.options(), (request, res) => { this.onRequest(request, res) })
		this._server.listen(this.port());

		console.log("listening on port " + this.port() + " - connect with https://localhost:8000/index.html")
	}

	onRequest(request, res) {
		//response.write("request:\n, this.requestDescription(request))

		console.log("request url:" + request.url)
		//console.log("  decoded url:" + decodeURI(request.url))
		//response.write("  path: '" + url.pathname + "'\n" );			
		const url = new URL("https://hostname" + request.url)
		const path = ".." + decodeURI(url.pathname)

		const queryDict = {}
		Array.from(url.searchParams.entries()).forEach(entry => queryDict[entry[0]] = entry[1])

		if (Object.keys(queryDict).length > 0) {
			console.log("  queryDict = ", queryDict)
			/*
			const resultJson = app.handleServerRequest(request, result, queryDict)
			JSON.stringify(resultJson)
			response.write(data.toString());		
			//console.log("  sent " + data.length + " bytes")	
			response.end();
			return
			*/
		}

		//console.log("  path:" + path)

		if (path.indexOf("..") !== 0) {
			response.writeHead(401, {});
			response.end()
			console.log("  error: invalid path ", path)
			return
		}
		const ext = Path_extension(path)
		//console.log("  ext:" + ext)

		if (!ext) {
			response.writeHead(401, {});
			response.end()
			console.log("  error: no file extension ", ext)
			return
		}

		/*
		how to handle non-file requests?
		http://host/path?query
		ignore path, send decoded query dict to app handleQuery(queryDict) method? 	
		*/

		const contentType = fileExtensionToMimeTypeDict["." + ext]

		if (!contentType) {
			response.writeHead(401, {})
			response.end()
			console.log("  error: invalid extension ", ext)
			return
		}

		// if it's a file request

		if (!fs.existsSync(path)) {
			response.writeHead(401, {});
			response.end()
			console.log("  error: missing file ", path)
			return
		}

		response.writeHead(200, {
			'Content-Type': contentType,
			'Access-Control-Allow-Origin': '*',
		});

		const data = fs.readFileSync(path)
		//response.write(data.toString());		
		response.write(data);
		//console.log("  sent " + data.length + " bytes")	
		response.end();
	}
}


const server = new StrvctHttpsServer()
server.run()

