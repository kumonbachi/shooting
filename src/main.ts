import { Game } from './core/Game';
import { GameObject } from './core/GameObject';
import { BoxCollider } from './core/BoxCollider';
import { BoxGeometry, MeshStandardMaterial, Mesh, Vector3, PlaneGeometry, MeshBasicMaterial, DoubleSide, CanvasTexture } from 'three';
import { CollisionLayer } from './core/Collider';
import { Player } from './game/Player';
import { EnemySpawner } from './game/EnemySpawner';
import { GameUI } from './game/GameUI';

// キャンバスの作成
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

// ゲームの初期化
const game = new Game(canvas);

// レンダラーの設定
game.getRenderer().shadowMap.enabled = true;

// UIの初期化
const ui = new GameUI();

// ミニマップの更新
function updateMinimap() {
    const playerPos = {
        x: player.position.x,
        z: player.position.z
    };
    const enemyPositions = spawner.getActiveEnemyPositions();
    ui.updateMinimap(playerPos, enemyPositions, player.rotation.y);
    requestAnimationFrame(updateMinimap);
}

// 壁のクラス
class Wall extends GameObject {
    constructor(position: Vector3, size: Vector3, color: number = 0x808080) {
        super();
        // メッシュの作成
        const geometry = new BoxGeometry(size.x, size.y, size.z);
        const material = new MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.0
        });
        const mesh = new Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.add(mesh);

        // コライダーの追加
        const collider = new BoxCollider(this, size);
        collider.setLayer(CollisionLayer.Wall);
        this.addCollider(collider);

        // 位置の設定
        this.position.copy(position);
    }
}

// 部屋の作成
const roomSize = 30;
const wallThickness = 1;
const wallHeight = 6;  // 天井の高さを6に調整

// 色の定義
const FLOOR_COLOR = 0x202020;  // 暗めのグレー
const WALL_COLOR = 0x404040;   // 薄めのグレー
const OBSTACLE_COLOR = 0x303030; // 障害物の色
const TUTORIAL_COLOR = 0x505050; // チュートリアルボードの色

// 障害物のクラス
class Obstacle extends GameObject {
    constructor(position: Vector3, size: Vector3) {
        super();
        // メッシュの作成
        const geometry = new BoxGeometry(size.x, size.y, size.z);
        const material = new MeshStandardMaterial({
            color: OBSTACLE_COLOR,
            roughness: 0.7,
            metalness: 0.0
        });
        const mesh = new Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.add(mesh);

        // コライダーの追加
        const collider = new BoxCollider(this, size);
        collider.setLayer(CollisionLayer.Wall);
        this.addCollider(collider);

        // 位置の設定
        this.position.copy(position);
    }
}

// 床
const floor = new Wall(
    new Vector3(0, 0, 0),
    new Vector3(roomSize, wallThickness, roomSize),
    FLOOR_COLOR
);
game.addGameObject(floor);

// 天井
const ceiling = new Wall(
    new Vector3(0, wallHeight, 0),
    new Vector3(roomSize, wallThickness, roomSize),
    FLOOR_COLOR
);
game.addGameObject(ceiling);

// 左の壁
const leftWall = new Wall(
    new Vector3(-roomSize/2, wallHeight/2, 0),
    new Vector3(wallThickness, wallHeight, roomSize),
    WALL_COLOR
);
game.addGameObject(leftWall);

// 右の壁
const rightWall = new Wall(
    new Vector3(roomSize/2, wallHeight/2, 0),
    new Vector3(wallThickness, wallHeight, roomSize),
    WALL_COLOR
);
game.addGameObject(rightWall);

// 奥の壁
const backWall = new Wall(
    new Vector3(0, wallHeight/2, -roomSize/2),
    new Vector3(roomSize, wallHeight, wallThickness),
    WALL_COLOR
);
game.addGameObject(backWall);

// 手前の壁
const frontWall = new Wall(
    new Vector3(0, wallHeight/2, roomSize/2),
    new Vector3(roomSize, wallHeight, wallThickness),
    WALL_COLOR
);
game.addGameObject(frontWall);

// 障害物の配置
// 柱の配置（四隅）
const pillarSize = new Vector3(2, 4, 2);
const pillarOffset = roomSize * 0.3; // 部屋の30%の位置に配置

const pillar1 = new Obstacle(
    new Vector3(-pillarOffset, pillarSize.y/2, -pillarOffset),
    pillarSize
);
game.addGameObject(pillar1);

const pillar2 = new Obstacle(
    new Vector3(pillarOffset, pillarSize.y/2, -pillarOffset),
    pillarSize
);
game.addGameObject(pillar2);

const pillar3 = new Obstacle(
    new Vector3(-pillarOffset, pillarSize.y/2, pillarOffset),
    pillarSize
);
game.addGameObject(pillar3);

const pillar4 = new Obstacle(
    new Vector3(pillarOffset, pillarSize.y/2, pillarOffset),
    pillarSize
);
game.addGameObject(pillar4);

// 中央付近のブロック
const blockSize = new Vector3(3, 2, 3);
const blockOffset = roomSize * 0.2; // 部屋の20%の位置に配置（15%から20%に変更）

const block1 = new Obstacle(
    new Vector3(-blockOffset, blockSize.y/2, 0),
    blockSize
);
game.addGameObject(block1);

const block2 = new Obstacle(
    new Vector3(blockOffset, blockSize.y/2, 0),
    blockSize
);
game.addGameObject(block2);

const block3 = new Obstacle(
    new Vector3(0, blockSize.y/2, -blockOffset),
    blockSize
);
game.addGameObject(block3);

const block4 = new Obstacle(
    new Vector3(0, blockSize.y/2, blockOffset),
    blockSize
);
game.addGameObject(block4);

// プレイヤーの作成と追加
const player = new Player();
game.addGameObject(player);
game.setCamera(player.getCamera());

// 敵スポナーの追加
const spawner = new EnemySpawner(player, roomSize);
game.addGameObject(spawner);

// チュートリアルボードのクラス
class TutorialBoard extends GameObject {
    constructor() {
        super();
        // メッシュの作成
        const geometry = new BoxGeometry(8, 4, 0.2);
        const material = new MeshStandardMaterial({
            color: TUTORIAL_COLOR,
            roughness: 0.7,
            metalness: 0.0
        });
        const mesh = new Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.add(mesh);

        // テキストの作成（プレーンな白いテクスチャとして）
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Controls:', 256, 50);
            ctx.font = '24px Arial';
            ctx.fillText('WASD - Move', 256, 100);
            ctx.fillText('Mouse - Look around', 256, 140);
            ctx.fillText('Click - Shoot', 256, 180);
            ctx.fillText('ESC - Pause', 256, 220);

            const texture = new CanvasTexture(canvas);
            const textPlane = new Mesh(
                new PlaneGeometry(7.5, 3.5),
                new MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    side: DoubleSide
                })
            );
            textPlane.position.z = 0.11; // ボードの前面にテキストを配置
            this.add(textPlane);
        }
    }
}

// チュートリアルボードの配置
const tutorialBoard = new TutorialBoard();
tutorialBoard.position.set(0, 3, -roomSize/2 + 1); // 奥の壁の前に配置
game.addGameObject(tutorialBoard);

// リトライ処理
document.addEventListener('retry', () => {
    // プレイヤーをリセット
    player.reset();

    // ゲームをリセット
    game.reset();

    // スポナーをリセット
    spawner.reset();

    // UIをリセット
    ui.reset();
});

// ゲーム開始
game.start();
updateMinimap(); // ミニマップの更新を開始
