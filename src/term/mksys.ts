import System from "./main.ts";
import makeFS from "../lib/makeFS.ts";

export default async function makeSys(json?: string) {
    const system = new System(json);
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
    if(!json) await makeFS.call(system);
    return system
}