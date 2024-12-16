import {memfs} from "../_snowpack/pkg/memfs.js";
import * as path from "https://esm.sh/jsr/@std/path@1.0.8";
import * as std from "../lib/std.js";
import std2 from "../lib/std2.js";
export default class System {
  constructor() {
    this.memfs = memfs();
    this.fs = this.memfs.fs;
    this.users = new Map();
    this.libs = {
      path,
      std,
      std2,
      perms: {
        getPerm(permissionNumber, userLevel) {
          if (permissionNumber < 0 || permissionNumber > 777) {
            return "Invalid permission number. It must be between 000 and 777.";
          }
          const permissions = {
            read: "r",
            write: "w",
            execute: "x"
          };
          const permissionArray = permissionNumber.toString().padStart(3, "0").split("");
          let index;
          switch (userLevel) {
            case "u":
              index = 0;
              break;
            case "g":
              index = 1;
              break;
            case "o":
              index = 2;
              break;
            default:
              return "Invalid user level. Please use 'u' for user, 'g' for group, or 'o' for others.";
          }
          let levelPermissions = parseInt(permissionArray[index]);
          let permissionsString = "";
          if (levelPermissions >= 4) {
            permissionsString += permissions.read;
            levelPermissions -= 4;
          }
          if (levelPermissions >= 2) {
            permissionsString += permissions.write;
            levelPermissions -= 2;
          }
          if (levelPermissions >= 1) {
            permissionsString += permissions.execute;
          }
          return permissionsString;
        },
        getPermStat(stat, user) {
          const mode = parseInt((stat.mode & 511).toString(8).padStart(3, "0"), 10);
          const perm = user.uid == stat.uid ? "u" : user.gid == stat.gid ? "g" : "o";
          return this.getPerm(mode, perm);
        }
      }
    };
    this.hostname = "textmode";
    this.users.set(0, {
      username: "root",
      root: true,
      home: "/home/root",
      uid: 0,
      gid: 0
    });
  }
}
