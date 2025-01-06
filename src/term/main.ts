// deno-lint-ignore-file no-explicit-any
import { memfs, IFs, vol } from 'memfs';
import type { Stats } from 'node:fs'
//@ts-ignore: when deno is disabled it cant find this module
import * as path from 'https://esm.sh/jsr/@std/path@1.0.8';
import * as std from "../lib/std.js"
import std2 from "../lib/std2.ts"
import cfonts from 'cfonts'
import type { Libs } from './nya.ts';

export type User = {
    username: string,
    root: boolean,
    home: string,
    uid: number,
    gid: number
}

interface metadata {
    path: string,
    mode: number
    owner: {
        uid: number,
        gid: number,
    },
    type: string,
}

interface fileMetadata extends metadata {
    type: 'file',
    content: string
}

interface dirMetadata extends metadata {
    type: 'directory',
    children: Metadata[]
}

interface symlinkMetadata extends metadata {
    type: 'symlink',
    target: string,
    lType: 'file' | 'directory'
}

type Metadata = fileMetadata | dirMetadata | symlinkMetadata

type Volume = typeof vol

export default class System {
    hostname: string
    memfs: {
        fs: IFs;
        vol: typeof vol;
    };
    fs: IFs;
    users: Map<number, User> = new Map<number, User>();
    libs: Libs = {
        path,
        std,
        std2: std2,
        cfonts,
        perms: {
            getPerm(permissionNumber: number, userLevel: 'u' | 'g' | 'o') {
                // Ensure the permission number is within valid range (0 to 777)
                if (permissionNumber < 0 || permissionNumber > 777) {
                    return "Invalid permission number. It must be between 000 and 777.";
                }

                // Define the permission bits for read, write, and execute
                const permissions = {
                    read: 'r',
                    write: 'w',
                    execute: 'x',
                };

                // Map the permission number to an array of 3 digits (User, Group, Others)
                const permissionArray = permissionNumber.toString().padStart(3, '0').split('');

                // Find the index of the user level (u = 0, g = 1, o = 2)
                let index;
                switch (userLevel) {
                    case 'u':
                        index = 0;
                        break;
                    case 'g':
                        index = 1;
                        break;
                    case 'o':
                        index = 2;
                        break;
                    default:
                        throw "Invalid user level. Please use 'u' for user, 'g' for group, or 'o' for others.";
                }

                // Get the numeric permission value for the selected user level
                let levelPermissions = parseInt(permissionArray[index]);

                // Translate the numeric value (0-7) to actual read, write, execute permissions
                let permissionsString = '';
                if (levelPermissions >= 4) {
                    permissionsString += permissions.read; levelPermissions -= 4;
                }
                if (levelPermissions >= 2) {
                    permissionsString += permissions.write; levelPermissions -= 2;
                }
                if (levelPermissions >= 1) {
                    permissionsString += permissions.execute;
                }

                return permissionsString;
            },

            getPermStat(stat: Stats, user: User) {
                return this.getPermStatLevel(stat, user)[0]
            },

            getPermStatLevel(stat: Stats, user: User) {
                const mode = parseInt((stat.mode & 0o777).toString(8).padStart(3, '0'), 10)
                const perm = user.uid == stat.uid || user.uid == 0 ? 'u' : user.gid == stat.gid ? 'g' : 'o';
                return [this.getPerm(mode, perm), perm]
            }
        }
    }
    
    getFSjson(path = '/') {
        const vol = this.memfs.vol;
        const stats = vol.lstatSync(path); // Get stats for the current path
        const isDirectory = stats.isDirectory();
        const isSymlink = stats.isSymbolicLink();

        const metadata: any = {
            path,
            mode: stats.mode,
            owner: {
                uid: stats.uid, // Requires chown to set uid
                gid: stats.gid, // Requires chown to set gid
            },
            type: isSymlink ? 'symlink' : isDirectory ? 'directory' : 'file',
        };

        if (isSymlink) {
            metadata.target = vol.readlinkSync(path)
            metadata.lType = isDirectory ? 'directory' : 'file'
        } else if (isDirectory) {
            console.log(vol.readdirSync(path))
            metadata.children = vol.readdirSync(path).map((name) =>
                this.getFSjson(`${path.endsWith('/') ? path : path + '/'}${name}`)
            );
        } else {
            metadata.content = vol.readFileSync(path, 'utf8'); // Include file content
        }

        return metadata as Metadata;
    }

    setFSjson(fsJson: Metadata, vol: Volume): Volume {
        const createEntry = (entry: Metadata, _currentPath: string = '/'): void => {
            const fullPath = entry.path.replace(/\/+/g, '/');

            console.log(fullPath, entry)
            if (entry.type === 'directory') {
                // Create directory and set its mode
                if (!vol.existsSync(fullPath))
                    vol.mkdirSync(fullPath, { mode: entry.mode });
                else vol.chmodSync(fullPath, entry.mode)

                // Recursively create children
                if (entry.children) {
                    for (const child of entry.children) {
                        createEntry(child, fullPath);
                    }
                }
            } else if (entry.type === 'file') {
                // Create file with content and set its mode
                vol.writeFileSync(fullPath, entry.content || '', { mode: entry.mode });
            } else if (entry.type === 'symlink') {
                try {
                    let paf = entry.lType == 'directory' ? this.libs.path.dirname(entry.target.replace(/([^\/])$/g, '$1/')) : entry.target.replace(/([^\/])$/g, '$1/')
                    console.debug('recursively making', entry.target.replace(/([^\/])$/g, '$1/'), paf)
                    vol.mkdirSync(paf, {recursive: true})
                    const stat = vol.statSync(entry.target)
                    console.debug('stat:', stat, stat.isDirectory())
                } catch (e) {console.error('err while recursively mkdir', e)}
                if (entry.lType == 'file' && !vol.existsSync(entry.target))
                    vol.writeFileSync(entry.target, '');
                vol.symlinkSync(entry.target, fullPath, entry.lType == 'directory' ? 'dir' : 'file')
            }

            // Set ownership if specified
            if (entry.owner) {
                vol.chownSync(fullPath, entry.owner.uid || 0, entry.owner.gid || 0);
            }
        };

        createEntry(fsJson);
        return vol;
    }

    constructor(json?: string) {
        this.memfs = memfs();
        if (json) {
            this.memfs.fs.rmdirSync('/', {recursive: true})
            this.memfs.vol = this.setFSjson(JSON.parse(json), this.memfs.vol)
        }
        this.fs = this.memfs.fs;
        this.hostname = 'textmode';
        this.users.set(0, {
            username: 'root',
            root: true,
            home: '/home/root',
            uid: 0,
            gid: 0 // 0 is the admin group
        })
    }
}