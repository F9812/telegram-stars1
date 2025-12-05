class GameClient {
    constructor() {
        this.socket = null;
        this.player = null;
        this.gameState = {
            energy: 0,
            quantumPoints: 0,
            generators: [],
            rebirthCount: 0,
            sessionTime: 0,
            clickMultiplier: 1
        };
        
        this.ui = new UIManager();
        this.crystalManager = new CrystalManager(this);
        this.generatorManager = new GeneratorManager(this);
        this.rebirthManager = new RebirthManager(this);
        this.socketManager = new SocketManager(this);
        
        this.init();
    }
    
    async init() {
        // Загрузка сохраненного состояния
        this.loadGameState();
        
        // Подключение к серверу
        await this.socketManager.connect();
        
        // Инициализация UI
        this.ui.init(this);
        
        // Начало игрового цикла
        this.startGameLoop();
        
        console.log('Игра инициализирована');
    }
    
    loadGameState() {
        const saved = localStorage.getItem('energosphere_game_state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.gameState = { ...this.gameState, ...state };
            } catch (e) {
                console.warn('Ошибка загрузки состояния:', e);
            }
        }
    }
    
    saveGameState() {
        localStorage.setItem('energosphere_game_state', JSON.stringify({
            energy: this.gameState.energy,
            quantumPoints: this.gameState.quantumPoints,
            generators: this.gameState.generators,
            rebirthCount: this.gameState.rebirthCount
        }));
    }
    
    startGameLoop() {
        // Основной игровой цикл
        setInterval(() => {
            this.updateGenerators();
            this.updateUI();
            this.saveGameState();
        }, 1000); // Обновление каждую секунду
        
        // Обновление анимаций
        requestAnimationFrame(() => this.updateAnimations());
    }
    
    updateGenerators() {
        if (!this.gameState.generators) return;
        
        let totalProduction = 0;
        this.gameState.generators.forEach(generator => {
            if (generator.lastCollection && generator.productionPerSecond) {
                const now = Date.now();
                const elapsed = (now - generator.lastCollection) / 1000;
                const produced = generator.productionPerSecond * elapsed;
                
                this.gameState.energy += produced;
                totalProduction += produced;
                
                generator.lastCollection = now;
            }
        });
        
        if (totalProduction > 0) {
            this.ui.showFloatingText(`+${Math.floor(totalProduction)}`, '#00ffaa');
        }
    }
    
    updateUI() {
        this.ui.updateEnergy(this.gameState.energy);
        this.ui.updateQuantumPoints(this.gameState.quantumPoints);
        this.ui.updateSessionTime(this.gameState.sessionTime);
        
        // Обновление генераторов в UI
        if (this.generatorManager) {
            this.generatorManager.updateUI();
        }
        
        // Проверка возможности перерождения
        if (this.rebirthManager) {
            this.rebirthManager.checkRebirthAvailability();
        }
    }
    
    updateAnimations() {
        // Анимации частиц, эффектов и т.д.
        requestAnimationFrame(() => this.updateAnimations());
    }
    
    // Обработка клика по кристаллу
    handleCrystalClick(event) {
        if (!this.socketManager.isConnected()) {
            this.ui.showNotification('Нет соединения с сервером', 'error');
            return;
        }
        
        const clickEnergy = 1 * this.gameState.clickMultiplier;
        this.socketManager.sendClick(clickEnergy);
        
        // Визуальный эффект
        this.crystalManager.createClickEffect(event);
        
        // Обновление локального состояния (будет перезаписано сервером)
        this.gameState.energy += clickEnergy;
        this.ui.updateEnergy(this.gameState.energy);
    }
    
    // Покупка генератора
    buyGenerator(type) {
        if (!this.socketManager.isConnected()) {
            this.ui.showNotification('Нет соединения с сервером', 'error');
            return;
        }
        
        this.socketManager.buyGenerator(type);
    }
    
    // Запрос перерождения
    requestRebirth() {
        if (!this.socketManager.isConnected()) {
            this.ui.showNotification('Нет соединения с сервером', 'error');
            return;
        }
        
        this.socketManager.requestRebirth();
    }
    
    // Обновление состояния от сервера
    updateFromServer(data) {
        if (data.energy !== undefined) {
            this.gameState.energy = data.energy;
        }
        
        if (data.quantumPoints !== undefined) {
            this.gameState.quantumPoints = data.quantumPoints;
        }
        
        if (data.generators) {
            this.gameState.generators = data.generators;
        }
        
        if (data.rebirthCount !== undefined) {
            this.gameState.rebirthCount = data.rebirthCount;
        }
        
        if (data.sessionTime !== undefined) {
            this.gameState.sessionTime = data.sessionTime;
        }
        
        this.updateUI();
    }
}

// Инициализация игры при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameClient();
});
