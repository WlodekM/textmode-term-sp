import type EventEmitter from "eventemitter3";
import type NYAterm from "../term/nya";

export default async function figlett(
    this: NYAterm,
    exit: (code: number) => void,
    argv: string[],
    stdout: WritableStreamDefaultWriter,
    stdin: EventEmitter
) {
    const { printf, err } = this.libs.std2({ stdout }, exit, 'boilerplate', this);
    const path = this.libs.path;
    const fs = this.system.fs
    const text = argv.join(' ');
    const cfonts = this.system.libs.cfonts

    if (text) {
        const text = cfonts.render(argv.join(' '), {
            font: 'simple',             // define the font face
            align: 'left',              // define text alignment
            colors: ['system'],         // define all colors
            background: 'transparent',  // define the background color, you can also use `backgroundColor` here as key
            letterSpacing: 1,           // define letter spacing
            lineHeight: 1,              // define the line height
            space: true,                // define if the output text should have empty lines on top and on the bottom
            maxLength: '0',             // define how many character can be on one line
            gradient: false,            // define your two gradient colors
            independentGradient: false, // define if you want to recalculate the gradient for each new line
            transitionGradient: false,  // define if this is a transition between colors directly
            rawMode: false,             // define if the line breaks should be CRLF (`\r\n`) over the default LF (`\n`)
            env: 'node'                 // define the environment cfonts is being executed in
        });
        printf(text)
        exit(0) // 0 for success
    } else {
        let dataBuffer = ''
        stdin.on('data', (data: string) => {
            const code = data.charCodeAt(0);
            switch (code) {
                case 3:
                    exit(0)
                    break;

                case 127:
                    stdout.write('\b')
                    stdout.write(' ')
                    stdout.write('\b')
                    dataBuffer = dataBuffer.slice(0, -1)
                    break;

                case +0x0D:
                    const text = cfonts.render(dataBuffer, {
                        font: 'simple',             // define the font face
                        align: 'left',              // define text alignment
                        colors: ['system'],         // define all colors
                        background: 'transparent',  // define the background color, you can also use `backgroundColor` here as key
                        letterSpacing: 1,           // define letter spacing
                        lineHeight: 1,              // define the line height
                        space: true,                // define if the output text should have empty lines on top and on the bottom
                        maxLength: '0',             // define how many character can be on one line
                        gradient: false,            // define your two gradient colors
                        independentGradient: false, // define if you want to recalculate the gradient for each new line
                        transitionGradient: false,  // define if this is a transition between colors directly
                        rawMode: false,             // define if the line breaks should be CRLF (`\r\n`) over the default LF (`\n`)
                        env: 'node'                 // define the environment cfonts is being executed in
                    });
                    printf(text)
                    dataBuffer = ''
                    break;

                default:
                    if ((data < String.fromCharCode(0x20) || data > String.fromCharCode(0x7E))
                        && data < '\u00a0')
                        break;
                    stdout.write(data);
                    dataBuffer += data
                    break;
            }
        })
    }
}