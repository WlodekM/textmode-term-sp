import type NYAterm from "../term/nya";
import type EventEmitter from "eventemitter3";


export default function (
    this: NYAterm,
    exit: (code: number) => void,
    [debug],
    stdout: WritableStreamDefaultWriter,
    stdin: EventEmitter,
    signal: ReadableStreamDefaultReader<string>
) {
    const { printf, size } = this.libs.std2({ stdout }, exit, 'game', this);
    class Board<T> {
        board: T[] = [];
        width: number;
        height: number;
    
        constructor(width: number, height: number, defaultT: () => T) {
            this.board = new Array(width * height).fill(0).map(defaultT);
            this.width = width;
            this.height = height
        }
    
        /**
         * Get an element
         */
        get(x: number, y: number): T {
            return this.board[x + (y * this.width)]
        }
    
        /**
         * Set an element
         */
        set(x: number, y: number, el: T): T {
            return this.board[x + (y * this.width)] = el;
        }
    
        getAll() {
            const board: T[][] = [[]];
            for (let i = 0, x = 0, y = 0; i < this.board.length; i++) {
                x++;
                board[board.length - 1].push(this.board[i])
                if (x >= this.width) {
                    y++;
                    x = 0;
                    board.push([])
                }
            }
            return board
        }
    }
    
    class Color {
        // Define the ANSI color codes for foreground and background
        private static foregroundColors: Record<string, number> = {
            black: 30,
            red: 31,
            green: 32,
            yellow: 33,
            blue: 34,
            magenta: 35,
            cyan: 36,
            white: 37,
            reset: 39, // Reset to default terminal color
            brightBlack: 90,
            brightRed: 91,
            brightGreen: 92,
            brightYellow: 93,
            brightBlue: 94,
            brightMagenta: 95,
            brightCyan: 96,
            brightWhite: 97, 
        };
    
        private static backgroundColors: Record<string, number> = {
            black: 40,
            red: 41,
            green: 42,
            yellow: 43,
            blue: 44,
            magenta: 45,
            cyan: 46,
            white: 47,
            reset: 49, // Reset to default terminal background
            brightBlack: 100,
            brightRed: 101,
            brightGreen: 102,
            brightYellow: 103,
            brightBlue: 104,
            brightMagenta: 105,
            brightCyan: 106,
            brightWhite: 107, 
        };
    
        private static boldCode = 1; // ANSI code for bold
    
        private foreground: string;
        private background?: string;
        private bold: boolean;
    
        constructor(foreground: string, background?: string, bold: boolean = false) {
            if (!Color.foregroundColors[foreground]) {
                throw new Error(`Invalid foreground color: ${foreground}`);
            }
    
            this.foreground = foreground;
            this.background = background;
            this.bold = bold;
        }
    
        // Method to convert to ANSI escape sequence
        toString(): string {
            const codes: number[] = [];
    
            // Add bold code if applicable
            if (this.bold) {
                codes.push(Color.boldCode);
            }
    
            // Add foreground color code
            codes.push(Color.foregroundColors[this.foreground]);
    
            // Add background color code if applicable
            if (this.background && Color.backgroundColors[this.background]) {
                codes.push(Color.backgroundColors[this.background]);
            }
    
            // Return ANSI escape sequence in the format: "\x1b[code1;code2;...m"
            return `\x1b[${codes.join(';')}m`;
        }
    }
    
    enum TileType {
        Empty = 'Empty',
        Player = 'Player',
        Wall = 'Wall',
        WallV = 'WallV',
        WallH = 'WallH',
    }
    
    class Tile {
        color: Color;
        type: TileType;
        constructor(color: Color, type: TileType) {
            this.color = color;
            this.type = type
        }
    }
    
    type dir = 'up' | 'down' | 'left' | 'right'
    
    class PlayerTile extends Tile {
        direction: dir = 'down'
        constructor() {
            super(new Color('red'), TileType.Player)
        }
    }
    
    const tiledict: Record<string, () => string> = {
        Empty: () => '.',
        Player: function (this: PlayerTile) {
            return ['^','V','<','>'][['up', 'down', 'left', 'right'].indexOf(this.direction)]
        },
        Wall: () => '#'
    }

    // init grid
    const grid = new Board<Tile>(20, 10, () => {
        return new Tile(new Color('brightBlack', 'reset', false), TileType.Empty)
    })

    const playerPos = [10, 5]
    grid.set(playerPos[0], playerPos[1], new PlayerTile())
    grid.set(0, 1, new Tile(new Color('reset'), TileType.Wall))

    //@ts-expect-error
    if (debug == '1') {window.grid = grid;window.tiledict = tiledict}

    const [w, h] = size()

    stdout.write(`\x1B[2J\x1B[0;0H`)

    function frame() {
        stdout.write("\x1B[2J") // erase display (but not scrollback buffer)
        printf('Dungon gaem');
        const gride = grid.getAll().map<string[]>(a => a.map<string>(t => t.color.toString() + tiledict[t.type].call(t)))
        printf(gride.map<string>(r => r.join('')).join('\n'))
        stdout.write(`${new Color('reset')}HP: 100/100`)
    }

    stdin.on('data', key => {
        switch (key) {
            case 'w':
                
                break;
        
            default:
                break;
        }
    })

    frame()
}