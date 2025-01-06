# ARCHITECTURE

> NOTE: this architecture hasn't yet been implemented

## manager

the manager is the most low-level part of tmt

it may start programs while providing them with the tty and std, but those are the only things that it provides

## ttys

ttys are a way of communicating with terminals, they are fake files in the /dev/ directory

to use them open up a read/write stream with memfs

## nyash

nyash is the shell for tmt it supports POSIX-like syntax while providing programs it creates with an ENV

## STD and libs

programs may use libs using the provided STD library, probably with some sort of function

## programs

programs are js files located in /bin/, /sbin/ or /lib/ and are executed by the [manager](#manager), [nyash](#nyash) or other programs

they consist of a default exported function that is provided with the exit function, TTY, std lib and optionally the ENV and argv in the arguments

ex:

```js
export default function main(exit, tty, std, env, argv) {
    const { ttyReadStream, ttyWriteStream } = std.getTTY(tty);

    ttyWriteStream.write("Hello!");

    return exit(0); // 0 for success
}
```

the programs are required to exit after they are finished, though they may be killed manually

## file system

the file system is structured almost identically to linux:
```
/
├─ bin → /usr/bin
├─ sbin/
│  └─ <system programs>
├─ lib/
│  └─ <libraries>
├─ etc/
│  └─ <configuration files>
├─ dev/
│  └─ <devices (ttys)>
├─ home/
│  ├─ user1/
│  ├─ user2/
│  └─ user3/
└─ usr/
   └─ bin/
      └─ <programs>
```

## the std lib

the std lib is the basis of all programs it provides access to the FS and other utilities
