export class GameUI {
    private gameOverScreen!: HTMLDivElement;
    private pauseScreen!: HTMLDivElement;
    private hpBar!: HTMLDivElement;
    private hpBarInner!: HTMLDivElement;
    private scoreDisplay!: HTMLDivElement;
    private score: number = 0;
    private minimap!: HTMLCanvasElement;
    private minimapContext!: CanvasRenderingContext2D;
    private readonly MINIMAP_SIZE = 250;
    private readonly MINIMAP_SCALE = 8; // 1ユニットあたりのピクセル数
    private readonly PLAYER_ARROW_SIZE = 8; // プレイヤーの矢印サイズを大きく

    constructor() {
        this.createGameOverScreen();
        this.createPauseScreen();
        this.createHPBar();
        this.createScoreDisplay();
        this.createMinimap();
        this.setupEventListeners();
    }

    private createGameOverScreen(): void {
        // ゲームオーバー画面の作成
        this.gameOverScreen = document.createElement('div');
        this.gameOverScreen.style.position = 'fixed';
        this.gameOverScreen.style.top = '50%';
        this.gameOverScreen.style.left = '50%';
        this.gameOverScreen.style.transform = 'translate(-50%, -50%)';
        this.gameOverScreen.style.textAlign = 'center';
        this.gameOverScreen.style.color = 'white';
        this.gameOverScreen.style.fontSize = '32px';
        this.gameOverScreen.style.display = 'none';
        this.gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.gameOverScreen.style.padding = '20px';
        this.gameOverScreen.style.borderRadius = '10px';
        this.gameOverScreen.style.zIndex = '100';

        const gameOverText = document.createElement('div');
        gameOverText.textContent = 'GAME OVER';
        this.gameOverScreen.appendChild(gameOverText);

        const retryText = document.createElement('div');
        retryText.textContent = 'Press SPACE to retry';
        retryText.style.fontSize = '24px';
        retryText.style.marginTop = '20px';
        this.gameOverScreen.appendChild(retryText);

        document.body.appendChild(this.gameOverScreen);
    }

    private createPauseScreen(): void {
        this.pauseScreen = document.createElement('div');
        this.pauseScreen.style.position = 'fixed';
        this.pauseScreen.style.top = '50%';
        this.pauseScreen.style.left = '50%';
        this.pauseScreen.style.transform = 'translate(-50%, -50%)';
        this.pauseScreen.style.textAlign = 'center';
        this.pauseScreen.style.color = 'white';
        this.pauseScreen.style.fontSize = '32px';
        this.pauseScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.pauseScreen.style.padding = '20px';
        this.pauseScreen.style.borderRadius = '10px';
        this.pauseScreen.style.zIndex = '100';
        this.pauseScreen.style.display = 'block'; // 初期状態は表示

        const pauseText = document.createElement('div');
        pauseText.textContent = 'PAUSED';
        this.pauseScreen.appendChild(pauseText);

        const resumeText = document.createElement('div');
        resumeText.textContent = 'Click to resume';
        resumeText.style.fontSize = '24px';
        resumeText.style.marginTop = '20px';
        this.pauseScreen.appendChild(resumeText);

        document.body.appendChild(this.pauseScreen);

        // ポーズ状態の監視
        document.addEventListener('pointerlockchange', () => {
            this.pauseScreen.style.display = document.pointerLockElement === null ? 'block' : 'none';
        });
    }

    private createHPBar(): void {
        // HPバーの外枠
        this.hpBar = document.createElement('div');
        this.hpBar.style.position = 'fixed';
        this.hpBar.style.top = '20px';
        this.hpBar.style.left = '20px';
        this.hpBar.style.width = '200px';
        this.hpBar.style.height = '20px';
        this.hpBar.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.hpBar.style.border = '2px solid white';
        this.hpBar.style.borderRadius = '5px';
        this.hpBar.style.zIndex = '100';

        // HPバーの内側（実際のHP表示部分）
        this.hpBarInner = document.createElement('div');
        this.hpBarInner.style.width = '100%';
        this.hpBarInner.style.height = '100%';
        this.hpBarInner.style.backgroundColor = '#00ff00';
        this.hpBarInner.style.transition = 'width 0.2s ease-out';
        this.hpBarInner.style.borderRadius = '3px';

        this.hpBar.appendChild(this.hpBarInner);
        document.body.appendChild(this.hpBar);
    }

