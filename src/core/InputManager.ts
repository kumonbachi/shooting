export class InputManager {
    private static instance: InputManager;
    private keys: { [key: string]: boolean } = {};
    private mouseMovement: { x: number, y: number } = { x: 0, y: 0 };
    private isPointerLocked: boolean = false;
    private isMouseDown: boolean = false;

    private constructor() {
        this.setupEventListeners();
    }

    public static getInstance(): InputManager {
        if (!InputManager.instance) {
            InputManager.instance = new InputManager();
        }
        return InputManager.instance;
    }

    private setupEventListeners(): void {
        // キーボード入力
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });

        // マウス移動
        document.addEventListener('mousemove', (event) => {
            if (this.isPointerLocked) {
                this.mouseMovement.x = event.movementX;
                this.mouseMovement.y = event.movementY;
            }
        });

        // マウスボタン
        document.addEventListener('mousedown', () => {
            this.isMouseDown = true;
        });

        document.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        // ポインターロック関連
        document.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                document.body.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement !== null;
            if (!this.isPointerLocked) {
                this.isMouseDown = false;  // ポインターロックが解除されたらマウスボタンの状態をリセット
            }
        });
    }

    public isKeyPressed(keyCode: string): boolean {
        return !!this.keys[keyCode];
    }

    public getMouseMovement(): { x: number, y: number } {
        const movement = { ...this.mouseMovement };
        // 値を取得したらリセット
        this.mouseMovement = { x: 0, y: 0 };
        return movement;
    }

    public isMouseLocked(): boolean {
        return this.isPointerLocked;
    }

    public isMouseButtonPressed(): boolean {
        return this.isMouseDown;
    }
}
