"use strict";

/*

    BMUrlResources

    A class that helps cache and coalese network/cache requests for resources.

    When requesting a resource, we'd like to be able to:
    - see if it's cached in indexddb and return value if hash matches (or maybe some cache time isn't expired)
    - coalese requests so multiple indexeddb (as read is async) or network requests aren't made for the same resource
    - cache the result, if a network request was made
    - be aware of situation where indexeddb write hasn't completed before a new request for the same resource occurs

    Example use:

        someMethod () {
            ...
            const urlResource = BMUrlResources.shared().newUrlResourceForUrlAndHash(url, hash) // need to *START* request here as someone else who gets this might do so
            urlResource.setUrlDelegate(this)
            urlResource.load()
            ...
        }

        onUrlResourceComplete (urlResource) {
            urlResource
        }

*/

(class BMUrlResources extends BMNode {

    static initClass () {
        this.setIsSingleton(true);
        return this;
    }

    initPrototypeSlots () {
        this.newSlot("hashToResourceMap", null);
        this.newSlot("urlToResourceMap", null);
    }

    init () {
        super.init();
        this.setTitle("Url Resources");
        this.setHashToResourceMap(new EnumerableWeakMap());
        this.setUrlToResourceMap(new EnumerableWeakMap());
        return this;
    }

    subtitle () {
        return this.hashToResourceMap().size + " active requests";
    }

    newUrlResourceForUrlAndHash (url, hash) {
        {
            const r = this.hashToResourceMap().get(hash);
            if (r) {
                return r;
            }
        }

        {
            const r = this.urlToResourceMap().get(url);
            if (r) {
                return r;
            }
        }

        const r = BMUrlResources.clone().setUrl(url).setHash(hash);
        this.addUrlResource(r);
        return r;
    }

    addUrlResource (urlResource) {
        this.hashToResourceMap().delete(urlResource.hash());
        this.urlToResourceMap().delete(urlResource.url());
        return this;
    }

    removeUrlResource (urlResource) {
        this.hashToResourceMap().delete(urlResource.hash());
        this.urlToResourceMap().delete(urlResource.url());
        return this;
    }

}.initThisClass());
