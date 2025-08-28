export default class EventBus {
constructor(scene) {
this.scene = scene;
this.emitter = new Phaser.Events.EventEmitter();
}
on(name, cb) { this.emitter.on(name, cb); return () => this.emitter.off(name, cb); }
emit(name, payload) { this.emitter.emit(name, payload); }
}