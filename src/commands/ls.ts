export default function (exit, [dir]) {
    const { printf } = this.libs.std
    if (!this.system.fs.existsSync(dir ?? this.pwd) || !this.system.fs.statSync(dir ?? this.pwd).isDirectory()) {
        printf(`ls: cannot access '${dir ?? this.pwd}': No such file or directory`)
        return exit(1)
    }
    // stands for dir contents if i forgor
    const dirc = this.system.fs.readdirSync(dir ?? this.pwd).map(f => {
        return {
            name: f,
            path: this.system.libs.path.join(dir ?? this.pwd, f),
            stat: this.system.fs.statSync(this.system.libs.path.join(dir ?? this.pwd, f))
        }
    });
    printf(dirc.map(f => {
        const perm = this.system.libs.perms.getPermStat(f.stat, this.uid)
        return (f.stat.isDirectory() ? '\x1B[94m' : perm.includes('x') ? '\x1B[92m' : '') + f.name + '\x1B[0m'
    }).join('\n'));
    exit(0)
}