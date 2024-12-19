import System, { User } from "./main.ts";
import EventEmitter from "eventemitter3";
import type { Terminal } from "@xterm/xterm"

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

export default class NYAterm {
    env: Map<string, string> = new Map();
    system: System;
    uid: number;
    input: string = '';
    events: EventEmitter = new EventEmitter();
    libs;
    currentProgram: Program | null = null;
    xterm?: Terminal;
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
        this.libs = this.system.libs;
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
        this.events.emit('data', `\r`+ps1)
    }
    async write(text: string) {
        if (this.currentProgram !== null) {
            this.currentProgram.stdin.write(text);
            return;
        }
        if (text === '\r') {  // Enter key pressed
            const [command, ...argv] = this.input.split(' ')
            this.events.emit('data', '\n'); // Newline after command
            //TODO - implement PATH environment variable
            const commands = this.system.fs.readdirSync('/usr/bin')
            let foundCommand = commands.find(
                (cn) =>
                    cn == command + '.js' &&
                    this.system.libs.perms.getPermStat(
                        this.system.fs.statSync(
                            this.system.libs.path.join('/usr/bin', cn)
                        ), this.user
                    )?.includes('x')
                );
            
            // @ts-expect-error
            if (foundCommand && !this.input) return this.prompt(this.input = '');

            if (!foundCommand) {
                this.libs.std.printf(`nyash: command not found: ${command}`)
                this.input = '';
                return this.prompt();
            }

            let cmdTxt = this.system.fs.readFileSync(this.system.libs.path.join('/usr/bin', foundCommand ?? '')).toString();
            let cmdUri = 'data:text/javascript;base64,'+btoa(cmdTxt)
            let foundCommandFunc = foundCommand ? (await import(cmdUri)).default : (function () { this.events.emit('data', `Unknown command: ${command}`) })  // Handle unknown commands
            
            let sendSignal = signal => {};
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

            let sendInput = (_: any) => {};
            const stdin_ev = new EventEmitter();
            const stdin: ReadableStream = new ReadableStream({
                start(controller) {
                    sendInput = d => {stdin_ev.emit('data', d);controller.enqueue(d)}
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
                stdin_ev.removeAllListeners();
                await signalStream.cancel();
                program.stdout.writer.releaseLock();
                await stdout.close();
                await stdin.cancel();
                term.currentProgram = null;
                term.input = '';
                term.prompt();
            }
            
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