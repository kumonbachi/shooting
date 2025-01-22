import { Box3, Sphere, Vector3 } from 'three';
import { Collider } from './Collider';
import { GameObject } from './GameObject';

export class BoxCollider extends Collider {
    private size: Vector3;
    private center: Vector3;

    constructor(gameObject: GameObject, size: Vector3 = new Vector3(1, 1, 1)) {
        super(gameObject);
        this.size = size;
        this.center = new Vector3();
    }

    public getBoundingBox(): Box3 {
        const worldPosition = this.gameObject.getWorldPosition(new Vector3());
        const worldScale = this.gameObject.getWorldScale(new Vector3());

        const halfSize = this.size.clone()
            .multiply(worldScale)
            .multiplyScalar(0.5);

        return new Box3()
            .setFromCenterAndSize(
                worldPosition.add(this.center),
                halfSize.multiplyScalar(2)
            );
    }

    public getBoundingSphere(): Sphere {
        const box = this.getBoundingBox();
        const sphere = new Sphere();
        box.getBoundingSphere(sphere);
        return sphere;
    }

    public setSize(size: Vector3): void {
        this.size.copy(size);
    }

    public setCenter(center: Vector3): void {
        this.center.copy(center);
    }
}
