/*

	An object wrapper for the Reflect functions

*/

getGlobalThis().Mirror = class Mirror extends Object {
	
	static reflectOn (aTarget) {
		return this.clone().setTarget(aTarget)
	}
	
	// target 
	
	setTarget (aTarget) {
		this._target = aTarget
		return this
	}
	
	target () {
		return this._target
	}

	// reflect methods

	defineProperty (propertyKey, attributes) {
		return Reflect.defineProperty(this.target(), propertyKey, attributes)		
	}
	
	deleteProperty (propertyKey) {
		return Reflect.deleteProperty(this.target(), propertyKey)
	}
	
	get (propertyKey, optionalReceiver) {
		return Reflect.get(this.target(), propertyKey, optionalReceiver)
	}

	getOwnPropertyDescriptor (propertyKey) {
		return Reflect.getOwnPropertyDescriptor(this.target(), propertyKey)
	}
	
	getPrototype () {
		return Reflect.getPrototypeOf(this.target())
	}

	has (propertyKey) {
		return Reflect.has(this.target(), propertyKey)
	}

	isExtensible () {
		return Reflect.isExtensible(this.target())
	}

	ownKeys () {
		return Reflect.ownKeys(this.target())
	}

	preventExtensions () {
		return Reflect.preventExtensions(target)
	}

	set (propertyKey, value, optionalReceiver) {
		return Reflect.set(this.target(), propertyKey, value, optionalReceiver)
	}

	setPrototype (prototype) {
		return Reflect.setPrototypeOf(this.target(), prototype)
	}
	
}
