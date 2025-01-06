# textmode terminal

A terminal thingy for my webbed site

# setting up

## step 1. clone this repo

``git clone https://github.com/WlodekM/textmode-term-sp.git``

## step 2. install install install

install the required packages with your package manager of choice

eg. `yarn install` or `pnpm install` or `npm install`

## step 3. run snowpack

run `pnpm dev` or `npm run dev`

## step 4. thats it!

snowpack should've opened up a window in your browser with the terminal

it is live-updating so when you make any changes it'll reload the page for you

## step 5. adding commands

adding commands is a bit tricky

in `src/lib` theres a boilerplate command, copy it to `src/commands` and rename it
then make the command there

it is important that the command function is exported as default

after you are done making the command add the command filename (without extension) to
the array of commands in `src/lib/commands.ts`

after that simply click the `[DEV]` button in the terminal to reset the fs so that the
new command gets added

(WARNING: This will erase every single file in your virtual file system)

# TO-DO

- [ ] chmod with flags (e. +x -x)
- [ ] cp command (with -r)
- [x] move commands to their own files
- [ ] possibly use some snowpack plugin magic to either bundle the commands into 1 file or save an index of all commands
- [x] make advancedFsJson support symlinks

# IN PROGRESS
- [x] actually check permissions before doing something with the fs
- [x] use less
- [ ] make nyash into a program