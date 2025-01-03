import { memfs } from "memfs";
import System, { User } from "../term/main";
import type * as fstm from 'memfs/lib/node/types/misc'
import type * as fso from 'memfs/lib/node/types/options'
import type * as fst from 'memfs/lib/node/types'

export default class FS {
    private sys: System
    private user: User
    constructor (sys: System, user: User) {
        this.sys = sys;
        this.user = user
    }
    getPerm(path: string): [string, 'u' | 'g' | 'o'] {
        return this.sys.libs.perms.getPermStatLevel(this.sys.fs.statSync(path), this.user) as [string, 'u' | 'g' | 'o']
    }
    readFileSync(file: fstm.TFileId, options?: fso.IReadFileOptions | string): fstm.TDataOut {
        if (!this.getPerm(file.toString())[0].includes('r')) throw 'EACCESS';
        return this.sys.fs.readFileSync(file, options)
    }
    writeFileSync(id: fstm.TFileId, data: fstm.TData, options?: fso.IWriteFileOptions): void {
        if (!this.getPerm(id.toString())[0].includes('w')) throw 'EACCESS';
        this.sys.fs.writeFileSync(id, data, options)
    }
    get statSync() {
        return this.sys.fs.statSync
    }
    get existsSync() {
        return this.sys.fs.existsSync
    }
    appendFileSync(id: fstm.TFileId, data: fstm.TData, options?: fso.IAppendFileOptions | string): void {
        if (!this.getPerm(id.toString()).includes('w')) throw 'EACCESS';
        this.sys.fs.appendFileSync(id, data, options)
    }
    chmodSync(path: fstm.PathLike, mode: fstm.TMode): void {
        if (!['u', 'g'].includes(this.getPerm(path.toString())[1])) throw 'EACCESS';
        return this.sys.fs.chmodSync(path, mode)
    }
    chownSync(path: fstm.PathLike, uid: number, gid: number): void {
        if (!['u'].includes(this.getPerm(path.toString())[1])) throw 'EACCESS';
        return this.sys.fs.chownSync(path, uid, gid)
    }
    copyFileSync(src: fstm.PathLike, dest: fstm.PathLike, flags?: fstm.TFlagsCopy): void {
        if (!this.getPerm(src.toString())[0].includes('w')) throw 'EACCESS';
        this.sys.fs.copyFileSync(src, dest, flags)
    }
    symlinkSync(target: fstm.PathLike, path: fstm.PathLike, type?: fstm.symlink.Type): void {
        if (!this.getPerm(target.toString())[0].includes('w')) throw 'EACCESS';
    }
}
