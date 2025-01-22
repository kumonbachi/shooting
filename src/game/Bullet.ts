import { GameObject } from '../core/GameObject';
import { Vector3, BoxGeometry, MeshBasicMaterial, Mesh } from 'three';
import { BoxCollider } from '../core/BoxCollider';
import { CollisionLayer } from '../core/Collider';

export class Bullet extends GameObject {
    private speed: number = 20;
    private direction: Vector3;
    private lifetime: number = 2; // 弾の生存時間（秒）
    private elapsedTime: number = 0;

    constructor(direction: Vector3) {
        super();
        this.direction = direction.normalize();

        // 弾の見た目を作成
        const geometry = new BoxGeometry(0.2, 0.2, 0.2);
        const material = new MeshBasicMaterial({ color: 0xffff00 });
        const mesh = new Mesh(geometry, material);
        this.add(mesh);

        // コライダーを追加
        const collider = new BoxCollider(this, new Vector3(0.2, 0.2, 0.2));
        collider.setLayer(CollisionLayer.Bullet);
        // 全ての物体と衝突するように設定
        collider.setCollisionMask(CollisionLayer.Wall | CollisionLayer.Enemy);
        this.addCollider(collider);
    }

    protected update(deltaTime: number): void {
        // 弾を移動
        const movement = this.direction.clone().multiplyScalar(this.speed * deltaTime);
        const newPosition = this.position.clone().add(movement);
        this.position.copy(this.tryMove(this.position, newPosition));

        // 生存時間を更新
        this.elapsedTime += deltaTime;
        if (this.elapsedTime >= this.lifetime) {
            this.parent?.remove(this);
        }
    }

    protected onCollision(collision: any): void {
        // 何かに衝突したら消滅
        if (this.parent) {
            this.removeFromParent();
            this.traverse((object) => {
                if (object instanceof Mesh) {
                    object.geometry.dispose();
                    object.material.dispose();
                }
            });
        }
    }
}
