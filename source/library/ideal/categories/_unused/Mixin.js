/*



*/

getGlobalThis().Mixin = class Mixin extends Object {
	
	static mixIntoClass (aClass) {
		// copy class methods (except initClass) into aClass, 
		// and throw exception on overrights

		// ....

		// copy instance methods (except initPrototype) into aClass' prototype
		// and throw exception on overrights

		// ...

		// apply initClass method to target class' prototype
		// ...

		// apply initPrototype method to target class' prototype
		//...

		// NOTE: what about Mixin inheritance?
		// should it be allowed?
	}
	
}
