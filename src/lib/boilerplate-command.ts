import type { EventEmitter } from "eventemitter3";
import type NYAterm from "../term/nya.ts";

//CHANGEME - change the function name to the command name, doesnt matter that much
export default function boilerplate (
    this: NYAterm,
    exit: (code: number) => void,
    argv: string[],
    stdout: WritableStreamDefaultWriter,
    stdin: EventEmitter,
    signal: ReadableStreamDefaultReader<string>
) {
    // change the 'boilerplate' to your command's name for err messages
    const { printf, err } = this.libs.std2({ stdout, stdin }, exit, 'boilerplate', this);
    const path = this.libs.path;
    const fs = this.system.fs

    const filename: string = argv[0] ?? '';

    if (!filename) return err('no such file or directory: ' + filename);

    const file = path.isAbsolute(filename) ? filename : path.join(this.pwd, filename)

    if (!fs.existsSync(file)) return err('no such file or directory: ' + filename);
    if (fs.statSync(file).isDirectory()) return err('Is a directory: ' + filename);

    // uh idk do something with the file
    // ...

    exit(0) // 0 for success
}