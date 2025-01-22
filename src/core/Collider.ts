import { Box3, Sphere, Vector3 } from 'three';
import { GameObject } from './GameObject';

export enum CollisionLayer {
    Default = 1,
    Player = 2,
    Enemy = 4,
    Bullet = 8,
    Wall = 16,
    Item = 32
}

export interface CollisionInfo {
    gameObject: GameObject;
    point: Vector3;
    normal: Vector3;
}

export abstract class Collider {
    protected gameObject: GameObject;
    protected layer: CollisionLayer;
    protected collisionMask: number;
    public isTrigger: boolean;

    constructor(gameObject: GameObject) {
        this.gameObject = gameObject;
        this.layer = CollisionLayer.Default;
        this.collisionMask = ~0; // デフォルトでは全レイヤーと衝突
        this.isTrigger = false;
    }

    public abstract getBoundingBox(): Box3;
    public abstract getBoundingSphere(): Sphere;

    public setLayer(layer: CollisionLayer): void {
        this.layer = layer;
    }

    public setCollisionMask(mask: number): void {
        this.collisionMask = mask;
    }

    public setTrigger(isTrigger: boolean): void {
        this.isTrigger = isTrigger;
    }

    public canCollideWith(other: Collider): boolean {
        return (this.collisionMask & other.layer) !== 0;
    }

    public checkCollision(other: Collider): CollisionInfo | null {
        if (!this.canCollideWith(other)) {
            return null;
        }

        // 境界球による高速な衝突判定
        const sphere1 = this.getBoundingSphere();
        const sphere2 = other.getBoundingSphere();
        if (!sphere1.intersectsSphere(sphere2)) {
            return null;
        }

        // 詳細な衝突判定（境界ボックス）
        const box1 = this.getBoundingBox();
        const box2 = other.getBoundingBox();
        if (!box1.intersectsBox(box2)) {
            return null;
        }

        // 衝突点と法線の計算
        const point = new Vector3();
        box1.getCenter(point);
        const normal = new Vector3()
            .subVectors(box2.getCenter(new Vector3()), point)
            .normalize();

        return {
            gameObject: other.gameObject,
            point: point,
            normal: normal
        };
    }
}
