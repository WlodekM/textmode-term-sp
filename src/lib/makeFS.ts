import System from "../term/main.ts";
import commands from "./commands.ts";

export default async function makeFS(this: System) {
    const mode = (m: number) => parseInt(m.toString(), 8)
    this.fs.mkdirSync('/home', { mode: mode(755) })
    this.fs.mkdirSync('/etc', { mode: mode(755) })
    this.fs.mkdirSync('/usr', { mode: mode(755) })
    this.fs.mkdirSync('/usr/bin', { mode: mode(755) })
    this.fs.symlinkSync('/usr/bin', '/bin')
    for (const [uid, user] of this.users.entries()) {
        this.fs.mkdirSync(user.home, { mode: 750 })
        this.fs.chownSync(user.home, uid, user.gid)
    }
    for (const cmd of commands) {
        const command = (await import(`../commands/${cmd}.js`)).default;
        this.fs.writeFileSync(`/usr/bin/${cmd}.js`, 'export default ' + command.toString())
        this.fs.chownSync(`/usr/bin/${cmd}.js`, 0, 0)
        this.fs.chmodSync(`/usr/bin/${cmd}.js`, parseInt('775', 8))
    }
}