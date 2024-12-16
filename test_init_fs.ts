import System from "./src/term/main.ts";

const sys = new System();

console.log(sys.fs.readdirSync('/'))