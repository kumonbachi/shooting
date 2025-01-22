import { Scene, PerspectiveCamera, WebGLRenderer, Clock } from 'three';
import { GameObject } from './GameObject';
import { Enemy } from '../game/Enemy';

export class Game {
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private clock: Clock;
    private rootObject: GameObject;
    private gameObjects: GameObject[] = [];
    private activeCamera: GameObject | null = null;
    private isPaused: boolean = true; // 初期状態はポーズ

    constructor(canvas: HTMLCanvasElement) {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.renderer = new WebGLRenderer({ canvas, antialias: true });
        this.clock = new Clock();
        this.rootObject = new GameObject();
        this.scene.add(this.rootObject);

        // レンダラーの初期設定
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // カメラの初期位置
        this.camera.position.z = 5;

        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => this.onWindowResize());

        // ポーズ状態の監視
        document.addEventListener('pointerlockchange', () => {
            this.isPaused = document.pointerLockElement === null;
            if (!this.isPaused) {
                this.clock.start(); // ポーズ解除時にクロックを再開
            }
        });
    }

    /**
     * ゲームオブジェクトを追加
     */
    public addGameObject(gameObject: GameObject): void {
        this.rootObject.add(gameObject);
        this.gameObjects.push(gameObject);
    }

    /**
     * アクティブカメラを設定
     */
    public setCamera(cameraObject: GameObject): void {
        this.activeCamera = cameraObject;
    }

    /**
     * ゲームループを開始
     */
    public start(): void {
        this.animate();
    }

    private animate(): void {
        requestAnimationFrame(() => this.animate());

        // ポーズ中は更新をスキップ
        if (this.isPaused) {
            this.clock.stop(); // クロックを停止
            this.renderer.render(this.scene, this.camera);
            return;
        }

        const deltaTime = this.clock.getDelta();

        // 全オブジェクトの更新（物理演算と衝突判定を含む）
        this.rootObject.internalUpdate(deltaTime);

        // カメラの更新
        if (this.activeCamera) {
            this.camera.position.copy(this.activeCamera.getWorldPosition(this.camera.position));
            this.camera.quaternion.copy(this.activeCamera.getWorldQuaternion(this.camera.quaternion));
        }

        this.renderer.render(this.scene, this.camera);
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public getRenderer(): WebGLRenderer {
        return this.renderer;
    }

    public reset(): void {
        // 既存の敵を全て削除
        this.rootObject.children.forEach(child => {
            if (child instanceof Enemy) {
                this.rootObject.remove(child);
            }
        });
    }
}
