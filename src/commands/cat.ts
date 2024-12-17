export default function (exit, [path]) {
    const { printf } = this.libs.std
    const exact = path && (path.startsWith('/') || path.startsWith('~'))
    const fpath = exact ? path.replaceAll('~', this.user.home) : path ? this.system.libs.path.join(this.pwd, path.replaceAll('~', this.user.home)) : this.user.home;
    if (!this.system.fs.existsSync(fpath)) {
        printf(`cat: no such file or directory: ${path}`);
        return exit(1)
    }
    if (this.system.fs.statSync(fpath).isDirectory()) {
        printf(`cat: Is a directory: ${path}`);
        return exit(1)
    }
    
    printf(this.system.fs.readFileSync(fpath).toString());
    exit(0)
}