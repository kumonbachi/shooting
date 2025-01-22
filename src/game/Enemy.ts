import { GameObject } from '../core/GameObject';
import { Vector3, BoxGeometry, MeshStandardMaterial, MeshBasicMaterial, Mesh, PlaneGeometry, DoubleSide } from 'three';
import { BoxCollider } from '../core/BoxCollider';
import { CollisionLayer } from '../core/Collider';
import { Fireball } from './Fireball';
import { Bullet } from './Bullet';

export class Enemy extends GameObject {
    private fireRate: number = 1.0; // 1秒に1回発射
    private fireTimer: number = 0;
    private readonly DETECTION_RANGE: number = 20; // プレイヤーを検知する範囲
    private target: GameObject | null = null;
    private maxHp: number = 3;
    private hp: number = this.maxHp;
    private hpBarMesh: Mesh;
    private readonly HP_BAR_WIDTH: number = 1.0;
    private readonly HP_BAR_HEIGHT: number = 0.1;

    constructor() {
        super();

        // 敵の見た目を作成（赤い箱）
        const geometry = new BoxGeometry(1, 2, 1);
        const material = new MeshStandardMaterial({
            color: 0xff0000,
            roughness: 0.7,
            metalness: 0.0,
            emissive: 0x330000 // 暗闇でも少し赤く光る
        });
        const mesh = new Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.add(mesh);

        // HPバーを作成
        const hpBarGeometry = new PlaneGeometry(this.HP_BAR_WIDTH, this.HP_BAR_HEIGHT);
        const hpBarMaterial = new MeshBasicMaterial({
            color: 0x00ff00,
            side: DoubleSide // 両面表示
        });
        this.hpBarMesh = new Mesh(hpBarGeometry, hpBarMaterial);
        this.hpBarMesh.position.y = 1.5; // 敵の頭上に配置
        this.add(this.hpBarMesh);

        // コライダーの追加
        const collider = new BoxCollider(this, new Vector3(1, 2, 1));
        collider.setLayer(CollisionLayer.Enemy);
        // プレイヤーと弾との衝突を検知
        collider.setCollisionMask(CollisionLayer.Player | CollisionLayer.Bullet);
        this.addCollider(collider);
    }

    public setTarget(target: GameObject): void {
        this.target = target;
    }

    protected update(deltaTime: number): void {
        if (!this.target) return;

        // ターゲットの方向を向く
        const targetPosition = this.target.position.clone();
        const direction = targetPosition.sub(this.position);

        // Y軸回転のみを適用（上下の回転は行わない）
        const angle = Math.atan2(direction.x, direction.z);
        this.rotation.y = angle;

        // HPバーを常にカメラの方向に向ける（完全なビルボード処理）
        this.hpBarMesh.quaternion.copy(this.parent?.quaternion || this.quaternion);
        this.hpBarMesh.rotation.set(0, 0, 0);

        // HPバーのスケールを更新
        const hpRatio = this.hp / this.maxHp;
        this.hpBarMesh.scale.x = hpRatio;
        this.hpBarMesh.position.x = -(this.HP_BAR_WIDTH * (1 - hpRatio)) / 2; // 左端を基準に縮小

        // プレイヤーが検知範囲内にいる場合のみ発射
        if (direction.length() <= this.DETECTION_RANGE) {
            this.fireTimer += deltaTime;
            if (this.fireTimer >= this.fireRate) {
                this.fire();
                this.fireTimer = 0;
            }
        }
    }

    private fire(): void {
        if (!this.target) return;

        // 発射方向を計算（プレイヤーの方向）
        const targetPosition = this.target.position.clone();
        const direction = targetPosition.sub(this.position).normalize();

        // 火球を生成
        const fireball = new Fireball(direction);
        fireball.position.copy(this.position);
        // 少し前方にオフセット
        const spawnOffset = direction.clone().multiplyScalar(1.5);
        fireball.position.add(spawnOffset);
        this.parent?.add(fireball);
    }

    protected onCollision(collision: any): void {
        // プレイヤーの弾に当たったらダメージを受ける
        if (collision.gameObject instanceof Bullet) {
            this.hp--;
            // HPが0になったら消滅
            if (this.hp <= 0) {
                this.die();
            }
        }
    }

    private die(): void {
        // スコアイベントを発火
        const event = new CustomEvent('enemyDefeated', {
            detail: { points: 100 }
        });
        document.dispatchEvent(event);

        // 敵を削除
        this.parent?.remove(this);
    }
}
