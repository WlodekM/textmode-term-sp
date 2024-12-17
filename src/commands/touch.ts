import type NYAterm from "../term/nya";

export default function (
    this: NYAterm,
    exit: (code: number) => void,
    argv: string[],
    stdout: WritableStreamDefaultWriter,
) {
    const { printf, err } = this.libs.std2({ stdout }, exit, 'boilerplate');
    const path = this.libs.path;
    const fs = this.system.fs

    const filename: string = argv[0] ?? '';

    if (!filename) return err('invalid filename');

    const file = path.isAbsolute(filename) ? filename : path.join(this.pwd, filename)

    if (fs.existsSync(file)) return err('file exists');

    fs.writeFileSync(file, '')

    exit(0) // 0 for success
}