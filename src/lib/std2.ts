import type NYAterm from "../term/nya.ts";
import type { EventEmitter } from "eventemitter3";

export default function std2(stdio: { stdout: WritableStreamDefaultWriter, stdin: EventEmitter }, exitf: (code: number) => void, name: string, term?: NYAterm) {
    function printf(...text: string[]) {
        stdio.stdout.write(text.join('\n')+'\n')
    }
    function print(...text: string[]) {
        stdio.stdout.write(text.join('\n'))
    }
    function err(error: string) {
        printf(`${name}: ${error}`);
        exitf(1);
    }
    function size(): [number, number] {
        if (!term?.xterm) return [80, 25];
        return [term.xterm.cols, term.xterm.rows]
    }
    /**
     * Prompts the user
     * @param prompt optional - prompt
     */
    function prompt(prompt?: string): Promise<string> {
        if(prompt) print(prompt);
        return new Promise((resolve, reject) => {
            let dataBuffer = ''
            const onData = (data: string) => {
                const code = data.charCodeAt(0);
                switch (code) {
                    case 3: // ctrl+c
                        resolve('')
                        break;
    
                    case 127: // backspace
                        print('\b')
                        print(' ')
                        print('\b')
                        dataBuffer = dataBuffer.slice(0, -1)
                        break;
    
                    case +0x0D: // enter
                        stdio.stdin.off('data', onData);
                        printf()
                        resolve(dataBuffer)
                        break;
    
                    default:
                        if ((data < String.fromCharCode(0x20) || data > String.fromCharCode(0x7E))
                            && data < '\u00a0')
                            break;
                        print(data);
                        dataBuffer += data
                        break;
                }
            }
            stdio.stdin.on('data', onData)
        })
    }
    return { printf, err, size, prompt }
}