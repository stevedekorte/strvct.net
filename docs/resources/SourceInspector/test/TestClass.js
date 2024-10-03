class TestClass {
    constructor(name) {
        this.name = name;
    }

    sayHello() {
        return `Hello, my name is ${this.name}!`;
    }

    static createGreeting(name) {
        return new TestClass(name).sayHello();
    }
}

// Example usage:
console.log(TestClass.createGreeting("Alice"));