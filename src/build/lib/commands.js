const commands = {
  help: function(exit) {
    const {printf} = this.libs.std;
    printf(Object.entries(commands).map(([_]) => _).join("\n"));
    exit(0);
  },
  echo: function(exit, argv) {
    const {printf} = this.libs.std;
    printf(argv.join(" "));
    exit(0);
  },
  clear: function(exit) {
    this.events.emit("clear");
  },
  ls: function(exit, [dir]) {
    const {printf} = this.libs.std;
    if (!this.system.fs.existsSync(dir ?? this.pwd) || !this.system.fs.statSync(dir ?? this.pwd).isDirectory()) {
      printf(`ls: cannot access '${dir ?? this.pwd}': No such file or directory`);
      return exit(1);
    }
    const dirc = this.system.fs.readdirSync(dir ?? this.pwd).map((f) => {
      return {
        name: f,
        path: this.system.libs.path.join(dir ?? this.pwd, f),
        stat: this.system.fs.statSync(this.system.libs.path.join(dir ?? this.pwd, f))
      };
    });
    printf(dirc.map((f) => {
      const perm = this.system.libs.perms.getPermStat(f.stat, this.uid);
      return (f.stat.isDirectory() ? "[94m" : perm.includes("x") ? "[92m" : "") + f.name + "[0m";
    }).join("\n"));
    exit(0);
  },
  cat: function(exit, [path]) {
    const {printf} = this.libs.std;
    const exact = path && (path.startsWith("/") || path.startsWith("~"));
    const fpath = exact ? path.replaceAll("~", this.user.home) : path ? this.system.libs.path.join(this.pwd, path.replaceAll("~", this.user.home)) : this.user.home;
    if (!this.system.fs.existsSync(fpath)) {
      printf(`cat: no such file or directory: ${path}`);
      return exit(1);
    }
    if (this.system.fs.statSync(fpath).isDirectory()) {
      printf(`cat: Is a directory: ${path}`);
      return exit(1);
    }
    printf(this.system.fs.readFileSync(fpath).toString());
    exit(0);
  },
  cd: function(exit, [dir]) {
    const {printf} = this.libs.std;
    const exact = dir && (dir.startsWith("/") || dir.startsWith("~"));
    const newDir = exact ? dir.replaceAll("~", this.user.home) : dir ? this.system.libs.path.join(this.pwd, dir.replaceAll("~", this.user.home)) : this.user.home;
    if (!this.system.fs.existsSync(newDir)) {
      printf(`cd: no such file or directory: ${dir}`);
      return exit(1);
    }
    if (!this.system.fs.statSync(newDir).isDirectory()) {
      printf(`cd: not a directory: ${dir}`);
      return exit(1);
    }
    this.pwd = newDir;
    exit(0);
  },
  achievements: function(exit, argv) {
    const {printf} = this.libs.std;
    printf("WIP");
    exit(0);
  },
  meow: function(exit, [filename], stdout, stdin, signal) {
    const {printf} = this.libs.std2({stdout});
    stdout.write("[s");
    const path = this.libs.path;
    const absoluteFpath = path.isAbsolute(filename) ? filename : path.join(this.pwd, filename);
    let dataBuffer = "";
    let saved = false;
    if (this.system.fs.existsSync(absoluteFpath) && this.system.fs.statSync(absoluteFpath).isDirectory()) {
      printf(`meow: Is a directory: ${absoluteFpath}`);
      return exit(1);
    }
    const basedir = path.dirname(absoluteFpath);
    if (!this.system.fs.existsSync(basedir) || !this.system.fs.statSync(basedir).isDirectory()) {
      printf(`ls: cannot access '${basedir}': No such file or directory`);
      return exit(1);
    }
    if (this.system.fs.existsSync(absoluteFpath)) {
      dataBuffer = this.system.fs.readFileSync(absoluteFpath).toString();
      stdout.write(dataBuffer);
    }
    stdin.on("data", (d) => {
      const code = d.charCodeAt(0);
      switch (code) {
        case 24:
          printf();
          stdout.write("[u");
          stdout.write("[J");
          exit(0);
          break;
        case 19:
          console.log("writin'", dataBuffer, "to ye", absoluteFpath);
          this.system.fs.writeFileSync(absoluteFpath, dataBuffer);
          break;
        case 127:
          stdout.write("\b");
          stdout.write(" ");
          stdout.write("\b");
          dataBuffer = dataBuffer.slice(0, -1);
          break;
        case 13:
          dataBuffer += "\n";
          stdout.write("\n");
          break;
        default:
          if ((d < String.fromCharCode(32) || d > String.fromCharCode(126)) && d < " ")
            break;
          stdout.write(d);
          dataBuffer += d;
          break;
      }
      console.log(d, d.split("").map((c) => c.charCodeAt(0)), Uint8Array.from(d.split("").map((c) => c.charCodeAt(0))));
    });
  },
  mkdir: function(exit, argv, stdout) {
    const {err} = this.libs.std2({stdout}, exit, "mkdir");
    const path = this.libs.path;
    const fs = this.system.fs;
    const filename = argv[0] ?? "";
    if (!filename)
      return err("missing operand");
    const file = path.isAbsolute(filename) ? filename : path.join(this.pwd, filename);
    if (fs.existsSync(file))
      return err(`cannot create directory '${filename}': File exists`);
    fs.mkdirSync(file);
    exit(0);
  },
  touch: function(exit, argv, stdout) {
    const {printf, err} = this.libs.std2({stdout}, exit, "boilerplate");
    const path = this.libs.path;
    const fs = this.system.fs;
    const filename = argv[0] ?? "";
    if (!filename)
      return err("invalid filename");
    const file = path.isAbsolute(filename) ? filename : path.join(this.pwd, filename);
    if (fs.existsSync(file))
      return err("file exists");
    fs.writeFileSync(file, "");
    exit(0);
  }
};
export default commands;
