import System from "../term/main.ts";
import commands from "./commands.ts";

export default function makeFS(this: System) {
    this.fs.mkdirSync('/home')
    this.fs.mkdirSync('/etc')
    this.fs.mkdirSync('/usr')
    this.fs.mkdirSync('/usr/bin')
    this.fs.symlinkSync('/usr/bin', '/bin')
    for (const [uid, user] of this.users.entries()) {
        this.fs.mkdirSync(user.home)
        this.fs.chownSync(user.home, uid, user.gid)
    }
    for (const cmd in commands) {
        const command = commands[cmd];
        this.fs.writeFileSync(`/usr/bin/${cmd}.js`, 'export default ' + command.toString())
        this.fs.chmodSync(`/usr/bin/${cmd}.js`, 775)
    }
}