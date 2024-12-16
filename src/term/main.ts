import virtualfs, { memfs } from 'memfs';
//@ts-ignore
import * as path from 'https://esm.sh/jsr/@std/path@1.0.8';
import * as std from "../lib/std.js"
import std2 from "../lib/std2.ts"

export type User = {
    username: string,
    root: boolean,
    home: string,
    uid: number,
    gid: number
}

export default class System {
    hostname: string
    memfs = memfs();
    fs = this.memfs.fs;
    users: Map<number, User> = new Map<number, User>();
    libs = {
        path,
        std,
        std2: std2,
        perms: {
            getPerm(permissionNumber, userLevel) {
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
                switch(userLevel) {
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
                        return "Invalid user level. Please use 'u' for user, 'g' for group, or 'o' for others.";
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
            
            getPermStat(stat, user) {
                const mode = parseInt((stat.mode & 0o777).toString(8).padStart(3, '0'), 10)
                const perm = user.uid == stat.uid ? 'u' : user.gid == stat.gid ? 'g' : 'o';
                return this.getPerm(mode, perm)
            }
        }
    }

    constructor() {
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