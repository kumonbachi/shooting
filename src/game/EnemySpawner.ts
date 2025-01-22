import { GameObject } from '../core/GameObject';
import { Enemy } from './Enemy';

export class EnemySpawner extends GameObject {
    private readonly MAX_ENEMIES: number = 5;
    private readonly SPAWN_INTERVAL: number = 3.0; // 3秒ごとにスポーン
    private spawnTimer: number = 0;
    private target: GameObject;
    private activeEnemies: Enemy[] = [];
    private roomSize: number;

    constructor(target: GameObject, roomSize: number) {
        super();
        this.target = target;
        this.roomSize = roomSize;
    }

    protected update(deltaTime: number): void {
        // 死亡した敵を配列から削除
        this.activeEnemies = this.activeEnemies.filter(enemy => enemy.parent !== null);

        // 敵の数が最大数未満の場合、タイマーを更新
        if (this.activeEnemies.length < this.MAX_ENEMIES) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.SPAWN_INTERVAL) {
                this.spawnEnemy();
                this.spawnTimer = 0;
            }
        }
    }

    private spawnEnemy(): void {
        // ランダムな位置を生成（部屋の端の方に）
        const angle = Math.random() * Math.PI * 2;
        const radius = this.roomSize * 0.4; // 部屋の大きさの40%の位置に
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        const enemy = new Enemy();
        enemy.position.set(x, 1, z);
        enemy.setTarget(this.target);

        this.parent?.add(enemy);
        this.activeEnemies.push(enemy);
    }

    public reset(): void {
        this.spawnTimer = 0;
        this.activeEnemies = [];
    }

    public getActiveEnemyPositions(): { x: number, z: number }[] {
        return this.activeEnemies.map(enemy => ({
            x: enemy.position.x,
            z: enemy.position.z
        }));
    }
}
