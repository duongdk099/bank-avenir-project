"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
class AggregateRoot {
    id;
    version = -1;
    uncommittedEvents = [];
    constructor(id) {
        this.id = id;
    }
    getId() {
        return this.id;
    }
    getVersion() {
        return this.version;
    }
    getUncommittedEvents() {
        return [...this.uncommittedEvents];
    }
    markEventsAsCommitted() {
        this.uncommittedEvents = [];
    }
    apply(event) {
        this.uncommittedEvents.push(event);
        this.applyEvent(event);
        this.version++;
    }
    loadFromHistory(events) {
        events.forEach((event) => {
            this.applyEvent(event);
            this.version++;
        });
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.js.map