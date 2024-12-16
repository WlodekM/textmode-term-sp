import EventEmitter from "../_snowpack/pkg/eventemitter3.js";
export default class NYAterm {
  constructor(sys, uid) {
    this.env = new Map();
    this.input = "";
    this.events = new EventEmitter();
    this.currentProgram = null;
    this.system = sys;
    this.libs = this.system.libs;
    this.env.set("PS1", "[\\u@\\h \\d]\\$ ");
    this.env.set("SHELL", "/usr/sbin/nya-shell.js");
    this.env.set("PWD", "/");
    this.uid = uid;
    this.env.set("HOME", this.user.home);
    this.env.set("PWD", this.env.get("HOME"));
    this.events.emit("ready");
    this.prompt();
  }
  get pwd() {
    return this.env.get("PWD");
  }
  set pwd(v) {
    this.env.set("PWD", v);
  }
  get user() {
    return this.system.users.get(this.uid);
  }
  prompt() {
    let ps1 = this.env.get("PS1");
    ps1 = ps1.replaceAll("\\u", this.user.username);
    ps1 = ps1.replaceAll("\\h", this.system.hostname);
    let shortCwdSplit = this.pwd.replaceAll(this.user.home, "~").split("/");
    ps1 = ps1.replaceAll("\\d", shortCwdSplit[shortCwdSplit.length - 1] || "/");
    ps1 = ps1.replaceAll("\\p", this.pwd.replaceAll(this.user.home, "~"));
    ps1 = ps1.replaceAll("\\$", this.uid == 0 ? "#" : "$");
    this.events.emit("data", `\r` + ps1);
  }
  async write(text) {
    if (this.currentProgram !== null) {
      this.currentProgram.stdin.write(text);
      return;
    }
    if (text === "\r") {
      let exit = function(code) {
        ingoing_signals.getWriter().write(code);
        return;
      };
      const [command, ...argv] = this.input.split(" ");
      this.events.emit("data", "\n");
      const commands = this.system.fs.readdirSync("/usr/bin");
      let foundCommand = commands.find((cn) => cn == command + ".js" && this.system.libs.perms.getPermStat(this.system.fs.statSync(this.system.libs.path.join("/usr/bin", cn)), this.user)?.includes("x"));
      if (foundCommand && !this.input)
        return this.prompt(this.input = "");
      if (!foundCommand) {
        this.libs.std.printf(`nyash: command not found: ${command}`);
        this.input = "";
        return this.prompt();
      }
      let cmdTxt = this.system.fs.readFileSync(this.system.libs.path.join("/usr/bin", foundCommand ?? "")).toString();
      let cmdUri = "data:text/javascript;base64," + btoa(cmdTxt);
      let foundCommandFunc = foundCommand ? (await import(cmdUri)).default : function() {
        this.events.emit("data", `Unknown command: ${command}`);
      };
      let sendSignal = (signal) => {
      };
      const signalStream = new ReadableStream({
        start(controller) {
          sendSignal = controller.enqueue;
        }
      });
      const events = this.events;
      const stdout = new WritableStream({
        write(chunk) {
          events.emit("data", chunk);
        }
      });
      let sendInput = (_) => {
      };
      const stdin_ev = new EventEmitter();
      const stdin = new ReadableStream({
        start(controller) {
          sendInput = (d) => {
            stdin_ev.emit("data", d);
            controller.enqueue(d);
          };
        }
      });
      const program = {
        signal: {
          stream: signalStream,
          write: sendSignal
        },
        stdout: {
          stream: stdout,
          writer: stdout.getWriter()
        },
        stdin: {
          stream: stdin,
          ev: stdin_ev,
          write: sendInput
        }
      };
      this.currentProgram = program;
      const term = this;
      const ingoing_signals = new WritableStream({
        async write(exit_code) {
          stdin_ev.removeAllListeners();
          await signalStream.cancel();
          program.stdout.writer.releaseLock();
          await stdout.close();
          await stdin.cancel();
          term.currentProgram = null;
          term.input = "";
          term.prompt();
        }
      });
      try {
        await foundCommandFunc.call(this, exit, argv, program.stdout.writer, program.stdin.ev, program.signal.stream);
      } catch (error) {
        this.events.emit("data", "Uncaught error: " + error + "\n");
        stdin_ev.removeAllListeners();
        await signalStream.cancel();
        program.stdout.writer.releaseLock();
        await stdout.close();
        await stdin.cancel();
        term.currentProgram = null;
        term.input = "";
        term.prompt();
      }
    } else if (text === "") {
      if (this.input.length > 0) {
        this.input = this.input.slice(0, -1);
        this.events.emit("data", "\b \b");
      }
    } else if (text >= String.fromCharCode(32) && text <= String.fromCharCode(126) || text >= " ") {
      this.input += text;
      this.events.emit("data", text);
    }
  }
}
