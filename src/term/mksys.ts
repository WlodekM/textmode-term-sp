import System from "./main";
import makeFS from "../lib/makeFS";

const system = new System();
system.users.set(1, {
    username: 'silly',
    root: false,
    home: '/home/silly',
    uid: 1,
    gid: 0
})
system.users.set(2, {
    username: 'guest',
    root: false,
    home: '/home/guest',
    uid: 2,
    gid: 1 // 1 is the guest group
})
makeFS.call(system)