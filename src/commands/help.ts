export default function (exit) {
    const { printf } = this.libs.std;
    const fs = this.system.fs;
    printf(fs.readdirSync("/usr/bin").map((_) => _.replace(/\..*?$/g, '')).join('\n'));
    exit(0)
}