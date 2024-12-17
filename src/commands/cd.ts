export default function (exit, [dir]) {
    const { printf } = this.libs.std
    const exact = dir && (dir.startsWith('/') || dir.startsWith('~'))
    const newDir = exact ? dir.replaceAll('~', this.user.home) : dir ? this.system.libs.path.join(this.pwd, dir.replaceAll('~', this.user.home)) : this.user.home;
    if (!this.system.fs.existsSync(newDir)) {
        printf(`cd: no such file or directory: ${dir}`);
        return exit(1)
    }
    if (!this.system.fs.statSync(newDir).isDirectory()) {
        printf(`cd: not a directory: ${dir}`);
        return exit(1)
    }
    
    this.pwd = newDir;
    exit(0)
}