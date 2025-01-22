import { GameObject } from '../core/GameObject';
import { BoxCollider } from '../core/BoxCollider';
import { CollisionLayer, CollisionInfo } from '../core/Collider';
import { InputManager } from '../core/InputManager';
import { Vector3, Euler, PlaneGeometry, MeshBasicMaterial, Mesh, DoubleSide, SpotLight, AmbientLight } from 'three';
import { Bullet } from './Bullet';
import { Fireball } from './Fireball';

export class Player extends GameObject {
    private moveSpeed: number = 10.0;
    private mouseSensitivity: number = 0.002;
    private euler: Euler;
    private inputManager: InputManager;
    private readonly EYE_HEIGHT: number = 1.7;  // プレイヤーの目線の高さ
    private isFireReady: boolean = true;  // 発射可能かどうか
    private readonly FIRE_COOLDOWN: number = 0.1;  // 発射クールダウン（秒）
    private fireCooldownTimer: number = 0;  // クールダウンタイマー
    private flashlight: SpotLight;
    private ambientLight: AmbientLight;

    private maxHp: number = 5;
    private hp: number = this.maxHp;
    private hpBarMesh: Mesh;
    private readonly HP_BAR_WIDTH: number = 2.0;
    private readonly HP_BAR_HEIGHT: number = 0.2;
    private isDead: boolean = false;

    constructor() {
        super();
        this.euler = new Euler(0, 0, 0, 'YXZ');
        this.inputManager = InputManager.getInstance();

        // コライダーの設定
        const collider = new BoxCollider(this, new Vector3(1, 2, 1));
        collider.setLayer(CollisionLayer.Player);
        this.addCollider(collider);

        // HPバーを作成
        const hpBarGeometry = new PlaneGeometry(this.HP_BAR_WIDTH, this.HP_BAR_HEIGHT);
        const hpBarMaterial = new MeshBasicMaterial({
            color: 0x00ff00,
            side: DoubleSide
        });
        this.hpBarMesh = new Mesh(hpBarGeometry, hpBarMaterial);
        this.hpBarMesh.position.y = 2.5; // プレイヤーの頭上に配置
        this.add(this.hpBarMesh);

        // 懐中電灯を作成
        this.flashlight = new SpotLight(0xffffff, 5.0); // 明るさを5倍に
        this.flashlight.position.set(0, this.EYE_HEIGHT, 0);
        this.flashlight.angle = Math.PI / 6; // 30度
        this.flashlight.penumbra = 0.2; // ソフトな影のエッジ
        this.flashlight.distance = 30; // 光の届く距離
        this.flashlight.decay = 1.0; // 減衰をさらに緩和
        this.flashlight.castShadow = true;
        this.flashlight.shadow.mapSize.width = 1024;
        this.flashlight.shadow.mapSize.height = 1024;
        this.flashlight.shadow.camera.near = 0.5;
        this.flashlight.shadow.camera.far = 30;
        this.add(this.flashlight);

        // 薄暗い環境光を追加
        this.ambientLight = new AmbientLight(0x202020, 0.05); // 環境光をさらに暗く
        this.add(this.ambientLight);

        // 初期位置の設定（目線の高さを考慮）
        this.position.set(0, this.EYE_HEIGHT, 0);
    }

    protected update(deltaTime: number): void {
        if (this.isDead) return;

        this.updateRotation();
        this.updateMovement(deltaTime);
        this.updateFiring(deltaTime);

        // HPバーを常にカメラの方向に向ける
        this.hpBarMesh.quaternion.copy(this.parent?.quaternion || this.quaternion);
        this.hpBarMesh.rotation.set(0, 0, 0);

        // HPバーのスケールを更新
        const hpRatio = this.hp / this.maxHp;
        this.hpBarMesh.scale.x = hpRatio;
        this.hpBarMesh.position.x = -(this.HP_BAR_WIDTH * (1 - hpRatio)) / 2;

        // 懐中電灯の向きをプレイヤーの向きに合わせる
        const forward = new Vector3(0, 0, -1);
        forward.applyQuaternion(this.quaternion);
        this.flashlight.target.position.copy(this.position).add(forward.multiplyScalar(10));
        this.flashlight.target.updateMatrixWorld();
    }

