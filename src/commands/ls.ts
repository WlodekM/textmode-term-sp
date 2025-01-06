import type { EventEmitter } from "eventemitter3";
import type NYAterm from "../term/nya.ts";
import type { Stats } from 'node:fs'

export default function (
    this: NYAterm,
    exit: (code: number) => void,
    argv: string[],
    stdout: WritableStreamDefaultWriter,
    stdin: EventEmitter,
    signal: ReadableStreamDefaultReader<string>
) {
    const { printf, parseArgs } = this.libs.std2({ stdin, stdout }, exit, 'ls', this)
    const { flags, others } = parseArgs(argv)
    const dir = others[0]
    if (!this.system.fs.existsSync(dir ?? this.pwd) || !this.system.fs.statSync(dir ?? this.pwd).isDirectory()) {
        printf(`ls: cannot access '${dir ?? this.pwd}': No such file or directory`)
        return exit(1)
    }
    type advDirent = {
        name: string,
        path: string,
        stat: Stats,
        display: string
    }
    // stands for dir contents if i forgor
    const dirc = this.system.fs.readdirSync(dir ?? this.pwd).map(f => {
        return {
            name: f,
            path: this.system.libs.path.join(dir ?? this.pwd, f),
            stat: this.system.fs.statSync(this.system.libs.path.join(dir ?? this.pwd, f))
        }
    });
    let out = dirc.map<advDirent>((f) => {
        const perm = this.system.libs.perms.getPermStat(f.stat, this.user)
        const display = (f.stat.isDirectory() ? '\x1B[94m' : perm.includes('x') ? '\x1B[92m' : '') + f.name + '\x1B[0m'
        return {...f, display} as advDirent
    })
    if (flags.m || flags.mode) {
        out = out.map(f => {
            let p = 'rwx'
            let mode = (f.stat.mode & 0o777)
                .toString(8).split('')
                .map(n => parseInt(n).toString(2))
                .map(j => j.split('').map((a, i) => a == '1' ? p[i] : '-').join('')).join('')
            f.display = mode + ' ' + f.display
            return f
        })
    }
    printf(...out.map(k => k.display));
    exit(0)
}