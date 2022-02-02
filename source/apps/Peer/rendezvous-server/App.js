import * as vgd from './index';

export default class App {
    server: vgd.Server;
    
    public static get shared(): App {
        if (!App._shared) {
            App._shared = new App();
        }
        return App._shared;
    }
    
    public static set shared(shared: App) {
        App._shared = shared;
    }

    public start() {
        this.server = new vgd.Server();
        this.server.start();
    }

    private static _shared: App;
}