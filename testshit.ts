import system from "./src/term/mksys.ts"
import NYA from './src/term/nya.ts';
import xterm from "@xterm/xterm"

const xtermTerm = new xterm.Terminal()

const term = new NYA(system, 2, xtermTerm)

term.events.on('data', (d: string) => console.log("Data!", d, Uint8Array.from(d.split('').map<number>(c => c.charCodeAt(0)))));

const msg = 'echo hi\r';

msg.split('').forEach(d => term.write(d));