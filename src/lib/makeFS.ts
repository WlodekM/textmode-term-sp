import System from "../term/main.ts";
import commands from "./commands.ts";

export default async function makeFS(this: System) {
    this.fs.mkdirSync('/home')
    this.fs.mkdirSync('/etc')
    this.fs.mkdirSync('/usr')
    this.fs.mkdirSync('/usr/bin')
    this.fs.symlinkSync('/usr/bin', '/bin')
    for (const [uid, user] of this.users.entries()) {
        this.fs.mkdirSync(user.home)
        this.fs.chownSync(user.home, uid, user.gid)
    }
    for (const cmd of commands) {
        const command = (await import(`../commands/${cmd}.js`)).default;
        this.fs.writeFileSync(`/usr/bin/${cmd}.js`, 'export default ' + command.toString())
        this.fs.chmodSync(`/usr/bin/${cmd}.js`, parseInt('775', 8))
    }
}