export function printf(...text) {
    window.terminal.write(text.join('\n')+'\n')
}