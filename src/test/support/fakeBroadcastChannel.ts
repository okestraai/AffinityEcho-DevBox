// A BroadcastChannel stand-in that, like the real one, delivers to every other instance with the same name.
type Listener = (event: MessageEvent) => void;

const open = new Set<FakeBroadcastChannel>();

export class FakeBroadcastChannel {
  readonly name: string;
  private listeners = new Set<Listener>();
  closed = false;

  constructor(name: string) {
    this.name = name;
    open.add(this);
  }

  postMessage(data: unknown) {
    if (this.closed) throw new Error('closed');
    for (const other of open) {
      if (other !== this && other.name === this.name && !other.closed) {
        other.listeners.forEach((fn) => fn({ data } as MessageEvent));
      }
    }
  }

  addEventListener(_type: 'message', fn: Listener) {
    this.listeners.add(fn);
  }

  removeEventListener(_type: 'message', fn: Listener) {
    this.listeners.delete(fn);
  }

  close() {
    this.closed = true;
    open.delete(this);
  }

  static reset() {
    open.forEach((channel) => channel.close());
    open.clear();
  }
}
