import type NYAterm from "../term/nya";

export default function std2(stdio: { stdout: WritableStreamDefaultWriter }, exitf: (code: number) => void, name: string, term?: NYAterm) {
    function printf(...text) {
        stdio.stdout.write(text.join('\n')+'\n')
    }
    function err(error: string) {
        printf(`${name}: ${error}`);
        exitf(1);
    }
    function size(): [number, number] {
        if (!term?.xterm) return [80, 25];
        return [term.xterm.cols, term.xterm.rows]
    }
    return { printf, err, size }
}