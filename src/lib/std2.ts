export default function std2(stdio: { stdout: WritableStreamDefaultWriter }, exitf: (code: number) => void, name: string) {
    function printf(...text) {
        stdio.stdout.write(text.join('\n')+'\n')
    }
    function err(error: string) {
        printf(`${name}: ${error}`);
        exitf(1);
    }
    return { printf, err }
}