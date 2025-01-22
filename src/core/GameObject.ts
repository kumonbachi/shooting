import { Object3D, Vector3, Quaternion } from 'three';
import { Collider, CollisionInfo } from './Collider';

export class GameObject extends Object3D {
    private isStarted: boolean = false;
    private isEnabled: boolean = true;
    private colliders: Collider[] = [];

    constructor() {
        super();
    }

    /**
     * 初期化時に一度だけ呼ばれるメソッド
     */
    protected start(): void {}

    /**
     * 毎フレーム呼ばれるメソッド
     * @param deltaTime 前フレームからの経過時間（秒）
     */
    protected update(deltaTime: number): void {}

    /**
     * 衝突が発生した時に呼ばれるメソッド
     * @param collision 衝突情報
     */
    protected onCollision(collision: CollisionInfo): void {}

    /**
     * トリガーに入った時に呼ばれるメソッド
     * @param collision 衝突情報
     */
    protected onTriggerEnter(collision: CollisionInfo): void {}

    /**
     * トリガーから出た時に呼ばれるメソッド
     * @param collision 衝突情報
     */
    protected onTriggerExit(collision: CollisionInfo): void {}

    /**
     * 内部的に使用される更新メソッド
     */
    public internalUpdate(deltaTime: number): void {
        if (!this.isEnabled) return;

        if (!this.isStarted) {
            this.start();
            this.isStarted = true;
        }

        this.update(deltaTime);

        // 子オブジェクトの更新
        this.children.forEach((child) => {
            if (child instanceof GameObject) {
                child.internalUpdate(deltaTime);
            }
        });
    }

    /**
     * オブジェクトが有効かどうかを設定
     */
    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        this.visible = enabled;
    }

    /**
     * オブジェクトが有効かどうかを取得
     */
    public getEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * コライダーを追加
     */
    public addCollider(collider: Collider): void {
        this.colliders.push(collider);
    }

    /**
     * コライダーを取得
     */
    public getColliders(): Collider[] {
        return this.colliders;
    }

    /**
     * ローカル位置を設定
     */
    public setLocalPosition(x: number, y: number, z: number): void {
        this.position.set(x, y, z);
    }

    /**
     * ローカル回転を設定（オイラー角）
     */
    public setLocalRotation(x: number, y: number, z: number): void {
        this.rotation.set(x, y, z);
    }

    /**
     * ローカルスケールを設定
     */
    public setLocalScale(x: number, y: number, z: number): void {
        this.scale.set(x, y, z);
    }

    /**
     * 移動処理（衝突判定付き）
     */
    protected tryMove(from: Vector3, to: Vector3): Vector3 {
        const movement = to.clone().sub(from);
        const distance = movement.length();

        if (distance === 0) return from;

        const direction = movement.normalize();
        let currentPosition = from.clone();
        let remainingDistance = distance;
        const maxStep = 0.1; // フレームレート非依存の固定ステップサイズ

        while (remainingDistance > 0) {
            const stepSize = Math.min(maxStep, remainingDistance);
            const nextPosition = currentPosition.clone().add(
                direction.clone().multiplyScalar(stepSize)
            );

            // 現在位置を一時的に保存
            const originalPosition = this.position.clone();
            this.position.copy(nextPosition);

            let hasCollision = false;

            // 衝突判定
            for (const collider of this.colliders) {
                for (const other of this.parent?.children || []) {
                    if (other instanceof GameObject && other !== this) {
                        for (const otherCollider of other.getColliders()) {
                            const collision = collider.checkCollision(otherCollider);
                            if (collision) {
                                hasCollision = true;
                                const normal = collision.normal;

                                // 衝突イベントを発火
                                this.onCollision(collision);
                                other.onCollision({
                                    gameObject: this,
                                    point: collision.point,
                                    normal: normal.clone().multiplyScalar(-1)
                                });

                                // 衝突面に沿って滑らせる
                                const dot = direction.dot(normal);
                                if (dot < 0) {
                                    const slide = direction.clone()
                                        .sub(normal.multiplyScalar(dot))
                                        .normalize()
                                        .multiplyScalar(stepSize);
                                    nextPosition.copy(currentPosition).add(slide);
                                }
                            }
                        }
                    }
                }
            }

            // 元の位置に戻す
            this.position.copy(originalPosition);

            if (!hasCollision) {
                currentPosition.copy(nextPosition);
            }

            remainingDistance -= stepSize;
        }

        return currentPosition;
    }
}
