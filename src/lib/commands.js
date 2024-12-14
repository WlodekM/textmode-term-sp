/** @type {{[key: string]: (argv: string[]) => void}} */
const commands =  {
    'help': function () {
        const { printf } = this.libs.std
        printf(Object.entries(commands).map(([_]) => _).join('\n'))
    },
    'echo': function (argv) {
        const { printf } = this.libs.std
        printf(argv.join(' '));
    },
    'clear': function () {
        this.events.emit('clear');
    },
    
    // FS STUFF
    'ls': function ([dir]) {
        const { printf } = this.libs.std
        if (!this.system.fs.existsSync(dir ?? this.pwd) || !this.system.fs.statSync(dir ?? this.pwd).isDirectory())
            return printf(`ls: cannot access '${dir ?? this.pwd}': No such file or directory`)
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
        }).join('\n'))
    },
    'cat': function ([path]) {
        const { printf } = this.libs.std
        const exact = path && (path.startsWith('/') || path.startsWith('~'))
        const fpath = exact ? path.replaceAll('~', this.user.home) : path ? this.system.libs.path.join(this.pwd, path.replaceAll('~', this.user.home)) : this.user.home;
        if (!this.system.fs.existsSync(fpath))
            return printf(`cat: no such file or directory: ${path}`);
        if (this.system.fs.statSync(fpath).isDirectory())
            return printf(`cat: Is a directory: ${path}`);
        
        printf(this.system.fs.readFileSync(fpath).toString())
    },
    'cd': function ([dir]) {
        const { printf } = this.libs.std
        const exact = dir && (dir.startsWith('/') || dir.startsWith('~'))
        const newDir = exact ? dir.replaceAll('~', this.user.home) : dir ? this.system.libs.path.join(this.pwd, dir.replaceAll('~', this.user.home)) : this.user.home;
        if (!this.system.fs.existsSync(newDir))
            return printf(`cd: no such file or directory: ${dir}`);
        if (!this.system.fs.statSync(newDir).isDirectory())
            return printf(`cd: not a directory: ${dir}`);
        
        this.pwd = newDir
    },
    
    // MISC
    'achievements': function (argv) {
        const { printf } = this.libs.std
        printf('WIP');
    },
    // 'ws-ssh': {
    //     aliases: [],
    //     usage: 'ws-ssh <address> <password>',
    //     description: 'ssh into a wsSsh server',
    //     fn: function ([addr, pass]) {
    //         if (!addr) return printf('ws-ssh: Missing address');
    //         if (!pass) return printf('ws-ssh: Missing password');
    //         ws = new WebSocket(addr);
    //         wsSshMode = true
    //         ws.onopen = () => ws.send(pass);
    //         ws.onclose = ws.onerror = function () {
    //             printf('Socket closed');
    //             wsSshMode = false
    //         }
            
    //         ws.onmessage = async m => {
    //             console.log(m)
    //             if (typeof m.data == 'string') {
    //                 return terminal.write(m.data.toString())
    //             }
    //             const data = m.data;
    //             const tx = await data.text();
    //             terminal.write(tx)
    //         }
    //         return true;
    //     }
    // }
}

export default commands