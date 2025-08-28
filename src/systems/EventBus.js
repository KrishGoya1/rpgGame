export default class EventBus {
    constructor() {
        this.emitter = new Phaser.Events.EventEmitter();
    }

    on(name, cb, context = null) {
        this.emitter.on(name, cb, context);
        // Return a cleanup function
        return () => this.emitter.off(name, cb, context);
    }

    off(name, cb, context = null) {
        this.emitter.off(name, cb, context);
    }

    emit(name, payload) {
        this.emitter.emit(name, payload);
    }
}
