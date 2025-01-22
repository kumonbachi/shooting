import { GameObject } from '../core/GameObject';
import { Vector3, SphereGeometry, MeshStandardMaterial, Mesh } from 'three';
import { BoxCollider } from '../core/BoxCollider';
import { CollisionLayer } from '../core/Collider';

export class Fireball extends GameObject {
    private speed: number = 15;
    private direction: Vector3;
    private lifetime: number = 3; // 生存時間（秒）
    private elapsedTime: number = 0;

    constructor(direction: Vector3) {
        super();
        this.direction = direction.normalize();

        // 火球の見た目を作成（オレンジ色の球）
        const geometry = new SphereGeometry(0.3, 8, 8);
        const material = new MeshStandardMaterial({
            color: 0xff6600,
            emissive: 0xff3300,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.0
        });
        const mesh = new Mesh(geometry, material);
        mesh.castShadow = true;
        this.add(mesh);

        // コライダーを追加
        const collider = new BoxCollider(this, new Vector3(0.6, 0.6, 0.6));
        collider.setLayer(CollisionLayer.Enemy); // 敵の攻撃として扱う
        // 全ての物体と衝突するように設定
        collider.setCollisionMask(CollisionLayer.Player | CollisionLayer.Wall | CollisionLayer.Bullet);
        this.addCollider(collider);
    }

    protected update(deltaTime: number): void {
        // 火球を移動
        const movement = this.direction.clone().multiplyScalar(this.speed * deltaTime);
        const newPosition = this.position.clone().add(movement);
        this.position.copy(this.tryMove(this.position, newPosition));

        // 生存時間を更新
        this.elapsedTime += deltaTime;
        if (this.elapsedTime >= this.lifetime) {
            this.parent?.remove(this);
        }
    }

    protected onCollision(_collision: any): void {
        // 何かに衝突したら消滅
        if (this.parent) {
            this.parent.remove(this);
        }
    }
}
