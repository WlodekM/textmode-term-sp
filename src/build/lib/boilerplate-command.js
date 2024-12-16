function boilerplate(exit, argv, stdout, stdin, signal) {
  const {printf, err} = this.libs.std2({stdout}, exit, "boilerplate");
  const path = this.libs.path;
  const fs = this.system.fs;
  const filename = argv[0] ?? "";
  if (!filename)
    return err("no such file or directory: " + filename);
  const file = path.isAbsolute(filename) ? filename : path.join(this.pwd, filename);
  if (!fs.existsSync(file))
    return err("no such file or directory: " + filename);
  if (fs.statSync(file).isDirectory())
    return err("Is a directory: " + filename);
  exit(0);
}
