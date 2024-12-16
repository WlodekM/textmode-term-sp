export default function std2(stdio, exitf, name) {
  function printf(...text) {
    stdio.stdout.write(text.join("\n") + "\n");
  }
  function err(error) {
    printf(`${name}: ${error}`);
    exitf(1);
  }
  return {printf};
}
