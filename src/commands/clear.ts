export default function (exit) {
    this.events.emit('clear');
    exit(0)
}