    private updateHP(newHP: number): void {
        this.hp = newHP;
        // HPの更新イベントを発火
        const event = new CustomEvent('updateHP', {
            detail: {
                current: this.hp,
                max: this.maxHp
            }
        });
        document.dispatchEvent(event);

        if (this.hp <= 0) {
            this.die();
        }
    }

    protected onCollision(collision: CollisionInfo): void {
        if (this.isDead) return;

        // 火球に当たったらダメージを受ける
        if (collision.gameObject instanceof Fireball) {
            this.updateHP(this.hp - 1);
        }
    }

    private die(): void {
        this.isDead = true;
        // ゲームオーバーイベントを発火
        const event = new CustomEvent('gameOver');
        document.dispatchEvent(event);
    }

    public reset(): void {
        this.isDead = false;
        this.updateHP(this.maxHp);
        this.position.set(0, this.EYE_HEIGHT, 0);
        this.euler.set(0, 0, 0);
        this.quaternion.setFromEuler(this.euler);
    }

    private updateRotation(): void {
        if (!this.inputManager.isMouseLocked()) return;

        const mouseMovement = this.inputManager.getMouseMovement();
        this.euler.y -= mouseMovement.x * this.mouseSensitivity;
        this.euler.x -= mouseMovement.y * this.mouseSensitivity;
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
        this.quaternion.setFromEuler(this.euler);
    }

    private updateMovement(deltaTime: number): void {
        if (!this.inputManager.isMouseLocked()) return;

        const moveDirection = this.calculateMoveDirection();
        if (moveDirection.lengthSq() === 0) return;

        const movement = moveDirection.multiplyScalar(this.moveSpeed * deltaTime);
        const targetPosition = this.position.clone().add(movement);

        // 衝突判定付きの移動
        const newPosition = this.tryMove(this.position, targetPosition);
        this.position.copy(newPosition);
    }

    private updateFiring(deltaTime: number): void {
        if (!this.inputManager.isMouseLocked()) return;

        // クールダウンの更新
        if (!this.isFireReady) {
            this.fireCooldownTimer += deltaTime;
            if (this.fireCooldownTimer >= this.FIRE_COOLDOWN) {
                this.isFireReady = true;
                this.fireCooldownTimer = 0;
            }
        }

        // 発射処理
        if (this.isFireReady && this.inputManager.isMouseButtonPressed()) {
            this.fire();
            this.isFireReady = false;
        }
    }

    private fire(): void {
        const bulletDirection = new Vector3(0, 0, -1);
        bulletDirection.applyQuaternion(this.quaternion);

        const bullet = new Bullet(bulletDirection);
        const spawnOffset = bulletDirection.clone().multiplyScalar(1.5);
        bullet.position.copy(this.position).add(spawnOffset);
        this.parent?.add(bullet);
    }

    private calculateMoveDirection(): Vector3 {
        const moveDirection = new Vector3();

        if (this.inputManager.isKeyPressed('KeyW')) moveDirection.z -= 1;
        if (this.inputManager.isKeyPressed('KeyS')) moveDirection.z += 1;
        if (this.inputManager.isKeyPressed('KeyA')) moveDirection.x -= 1;
        if (this.inputManager.isKeyPressed('KeyD')) moveDirection.x += 1;

        if (moveDirection.lengthSq() > 0) {
            moveDirection.normalize();
            moveDirection.applyEuler(new Euler(0, this.euler.y, 0));
        }

        return moveDirection;
    }

    public getCamera(): GameObject {
        return this;
    }
}
