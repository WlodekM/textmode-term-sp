import type NYAterm from "../term/nya";
import type EventEmitter from "eventemitter3";

export default function (this: NYAterm, exit, [filename], stdout: WritableStreamDefaultWriter, stdin: EventEmitter, signal: ReadableStreamDefaultReader<string>) {
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
}