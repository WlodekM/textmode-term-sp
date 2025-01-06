// deno-lint-ignore-file no-case-declarations no-window
import type { EventEmitter } from "eventemitter3";
import type NYAterm from "../term/nya.ts";
import { vol } from "memfs";

export default async function dev (
    this: NYAterm,
    exit: (code: number) => void,
    argv: string[],
    stdout: WritableStreamDefaultWriter,
    stdin: EventEmitter,
    _signal: ReadableStreamDefaultReader<string>
) {
    const { printf, err, prompt: stdPrompt } = this.libs.std2({ stdin, stdout }, exit, 'dev', this);
    const path = this.libs.path;
    const fs = this.system.fs
    const memfs = this.system.memfs;
    const vol = this.system.memfs.vol;

    const mode: string = argv[0] ?? '';

    switch (mode) {
        case 'clear':
            const confirm: string = await stdPrompt('Are you sure you want to clear the FS? [y/N]:');
            if (!['y', 'yes'].includes(confirm))
            localStorage.clear();
            window.onbeforeunload = () => {};
            document.location.reload()
            break;
        
        case 'save':
            localStorage.setItem('fs', JSON.stringify(this.system.getFSjson()));
            break;
        
        case 'expose':
            //@ts-expect-error:
            window.fs = fs;
            //@ts-expect-error:
            window.memfs = memfs;
            //@ts-expect-error:
            window.vol = memfs.vol;
            printf('fs exposed');
            break;
        
        case 'users':
            printf(...[...this.system.users.entries()].map(([uid, u]) => `${uid}:
    Name: ${u.username}
    Home: ${u.home}
    Group: ${u.gid}
    Root?: ${u.root ? 'Yes' : 'No'}`));
            break;
        
        case 'su':
            const user = Number(argv[1])
            if(Number.isNaN(user) || !this.system.users.has(user))
                return printf('Unknown user '+ user);
            this.uid = user
            printf('User changed to'+user)
            break;
        
        case 'tree':
            printf(vol.toTree());
            break;
    
        default:
            printf('unknown subcommand')
            break;
    }

    exit(0) // 0 for success
}