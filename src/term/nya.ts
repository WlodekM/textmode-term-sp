import EventEmitter from "eventemitter3";
import type System from "./main.ts";
import type { User } from './main.ts'
import type { Terminal } from "@xterm/xterm"
import type * as std from '../lib/std.js'
import type std2 from '../lib/std2.ts'
import type { Stats } from 'node:fs'
import type { IFs } from "memfs";
import type path from 'node:path/posix'
import type cfonts from 'cfonts'

type Program = {
    signal: {
        stream: ReadableStream<string>,
        write: (data: any) => void
    },
    stdout: {
        stream: WritableStream,
        writer: WritableStreamDefaultWriter
    },
    stdin: {
        stream: ReadableStream,
        ev: EventEmitter,
        write: (data: any) => void,
    }
}

interface Libs {
    path: typeof path,
    std: typeof std,
    std2: typeof std2,
    cfonts: typeof cfonts,
    perms: {
        getPerm(permissionNumber: number, userLevel: 'u' | 'g' | 'o'): string,
        getPermStat(stat: Stats, user: User): string,
        getPermStatLevel(stat: Stats, user: User): [string, 'u' | 'g' | 'o'],
    }
}

export default class NYAterm {
    env: Map<string, string> = new Map();
    system: System;
    uid: number;
    input: string = '';
    events: EventEmitter = new EventEmitter();
    libs: Libs;
    currentProgram: Program | null = null;
    xterm?: Terminal;
    get fs(): IFs {
        return this.system.fs
    }
    get pwd(): string {
        return this.env.get("PWD") as string
    }
    set pwd(v: string) {
        this.env.set('PWD', v)
    }
    get user(): User {
        return this.system.users.get(this.uid) as User
    }
    constructor(sys: System, uid: number, xterm?: Terminal) {
        this.system = sys
        if (xterm) this.xterm = xterm
        this.libs = this.system.libs as Libs;
        this.env.set("PS1", '[\\u@\\h \\d]\\$ ')
        this.env.set("SHELL", '/usr/sbin/nya-shell.js')
        this.env.set("PWD", '/');
        this.uid = uid;
        this.env.set("HOME", this.user.home);
        this.env.set("PWD", this.env.get("HOME") as string);
        this.events.emit('ready')
        this.prompt()
    }
    prompt() {
        let ps1 = this.env.get("PS1") as string;
        ps1 = ps1.replaceAll('\\u', this.user.username)
        ps1 = ps1.replaceAll('\\h', this.system.hostname);
        let shortCwdSplit = this.pwd.replaceAll(this.user.home, '~').split('/')
        ps1 = ps1.replaceAll('\\d', shortCwdSplit[shortCwdSplit.length - 1] || '/')
        ps1 = ps1.replaceAll('\\p', this.pwd.replaceAll(this.user.home, '~'));
        ps1 = ps1.replaceAll('\\$', this.uid == 0 ? '#' : '$');
        this.events.emit('data', `\r` + ps1)
    }
    async runcmd(cmd: string, argv: string[]) {
        let command: string;
        function notfound(this: NYAterm) {
            this.libs.std.printf(`nyash: command not found: ${cmd}`);
            this.input = '';
            this.prompt()
        }
        if (this.fs.existsSync(this.libs.path.resolve(this.pwd, cmd)) && cmd !== this.libs.path.basename(cmd)) {
            command = this.libs.path.resolve(this.pwd, cmd)
        } else if (this.fs.existsSync(`/bin/${cmd}.js`) && cmd == this.libs.path.basename(cmd)) {
            command = this.libs.path.join('/bin', `/${this.libs.path.basename(cmd)}.js`)
        } else return notfound.call(this)
        if (!this.system.libs.perms.getPermStat(
            this.system.fs.statSync(
                command
            ), this.user
        )?.includes('x')) {
            return notfound.call(this)
        }

        let cmdTxt = this.system.fs.readFileSync(command).toString();
        let cmdUri = 'data:text/javascript;base64,' + btoa(cmdTxt);
        const impCmd = (await import(cmdUri)).default;
        const foundCommandFunc = typeof impCmd == 'function' ? impCmd : (function () { this.events.emit('data', `nyash: command not found: ${command}`) })

        let sendSignal = (_: any) => { };
        const signalStream: ReadableStream<string> = new ReadableStream<string>({
            start(controller) {
                sendSignal = controller.enqueue
            }
        });

        const events = this.events
        const stdout = new WritableStream({
            write(chunk) {
                events.emit('data', chunk)
            }
        })

        let sendInput = (_: any) => { };
        const stdin_ev = new EventEmitter();
        const stdin: ReadableStream = new ReadableStream({
            start(controller) {
                sendInput = d => { stdin_ev.emit('data', d); controller.enqueue(d) }
            }
        });

        const program: Program = {
            signal: {
                stream: signalStream,
                write: sendSignal
            },
            stdout: {
                stream: stdout,
                writer: stdout.getWriter()
            },
            stdin: {
                stream: stdin,
                ev: stdin_ev,
                write: sendInput,
            }
        }

        this.currentProgram = program

        const term = this;

        const ingoing_signals = new WritableStream<number>({
            async write(exit_code) {
                stdin_ev.removeAllListeners();
                await signalStream.cancel();
                program.stdout.writer.releaseLock();
                await stdout.close();
                await stdin.cancel();
                term.currentProgram = null;
                term.input = '';
                term.prompt();
            }
        });

        function exit(code: number) {
            ingoing_signals.getWriter().write(code);
            return
        }

        try {
            await foundCommandFunc.call(
                this,
                exit,
                argv,
                program.stdout.writer,
                program.stdin.ev,
                program.signal.stream
            )
        } catch (error) {
            this.events.emit('data', 'Uncaught error: ' + error + '\n');
            console.error(error)
            exit(1)
        }
    }
    async write(text: string) {
        if (this.currentProgram !== null) {
            this.currentProgram.stdin.write(text);
            return;
        }
        if (text === '\r') {  // Enter key pressed
            const [command, ...argv] = this.input.split(' ')
            this.libs.std.printf('')
            return this.runcmd(command, argv)

        } else if (text === '\u007F') {  // Handle backspace (DEL)
            if (this.input.length > 0) {
                this.input = this.input.slice(0, -1);  // Remove last character from input
                this.events.emit('data', '\b \b');  // Simulate backspace in terminal
            }
        } else if (text >= String.fromCharCode(0x20) && text <= String.fromCharCode(0x7E) || text >= '\u00a0') {
            this.input += text;
            this.events.emit('data', text);
        }
    }
}