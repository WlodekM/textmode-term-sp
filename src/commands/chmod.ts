import type NYAterm from "../term/nya";
import type EventEmitter from "eventemitter3";

export default function (
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