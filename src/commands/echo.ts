export default function (exit, argv) {
    const { printf } = this.libs.std
    printf(argv.join(' '));
    exit(0)
}