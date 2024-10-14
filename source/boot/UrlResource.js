"use strict";

class UrlResource extends Object {

    static _totalBytesLoaded = 0;
    static _totalUrlsLoaded = 0;

    static with (url) {
        return this.clone().setPath(url);
    }

    static clone () {
        const obj = new this();
        obj.init();
        return obj;
    }
	
    type () {
        return "UrlResource";
    }

    init () {
        this._path = null;
        this._resourceHash = null;
        this._request = null;
        this._data = null;
        return this;
    }

    setPath (aPath) {
        this._path = aPath;
        return this;
    }

    path () {
        return this._path;
    }

    pathExtension () {
        return this.path().split(".").pop();
    }

    setResourceHash (h) {
        this._resourceHash = h;
        return this;
    }

    resourceHash () {
        return this._resourceHash;
    }

    async promiseLoad () {
        // load unzipper if needed
        if (this.isZipFile()) {
            await this.promiseLoadUnzipIfNeeded();
        }
        return await this.asyncLoadFromCache();
    }

    isDebugging () {
        return false;
    }

    debugLog (s) {
        if (this.isDebugging()) {
            console.log(s);
        }
    }

   async asyncLoadFromCache () {
        if (this._data) {
            return this;
        }

        //console.log("UrlResource.asyncLoadFromCache() " + this.path())
        const h = this.resourceHash();
        if (h && getGlobalThis().HashCache) {
            const hc = HashCache.shared();
            //await hc.promiseClear(); // clear cache for now
            const hasKey = await hc.promiseHasKey(h);
            //const data = await hc.promiseAt(h); // this seems to be not returning undefined for some absent keys???

            //if (data !== undefined) {
            if (hasKey) {
                // if hashcache is available and has data, use it
                const data = await hc.promiseAt(h);
                assert(data !== undefined, "hashcache has undefined data for " + h);
                this._data = data;
                //console.log("UrlResource.asyncLoadFromCache() (from cache) " + this.path())
                return this;
            } else {
                // otherwise, load normally and cache result
                this.debugLog(this.type() + " no cache for '" + this.resourceHash() + "' " + this.path());
                console.log("UrlResource.asyncLoadFromCache() (over NETWORK)" + this.path())
                await this.promiseJustLoad();
                await hc.promiseAtPut(h, this.data());
                console.log(this.type() + " stored cache for ", this.resourceHash() + " " + this.path());
                return this;
            }
        } else {
            /*
            if (!h) {
                console.log("  no hash for " + this.path())
                //debugger;
            }
            if (!getGlobalThis().HashCache) {
                console.log("  no HashCache")
            }
            console.log("loading normally " + this.path() + " " + h)
            */
            return this.promiseJustLoad();
        }
    }

    async promiseJustLoad () {
        try {
            const data = await URL.with(this.path()).promiseLoad();
            this._data = data;
            this.constructor._totalBytesLoaded += data.byteLength;
            this.constructor._totalUrlsLoaded += 1;
        } catch (error) {
            debugger
            this._error = error;
            error.cause = error;
            throw error;
        }
        return this;
    }

    async promiseLoadAndEval () {
        //console.log("promiseLoadAndEval " + this.path())
        await this.promiseLoad();
        this.eval();
    }

    eval () {
        if (this.pathExtension() === "js") {
            this.evalDataAsJS();
        } else if (this.pathExtension() === "css") {
            this.evalDataAsCss();
        }
    }

    evalDataAsJS () {
        //console.log("UrlResource eval ", this.path())
        evalStringFromSourceUrl(this.dataAsText(), this.path());
        return this;
    }

    evalDataAsCss () {
        const cssString = this.dataAsText(); // default decoding is to utf8
        const sourceUrl = "\n\n//# sourceURL=" + this.path() + " \n";
        const debugCssString = cssString + sourceUrl;
        //console.log("eval css: " +  entry.path)
        const element = document.createElement('style');
        element.type = 'text/css';
        element.appendChild(document.createTextNode(debugCssString));
        document.head.appendChild(element);
    }

    data () {
        return this._data;
    }

    dataAsText () {
        let data = this.data()
        if (typeof(data) === "string") {
            return data;
        }

        if (this.isZipFile()) {
            data = this.unzippedData();
        } 

        return new TextDecoder().decode(data); // default decoding is to utf8
    }

    dataAsJson () {
        return JSON.parse(this.dataAsText());
    }

    // --- zip ---

    isZipFile () {
        return this.pathExtension() === "zip";
    }

    unzippedData () {
        return pako.inflate(this.data());
    }

    async promiseLoadUnzipIfNeeded () {
        if (!getGlobalThis().pako) {
            await UrlResource.clone().setPath(ResourceManager.bootPath() + "/external-libs/pako.js").promiseLoadAndEval();
        }
    }
}

getGlobalThis().UrlResource = UrlResource;
