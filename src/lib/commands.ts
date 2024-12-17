import type EventEmitter from "eventemitter3";
import type NYAterm from "../term/nya";

/** @type {{[key: string]: (argv: string[]) => void}} */
const commands =  {
    'help': function (exit) {
        const { printf } = this.libs.std
        printf(Object.entries(commands).map(([_]) => _).join('\n'));
        exit(0)
    },
    'echo': function (exit, argv) {
        const { printf } = this.libs.std
        printf(argv.join(' '));
        exit(0)
    },
    'clear': function (exit) {
        this.events.emit('clear');
    },
    
    // FS STUFF
    'ls': function (exit, [dir]) {
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
    },
    'cat': function (exit, [path]) {
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
    },
    'cd': function (exit, [dir]) {
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
    },
    
    // MISC
    'achievements': function (exit, argv) {
        const { printf } = this.libs.std
        printf('WIP');
        exit(0)
    },

    'meow': function (this: NYAterm, exit, [filename], stdout: WritableStreamDefaultWriter, stdin: EventEmitter, signal: ReadableStreamDefaultReader<string>) {
        const { printf } = this.libs.std2({ stdout });

        stdout.write('\x1B[s')

        const path = this.libs.path;
        const absoluteFpath = path.isAbsolute(filename) ? filename : path.join(this.pwd, filename)
        let dataBuffer = '';
        let saved = false;
        if (this.system.fs.existsSync(absoluteFpath) && this.system.fs.statSync(absoluteFpath).isDirectory()) {
            printf(`meow: Is a directory: ${absoluteFpath}`);
            return exit(1)
        }
        const basedir = path.dirname(absoluteFpath)
        if (!this.system.fs.existsSync(basedir) || !this.system.fs.statSync(basedir).isDirectory()) {
            printf(`ls: cannot access '${basedir}': No such file or directory`);
            return exit(1)
        }

        if (this.system.fs.existsSync(absoluteFpath)) {
            dataBuffer = this.system.fs.readFileSync(absoluteFpath).toString()
            stdout.write(dataBuffer)
        }
        
        stdin.on('data', (d: string) => {
            const code = d.charCodeAt(0);
            // enum States  {
            //     ThyBeWritin, // default state, editing
            //     // ThyIsSavingThinesDocument, // save dialouge (if no filename)
            //     ThyIsConfirmingToBurnThinesDocument, // save before exit
            // }
            // let state = States.ThyBeWritin
            switch (code) {
                case 24: // ctrl+x
                    printf()
                    stdout.write('\x1B[u')
                    stdout.write('\x1B[J')
                    exit(0)
                    break;
                
                case 19:
                    console.log('writin\'', dataBuffer, 'to ye', absoluteFpath)
                    this.system.fs.writeFileSync(absoluteFpath, dataBuffer);
                    break;
                
                case 127:
                    stdout.write('\b')
                    stdout.write(' ')
                    stdout.write('\b')
                    dataBuffer = dataBuffer.slice(0, -1)
                    break;

                case +0x0D:
                    dataBuffer += '\n';
                    stdout.write('\n');
                    break;
            
                default:
                    if((d < String.fromCharCode(0x20) || d > String.fromCharCode(0x7E)) && d < '\u00a0') break;
                    stdout.write(d);
                    dataBuffer += d
                    break;
            }
            console.log(d, d.split('').map(c => c.charCodeAt(0)), Uint8Array.from(d.split('').map(c => c.charCodeAt(0))))
        });
    },

    mkdir: function (
        this: NYAterm,
        exit: (code: number) => void,
        argv: string[],
        stdout: WritableStreamDefaultWriter,
    ) {
        const { err } = this.libs.std2({ stdout }, exit, 'mkdir');
        const path = this.libs.path;
        const fs = this.system.fs
    
        const filename: string = argv[0] ?? '';
    
        if (!filename) return err('missing operand');
    
        const file = path.isAbsolute(filename) ? filename : path.join(this.pwd, filename)
    
        if (fs.existsSync(file)) return err(`cannot create directory '${filename}': File exists`);
    
        fs.mkdirSync(file)
    
        exit(0) // 0 for success
    },

    touch: function (
        this: NYAterm,
        exit: (code: number) => void,
        argv: string[],
        stdout: WritableStreamDefaultWriter,
    ) {
        const { printf, err } = this.libs.std2({ stdout }, exit, 'boilerplate');
        const path = this.libs.path;
        const fs = this.system.fs

        const filename: string = argv[0] ?? '';

        if (!filename) return err('invalid filename');

        const file = path.isAbsolute(filename) ? filename : path.join(this.pwd, filename)

        if (fs.existsSync(file)) return err('file exists');

        fs.writeFileSync(file, '')

        exit(0) // 0 for success
    },

    chmod: function (
        this: NYAterm,
        exit: (code: number) => void,
        argv: string[],
        stdout: WritableStreamDefaultWriter,
        stdin: EventEmitter,
        signal: ReadableStreamDefaultReader<string>
    ) {
        const { printf, err } = this.libs.std2({ stdout }, exit, 'boilerplate');
        const path = this.libs.path;
        const fs = this.system.fs
    
        const filename: string = argv[1] ?? '';
        const mode: string = argv[0] ?? '';
    
        if (!filename) return err('no such file or directory: ' + filename);
    
        const file = path.isAbsolute(filename) ? filename : path.join(this.pwd, filename)
    
        if (!fs.existsSync(file)) return err('no such file or directory: ' + filename);
        if (fs.statSync(file).isDirectory()) return err('Is a directory: ' + filename);
        
        const stat = fs.statSync(file);
        // const oldFilePerms = parseInt((stat.mode & 0o777).toString(8).padStart(3, '0'), 10)
        // const newFilePerms = modifyFilePermissions(oldFilePerms, mode);

        fs.chmodSync(file, mode);
    
        exit(0) // 0 for success
    }
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