    private createScoreDisplay(): void {
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.style.position = 'fixed';
        this.scoreDisplay.style.top = '20px';
        this.scoreDisplay.style.left = '50%';
        this.scoreDisplay.style.transform = 'translateX(-50%)';
        this.scoreDisplay.style.color = 'white';
        this.scoreDisplay.style.fontSize = '24px';
        this.scoreDisplay.style.textShadow = '2px 2px 2px black';
        this.scoreDisplay.style.zIndex = '100';
        this.updateScore(0);
        document.body.appendChild(this.scoreDisplay);
    }

    private createMinimap(): void {
        this.minimap = document.createElement('canvas');
        this.minimap.width = this.MINIMAP_SIZE;
        this.minimap.height = this.MINIMAP_SIZE;
        this.minimap.style.position = 'fixed';
        this.minimap.style.top = '20px';
        this.minimap.style.right = '20px';
        this.minimap.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.minimap.style.border = '2px solid white';
        this.minimap.style.borderRadius = '5px';
        this.minimap.style.zIndex = '100';
        document.body.appendChild(this.minimap);

        const context = this.minimap.getContext('2d');
        if (!context) throw new Error('Failed to get 2D context');
        this.minimapContext = context;
    }

    private setupEventListeners(): void {
        document.addEventListener('gameOver', () => this.showGameOver());
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && this.gameOverScreen.style.display === 'block') {
                this.hideGameOver();
                const event = new CustomEvent('retry');
                document.dispatchEvent(event);
            }
        });

        // HPの更新イベントをリッスン
        document.addEventListener('updateHP', ((event: CustomEvent) => {
            const { current, max } = event.detail;
            this.updateHPBar(current, max);
        }) as EventListener);

        document.addEventListener('enemyDefeated', ((event: CustomEvent) => {
            const points = event.detail?.points || 100;
            this.updateScore(points);
        }) as EventListener);
    }

    private showGameOver(): void {
        this.gameOverScreen.style.display = 'block';
    }

    private hideGameOver(): void {
        this.gameOverScreen.style.display = 'none';
    }

    private updateHPBar(currentHP: number, maxHP: number): void {
        const percentage = (currentHP / maxHP) * 100;
        this.hpBarInner.style.width = `${percentage}%`;

        // HPに応じて色を変更
        if (percentage > 60) {
            this.hpBarInner.style.backgroundColor = '#00ff00'; // 緑
        } else if (percentage > 30) {
            this.hpBarInner.style.backgroundColor = '#ffff00'; // 黄
        } else {
            this.hpBarInner.style.backgroundColor = '#ff0000'; // 赤
        }
    }

    private updateScore(points: number): void {
        this.score += points;
        this.scoreDisplay.textContent = `Score: ${this.score}`;
    }

    public updateMinimap(playerPos: { x: number, z: number }, enemies: { x: number, z: number }[], playerRotationY: number): void {
        const ctx = this.minimapContext;
        const center = this.MINIMAP_SIZE / 2;

        // ミニマップをクリア
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.MINIMAP_SIZE, this.MINIMAP_SIZE);

        // 敵の位置を描画（赤い点）
        ctx.fillStyle = 'red';
        enemies.forEach(enemy => {
            const x = center + enemy.x * this.MINIMAP_SCALE;
            const z = center + enemy.z * this.MINIMAP_SCALE;
            ctx.beginPath();
            ctx.arc(x, z, 4, 0, Math.PI * 2); // 敵の点も少し大きく
            ctx.fill();
        });

        // プレイヤーの位置を描画（白い三角形）
        ctx.save();
        ctx.translate(center + playerPos.x * this.MINIMAP_SCALE, center + playerPos.z * this.MINIMAP_SCALE);
        ctx.rotate(-playerRotationY); // プレイヤーの向きに合わせて回転
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(0, -this.PLAYER_ARROW_SIZE);
        ctx.lineTo(-this.PLAYER_ARROW_SIZE * 0.6, this.PLAYER_ARROW_SIZE * 0.6);
        ctx.lineTo(this.PLAYER_ARROW_SIZE * 0.6, this.PLAYER_ARROW_SIZE * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    public reset(): void {
        this.score = 0;
        this.updateScore(0);
        // ミニマップをクリア
        this.minimapContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.minimapContext.fillRect(0, 0, this.MINIMAP_SIZE, this.MINIMAP_SIZE);
    }
}
