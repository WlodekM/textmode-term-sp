import type NYAterm from "../term/nya";

export default function (
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
}