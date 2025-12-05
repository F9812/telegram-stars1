// ===== КОНСТАНТЫ И НАСТРОЙКИ =====
const CONSTANTS = {
    PRESTIGE_TIME: 4 * 60 * 60 * 1000, // 4 часа в миллисекундах
    EVENT_DURATION: 15 * 60 * 1000,    // 15 минут
    EVENT_INTERVAL: 60 * 60 * 1000,    // 1 час
    SAVE_INTERVAL: 30 * 1000,          // 30 секунд
    PRESTIGE_BASE_REQUIREMENT: 1000000, // 1M энергии для первого престижа
    PRESTIGE_COST_MULTIPLIER: 1.5,     // Цены растут на 50% с каждым престижем
    PRESTIGE_BONUS_PER_LEVEL: 0.5,     // +50% бонус за уровень
    MAX_LEADERBOARD_SIZE: 50
};

// ===== КЛАСС ИГРОВОГО СОСТОЯНИЯ =====
class GameState {
    constructor() {
        this.reset();
    }
    
    reset() {
        // Основные ресурсы
        this.energy = 0;
        this.totalEnergy = 0;
        this.energyPerClick = 1;
        this.energyPerSecond = 0;
        this.totalClicks = 0;
        
        // Престиж
        this.prestigeLevel = 0;
        this.prestigePoints = 0;
        this.prestigeMultiplier = 1;
        this.lastPrestigeTime = Date.now();
        this.nextPrestigeAvailable = Date.now() + CONSTANTS.PRESTIGE_TIME;
        this.prestigeProgress = 0;
        
        // Генераторы
        this.generators = [
            {
                id: 1,
                name: "Солнечная панель",
                description: "Базовая генерация энергии",
                baseCost: 10,
                cost: 10,
                owned: 0,
                baseProduction: 0.1,
                production: 0.1,
                icon: "fas fa-solar-panel",
                unlocked: true
            },
            {
                id: 2,
                name: "Ветрогенератор",
                description: "Стабильный источник",
                baseCost: 50,
                cost: 50,
                owned: 0,
                baseProduction: 0.5,
                production: 0.5,
                icon: "fas fa-wind",
                unlocked: false
            },
            {
                id: 3,
                name: "Гидростанция",
                description: "Мощный поток",
                baseCost: 200,
                cost: 200,
                owned: 0,
                baseProduction: 2,
                production: 2,
                icon: "fas fa-water",
                unlocked: false
            },
            {
                id: 4,
                name: "Ядерный реактор",
                description: "Атомная энергия",
                baseCost: 1000,
                cost: 1000,
                owned: 0,
                baseProduction: 10,
                production: 10,
                icon: "fas fa-atom",
                unlocked: false
            },
            {
                id: 5,
                name: "Термояд",
                description: "Энергия звезды",
                baseCost: 5000,
                cost: 5000,
                owned: 0,
                baseProduction: 50,
                production: 50,
                icon: "fas fa-fire",
                unlocked: false
            },
            {
                id: 6,
                name: "Сфера Дайсона",
                description: "Межзвездные технологии",
                baseCost: 25000,
                cost: 25000,
                owned: 0,
                baseProduction: 200,
                production: 200,
                icon: "fas fa-sun",
                unlocked: false
            }
        ];
        
        // Множители
        this.multipliers = [
            {
                id: 1,
                name: "Эффективность I",
                description: "+10% к генерации",
                baseCost: 100,
                cost: 100,
                owned: 0,
                multiplier: 1.1,
                icon: "fas fa-bolt",
                unlocked: true
            },
            {
                id: 2,
                name: "Сеть II",
                description: "+25% к генерации",
                baseCost: 500,
                cost: 500,
                owned: 0,
                multiplier: 1.25,
                icon: "fas fa-network-wired",
                unlocked: false
            },
            {
                id: 3,
                name: "Квант III",
                description: "+50% к генерации",
                baseCost: 2500,
                cost: 2500,
                owned: 0,
                multiplier: 1.5,
                icon: "fas fa-microchip",
                unlocked: false
            },
            {
                id: 4,
                name: "Сингулярность",
                description: "x2 ко всей генерации",
                baseCost: 10000,
                cost: 10000,
                owned: 0,
                multiplier: 2,
                icon: "fas fa-infinity",
                unlocked: false
            }
        ];
        
        // Бусты
        this.boosts = {
            click2x: false,
            auto5x: false
        };
        
        // Ивенты
        this.activeEvents = [];
        this.nextEventTime = Date.now() + CONSTANTS.EVENT_INTERVAL;
        this.eventHistory = [];
        
        // Статистика
        this.playTime = 0;
        this.startTime = Date.now();
        this.lastSaveTime = Date.now();
        
        // Настройки
        this.username = "Космонавт";
        this.settings = {
            autoSave: true,
            animations: true,
            soundEffects: true,
            numberFormat: "standard"
        };
        
        // Разблокировки
        this.unlockedGenerators = 1;
        this.unlockedMultipliers = 1;
    }
    
    // Расчет стоимости с учетом престижа
    calculateCost(baseCost) {
        return Math.floor(baseCost * Math.pow(CONSTANTS.PRESTIGE_COST_MULTIPLIER, this.prestigeLevel));
    }
    
    // Расчет производства энергии в секунду
    calculateEPS() {
        let eps = 0;
        
        // Базовая генерация от генераторов
        this.generators.forEach(gen => {
            eps += gen.production * gen.owned;
        });
        
        // Применяем множители
        let multiplier = this.prestigeMultiplier;
        this.multipliers.forEach(mul => {
            if (mul.owned > 0) {
                multiplier *= Math.pow(mul.multiplier, mul.owned);
            }
        });
        
        // Буст авто-генерации
        if (this.boosts.auto5x) {
            multiplier *= 5;
        }
        
        // Ивенты
        this.activeEvents.forEach(event => {
            if (event.type === 'production') {
                multiplier *= event.multiplier;
            }
        });
        
        this.energyPerSecond = eps * multiplier;
        return this.energyPerSecond;
    }
    
    // Расчет силы клика
    calculateClickPower() {
        let power = this.energyPerClick;
        
        // Буст кликов
        if (this.boosts.click2x) {
            power *= 2;
        }
        
        // Престиж множитель
        power *= this.prestigeMultiplier;
        
        // Ивенты
        this.activeEvents.forEach(event => {
            if (event.type === 'click') {
                power *= event.multiplier;
            }
        });
        
        return power;
    }
    
    // Проверка разблокировок
    checkUnlocks() {
        // Разблокировка генераторов
        const generatorUnlockPoints = [50, 200, 1000, 5000, 25000];
        generatorUnlockPoints.forEach((point, index) => {
            if (this.totalEnergy >= point && index + 2 <= this.generators.length) {
                if (!this.generators[index + 1].unlocked) {
                    this.generators[index + 1].unlocked = true;
                    this.showNotification("Разблокирован новый генератор!", "success");
                }
            }
        });
        
        // Разблокировка множителей
        const multiplierUnlockPoints = [500, 2500, 10000];
        multiplierUnlockPoints.forEach((point, index) => {
            if (this.totalEnergy >= point && index + 2 <= this.multipliers.length) {
                if (!this.multipliers[index + 1].unlocked) {
                    this.multipliers[index + 1].unlocked = true;
                    this.showNotification("Разблокирован новый множитель!", "success");
                }
            }
        });
    }
    
    // Покупка генератора
    buyGenerator(generatorId, amount = 1) {
        const generator = this.generators.find(g => g.id === generatorId);
        if (!generator || !generator.unlocked) return 0;
        
        let bought = 0;
        let totalCost = 0;
        
        for (let i = 0; i < amount; i++) {
            const cost = this.calculateGeneratorCost(generator);
            if (this.energy >= cost) {
                this.energy -= cost;
                generator.owned++;
                generator.cost = this.calculateGeneratorCost(generator);
                totalCost += cost;
                bought++;
                
                // Пересчет стоимости для следующей покупки
                generator.cost = this.calculateGeneratorCost(generator);
            } else {
                break;
            }
        }
        
        if (bought > 0) {
            this.calculateEPS();
            this.checkUnlocks();
        }
        
        return bought;
    }
    
    // Расчет стоимости генератора
    calculateGeneratorCost(generator) {
        return Math.floor(generator.baseCost * Math.pow(1.15, generator.owned) * Math.pow(CONSTANTS.PRESTIGE_COST_MULTIPLIER, this.prestigeLevel));
    }
    
    // Покупка множителя
    buyMultiplier(multiplierId) {
        const multiplier = this.multipliers.find(m => m.id === multiplierId);
        if (!multiplier || !multiplier.unlocked || this.energy < multiplier.cost) return false;
        
        this.energy -= multiplier.cost;
        multiplier.owned++;
        multiplier.cost = this.calculateMultiplierCost(multiplier);
        
        // Пересчет производства генераторов
        this.generators.forEach(gen => {
            gen.production = gen.baseProduction * Math.pow(multiplier.multiplier, multiplier.owned);
        });
        
        this.calculateEPS();
        return true;
    }
    
    // Расчет стоимости множителя
    calculateMultiplierCost(multiplier) {
        return Math.floor(multiplier.baseCost * Math.pow(1.5, multiplier.owned) * Math.pow(CONSTANTS.PRESTIGE_COST_MULTIPLIER, this.prestigeLevel));
    }
    
    // Массовая покупка генераторов
    buyMaxGenerators() {
        let totalBought = 0;
        let totalCost = 0;
        
        // Покупаем самые дешевые доступные генераторы
        const availableGenerators = this.generators.filter(g => g.unlocked);
        
        while (true) {
            let cheapestGenerator = null;
            let cheapestCost = Infinity;
            
            // Находим самый дешевый доступный генератор
            for (const gen of availableGenerators) {
                const cost = this.calculateGeneratorCost(gen);
                if (cost < cheapestCost) {
                    cheapestCost = cost;
                    cheapestGenerator = gen;
                }
            }
            
            if (!cheapestGenerator || this.energy < cheapestCost) {
                break;
            }
            
            this.energy -= cheapestCost;
            cheapestGenerator.owned++;
            cheapestGenerator.cost = this.calculateGeneratorCost(cheapestGenerator);
            totalBought++;
            totalCost += cheapestCost;
        }
        
        if (totalBought > 0) {
            this.calculateEPS();
            this.checkUnlocks();
            this.showNotification(`Куплено ${totalBought} генераторов`, "success");
        }
        
        return totalBought;
    }
    
    // Покупка всех доступных улучшений
    buyAllUpgrades() {
        let bought = 0;
        let totalCost = 0;
        
        // Бусты
        if (!this.boosts.click2x && this.energy >= 100) {
            this.energy -= 100;
            this.boosts.click2x = true;
            bought++;
            totalCost += 100;
        }
        
        if (!this.boosts.auto5x && this.energy >= 500) {
            this.energy -= 500;
            this.boosts.auto5x = true;
            bought++;
            totalCost += 500;
        }
        
        // Множители
        for (const multiplier of this.multipliers) {
            if (multiplier.unlocked && this.energy >= multiplier.cost) {
                this.energy -= multiplier.cost;
                multiplier.owned++;
                multiplier.cost = this.calculateMultiplierCost(multiplier);
                bought++;
                totalCost += multiplier.cost;
            }
        }
        
        if (bought > 0) {
            this.calculateEPS();
            this.showNotification(`Куплено ${bought} улучшений`, "success");
        }
        
        return bought;
    }
    
    // Проверка возможности престижа
    canPrestige() {
        const now = Date.now();
        const timePassed = now - this.lastPrestigeTime;
        const requiredEnergy = CONSTANTS.PRESTIGE_BASE_REQUIREMENT * Math.pow(2, this.prestigeLevel);
        
        return this.totalEnergy >= requiredEnergy && now >= this.nextPrestigeAvailable;
    }
    
    // Выполнение престижа
    performPrestige() {
        if (!this.canPrestige()) return false;
        
        const requiredEnergy = CONSTANTS.PRESTIGE_BASE_REQUIREMENT * Math.pow(2, this.prestigeLevel);
        const prestigePoints = Math.floor(this.totalEnergy / requiredEnergy);
        
        // Обновляем престиж
        this.prestigeLevel++;
        this.prestigePoints += prestigePoints;
        this.prestigeMultiplier = 1 + (this.prestigeLevel * CONSTANTS.PRESTIGE_BONUS_PER_LEVEL);
        
        // Сбрасываем прогресс
        this.energy = 0;
        this.totalEnergy = 0;
        this.energyPerClick = 1;
        
        this.generators.forEach(gen => {
            gen.owned = 0;
            gen.cost = this.calculateCost(gen.baseCost);
            gen.production = gen.baseProduction;
        });
        
        this.multipliers.forEach(mul => {
            mul.owned = 0;
            mul.cost = this.calculateCost(mul.baseCost);
        });
        
        this.boosts.click2x = false;
        this.boosts.auto5x = false;
        
        // Устанавливаем таймер следующего престижа
        this.lastPrestigeTime = Date.now();
        this.nextPrestigeAvailable = Date.now() + CONSTANTS.PRESTIGE_TIME;
        
        // Сохраняем в таблицу лидеров
        this.saveToLeaderboard();
        
        this.showNotification(`Престиж ${this.prestigeLevel} выполнен! +${prestigePoints} очков`, "warning");
        return true;
    }
    
    // Обновление прогресса престижа
    updatePrestigeProgress() {
        const now = Date.now();
        const timeLeft = this.nextPrestigeAvailable - now;
        
        if (timeLeft > 0) {
            this.prestigeProgress = 1 - (timeLeft / CONSTANTS.PRESTIGE_TIME);
        } else {
            this.prestigeProgress = 1;
        }
    }
    
    // Генерация ивента
    generateEvent() {
        const events = [
            {
                type: 'production',
                name: 'Энергетический всплеск',
                description: 'Все генераторы работают в 2 раза быстрее',
                multiplier: 2,
                duration: CONSTANTS.EVENT_DURATION,
                icon: 'fas fa-bolt'
            },
            {
                type: 'click',
                name: 'Квантовый ускоритель',
                description: 'Сила клика увеличена в 3 раза',
                multiplier: 3,
                duration: CONSTANTS.EVENT_DURATION,
                icon: 'fas fa-mouse-pointer'
            },
            {
                type: 'discount',
                name: 'Космическая распродажа',
                description: 'Все цены снижены на 50%',
                multiplier: 0.5,
                duration: CONSTANTS.EVENT_DURATION,
                icon: 'fas fa-tag'
            },
            {
                type: 'bonus',
                name: 'Звездный дождь',
                description: '+100% к энергии за клик',
                multiplier: 2,
                duration: CONSTANTS.EVENT_DURATION,
                icon: 'fas fa-star'
            }
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        const event = {
            ...randomEvent,
            id: Date.now(),
            startTime: Date.now(),
            endTime: Date.now() + randomEvent.duration
        };
        
        this.activeEvents.push(event);
        this.eventHistory.push(event);
        
        this.showNotification(`Начат ивент: ${event.name}`, "success");
        
        // Планируем следующий ивент
        this.nextEventTime = Date.now() + CONSTANTS.EVENT_INTERVAL;
        
        return event;
    }
    
    // Обновление ивентов
    updateEvents() {
        const now = Date.now();
        
        // Удаляем завершенные ивенты
        this.activeEvents = this.activeEvents.filter(event => event.endTime > now);
        
        // Проверяем, пора ли начать новый ивент
        if (now >= this.nextEventTime && this.activeEvents.length === 0) {
            this.generateEvent();
        }
    }
    
    // Получение активного ивента
    getActiveEvent() {
        return this.activeEvents.length > 0 ? this.activeEvents[0] : null;
    }
    
    // Сохранение в таблицу лидеров
    saveToLeaderboard() {
        const playerData = {
            username: this.username,
            energy: this.totalEnergy,
            prestige: this.prestigeLevel,
            playTime: this.playTime,
            lastUpdated: Date.now()
        };
        
        let leaderboard = JSON.parse(localStorage.getItem('spaceIncrementorLeaderboard') || '[]');
        
        // Ищем существующую запись
        const existingIndex = leaderboard.findIndex(p => p.username === this.username);
        
        if (existingIndex !== -1) {
            // Обновляем существующую запись
            leaderboard[existingIndex] = {
                ...leaderboard[existingIndex],
                ...playerData
            };
        } else {
            // Добавляем новую запись
            leaderboard.push(playerData);
        }
        
        // Сортируем по энергии (по убыванию)
        leaderboard.sort((a, b) => b.energy - a.energy);
        
        // Ограничиваем размер
        leaderboard = leaderboard.slice(0, CONSTANTS.MAX_LEADERBOARD_SIZE);
        
        localStorage.setItem('spaceIncrementorLeaderboard', JSON.stringify(leaderboard));
    }
    
    // Получение таблицы лидеров
    getLeaderboard(sortBy = 'energy') {
        let leaderboard = JSON.parse(localStorage.getItem('spaceIncrementorLeaderboard') || '[]');
        
        switch (sortBy) {
            case 'prestige':
                leaderboard.sort((a, b) => b.prestige - a.prestige);
                break;
            case 'playtime':
                leaderboard.sort((a, b) => b.playTime - a.playTime);
                break;
            default: // 'energy'
                leaderboard.sort((a, b) => b.energy - a.energy);
        }
        
        return leaderboard;
    }
    
    // Получение позиции игрока
    getPlayerRank() {
        const leaderboard = this.getLeaderboard('energy');
        const playerIndex = leaderboard.findIndex(p => p.username === this.username);
        return playerIndex !== -1 ? playerIndex + 1 : -1;
    }
    
    // Форматирование чисел
    formatNumber(num) {
        if (this.settings.numberFormat === 'scientific' && num >= 1000) {
            return num.toExponential(2);
        } else if (this.settings.numberFormat === 'full') {
            return Math.floor(num).toLocaleString();
        } else {
            // Стандартный формат
            if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
            if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
            if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
            if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
            return num.toFixed(2);
        }
    }
    
    // Форматирование времени
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    // Показать уведомление
    showNotification(message, type = 'info') {
        // Этот метод будет переопределен в GameManager
        if (window.gameManager && window.gameManager.showNotification) {
            window.gameManager.showNotification(message, type);
        }
    }
}

// ===== КЛАСС УПРАВЛЕНИЯ ИГРОЙ =====
class GameManager {
    constructor() {
        this.game = new GameState();
        this.lastUpdate = Date.now();
        this.saveInterval = null;
        this.saveTimer = 30;
        this.isInitialized = false;
        this.particles = [];
        
        this.init();
    }
    
    init() {
        // Загружаем сохранение
        this.loadGame();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
        
        // Инициализируем интерфейс
        this.render();
        
        // Запускаем игровой цикл
        this.startGameLoop();
        
        // Запускаем таймер сохранения
        this.startSaveTimer();
        
        this.isInitialized = true;
    }
    
    setupEventListeners() {
        // Клик по ядру
        document.getElementById('core').addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Бусты
        document.getElementById('boost-2x').addEventListener('click', () => {
            this.buyBoost('click2x', 100);
        });
        
        document.getElementById('boost-5x').addEventListener('click', () => {
            this.buyBoost('auto5x', 500);
        });
        
        // Массовые покупки
        document.getElementById('buy-10-generators').addEventListener('click', () => {
            this.buyGenerators(10);
        });
        
        document.getElementById('buy-max-generators').addEventListener('click', () => {
            this.buyMaxGenerators();
        });
        
        document.getElementById('buy-all-upgrades').addEventListener('click', () => {
            this.buyAllUpgrades();
        });
        
        // Вкладки
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Таблица лидеров
        document.querySelectorAll('.lb-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const board = btn.dataset.board;
                this.switchLeaderboard(board);
            });
        });
        
        // Престиж
        document.getElementById('prestige-button').addEventListener('click', () => {
            this.performPrestige();
        });
        
        // Настройки
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
        
        document.getElementById('edit-name').addEventListener('click', () => {
            this.editUsername();
        });
        
        document.getElementById('save-username').addEventListener('click', () => {
            this.saveUsername();
        });
        
        // Закрытие модальных окон
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal(btn.closest('.modal'));
            });
        });
        
        // Клик вне модального окна
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
        
        // Сохранение настроек
        document.getElementById('auto-save').addEventListener('change', (e) => {
            this.game.settings.autoSave = e.target.checked;
            this.saveGame();
        });
        
        document.getElementById('animations').addEventListener('change', (e) => {
            this.game.settings.animations = e.target.checked;
        });
        
        document.getElementById('sound-effects').addEventListener('change', (e) => {
            this.game.settings.soundEffects = e.target.checked;
        });
        
        document.getElementById('number-format').addEventListener('change', (e) => {
            this.game.settings.numberFormat = e.target.value;
            this.render();
        });
        
        // Экспорт/импорт
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportGame();
        });
        
        document.getElementById('import-btn').addEventListener('click', () => {
            this.importGame();
        });
    }
    
    handleClick(event) {
        if (!this.game.settings.animations) {
            // Простой клик без анимаций
            const clickValue = this.game.calculateClickPower();
            this.game.energy += clickValue;
            this.game.totalEnergy += clickValue;
            this.game.totalClicks++;
            
            this.updateAchievements();
            this.render();
            return;
        }
        
        // Анимированный клик
        const core = document.getElementById('core');
        const rect = core.getBoundingClientRect();
        
        // Координаты клика относительно ядра
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Добавляем энергию
        const clickValue = this.game.calculateClickPower();
        this.game.energy += clickValue;
        this.game.totalEnergy += clickValue;
        this.game.totalClicks++;
        
        // Создаем частицы
        this.createParticles(x, y, clickValue);
        
        // Анимация ядра
        core.style.transform = 'scale(0.95)';
        setTimeout(() => {
            core.style.transform = 'scale(1)';
        }, 100);
        
        // Обновляем достижения
        this.updateAchievements();
        
        // Рендерим
        this.render();
    }
    
    createParticles(x, y, value) {
        const container = document.getElementById('particles');
        const particleCount = 10 + Math.min(Math.floor(value / 10), 50);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.position = 'absolute';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = 'radial-gradient(circle, #00f3ff, #9d4edd)';
            particle.style.borderRadius = '50%';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '10';
            
            container.appendChild(particle);
            
            // Анимация
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const distance = 50 + Math.random() * 100;
            
            const startX = x;
            const startY = y;
            
            let progress = 0;
            const duration = 1000 + Math.random() * 500;
            
            const animate = () => {
                progress += 16 / duration;
                
                if (progress < 1) {
                    const currentX = startX + Math.cos(angle) * speed * progress * distance;
                    const currentY = startY + Math.sin(angle) * speed * progress * distance;
                    
                    particle.style.left = `${currentX}px`;
                    particle.style.top = `${currentY}px`;
                    particle.style.opacity = 1 - progress;
                    
                    requestAnimationFrame(animate);
                } else {
                    particle.remove();
                }
            };
            
            requestAnimationFrame(animate);
        }
        
        // Текст с значением клика
        const text = document.createElement('div');
        text.className = 'click-text';
        text.textContent = `+${this.game.formatNumber(value)}`;
        text.style.position = 'absolute';
        text.style.left = `${x}px`;
        text.style.top = `${y}px`;
        text.style.color = '#00ff9d';
        text.style.fontWeight = 'bold';
        text.style.fontSize = '1.2rem';
        text.style.textShadow = '0 0 10px #00ff9d';
        text.style.pointerEvents = 'none';
        text.style.zIndex = '10';
        text.style.transform = 'translate(-50%, -50%)';
        
        container.appendChild(text);
        
        // Анимация текста
        let opacity = 1;
        let textY = y;
        
        const animateText = () => {
            opacity -= 0.02;
            textY -= 1;
            
            text.style.opacity = opacity;
            text.style.top = `${textY}px`;
            
            if (opacity > 0) {
                requestAnimationFrame(animateText);
            } else {
                text.remove();
            }
        };
        
        requestAnimationFrame(animateText);
    }
    
    buyBoost(boostType, cost) {
        if (this.game.energy < cost || this.game.boosts[boostType]) return false;
        
        this.game.energy -= cost;
        this.game.boosts[boostType] = true;
        
        this.render();
        this.showNotification('Буст активирован!', 'success');
        
        return true;
    }
    
    buyGenerators(amount) {
        let totalBought = 0;
        let totalCost = 0;
        
        // Покупаем указанное количество самых дешевых генераторов
        for (let i = 0; i < amount; i++) {
            // Находим самый дешевый доступный генератор
            let cheapestGenerator = null;
            let cheapestCost = Infinity;
            
            for (const gen of this.game.generators) {
                if (gen.unlocked) {
                    const cost = this.game.calculateGeneratorCost(gen);
                    if (cost < cheapestCost) {
                        cheapestCost = cost;
                        cheapestGenerator = gen;
                    }
                }
            }
            
            if (!cheapestGenerator || this.game.energy < cheapestCost) {
                break;
            }
            
            this.game.energy -= cheapestCost;
            cheapestGenerator.owned++;
            cheapestGenerator.cost = this.game.calculateGeneratorCost(cheapestGenerator);
            totalBought++;
            totalCost += cheapestCost;
        }
        
        if (totalBought > 0) {
            this.game.calculateEPS();
            this.game.checkUnlocks();
            this.render();
            this.showNotification(`Куплено ${totalBought} генераторов`, 'success');
        }
        
        return totalBought;
    }
    
    buyMaxGenerators() {
        const bought = this.game.buyMaxGenerators();
        if (bought > 0) {
            this.render();
        }
    }
    
    buyAllUpgrades() {
        const bought = this.game.buyAllUpgrades();
        if (bought > 0) {
            this.render();
        }
    }
    
    buyGenerator(generatorId) {
        if (this.game.buyGenerator(generatorId, 1) > 0) {
            this.render();
        }
    }
    
    buyMultiplier(multiplierId) {
        if (this.game.buyMultiplier(multiplierId)) {
            this.render();
            this.showNotification('Множитель куплен!', 'success');
        }
    }
    
    performPrestige() {
        if (this.game.performPrestige()) {
            this.render();
            this.updateLeaderboard();
        }
    }
    
    switchTab(tabName) {
        // Убираем активный класс у всех табов
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Активируем выбранный таб
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(`tab-${tabName}`);
        
        if (tabBtn) tabBtn.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
    }
    
    switchLeaderboard(boardType) {
        // Убираем активный класс у всех табов
        document.querySelectorAll('.lb-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Активируем выбранный таб
        const tabBtn = document.querySelector(`[data-board="${boardType}"]`);
        if (tabBtn) tabBtn.classList.add('active');
        
        // Обновляем таблицу лидеров
        this.updateLeaderboard(boardType);
    }
    
    startGameLoop() {
        const gameLoop = () => {
            const now = Date.now();
            const delta = (now - this.lastUpdate) / 1000; // В секундах
            this.lastUpdate = now;
            
            // Обновляем время игры
            this.game.playTime += delta;
            
            // Пассивная генерация энергии
            if (this.game.energyPerSecond > 0) {
                this.game.energy += this.game.energyPerSecond * delta;
                this.game.totalEnergy += this.game.energyPerSecond * delta;
            }
            
            // Обновляем ивенты
            this.game.updateEvents();
            
            // Обновляем прогресс престижа
            this.game.updatePrestigeProgress();
            
            // Обновляем достижения
            this.updateAchievements();
            
            // Рендерим обновления
            this.render();
            
            // Сохраняем каждые 30 секунд
            if (this.saveTimer <= 0 && this.game.settings.autoSave) {
                this.saveGame();
                this.saveTimer = 30;
            }
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    startSaveTimer() {
        setInterval(() => {
            this.saveTimer--;
            document.getElementById('save-timer').textContent = this.saveTimer;
            
            if (this.saveTimer <= 0) {
                this.saveTimer = 30;
            }
        }, 1000);
    }
    
    render() {
        this.updateStats();
        this.updateGenerators();
        this.updateMultipliers();
        this.updatePrestige();
        this.updateEventsDisplay();
        this.updateLeaderboard();
        this.updateQuickStats();
        this.updateMassPurchaseCosts();
    }
    
    updateStats() {
        // Основная статистика
        document.getElementById('energy').textContent = this.game.formatNumber(this.game.energy);
        document.getElementById('total-energy').textContent = this.game.formatNumber(this.game.totalEnergy);
        document.getElementById('eps').textContent = this.game.formatNumber(this.game.calculateEPS());
        document.getElementById('global-multiplier').textContent = this.game.prestigeMultiplier.toFixed(2) + 'x';
        document.getElementById('prestige-level').textContent = this.game.prestigeLevel;
        document.getElementById('prestige-points').textContent = this.game.prestigePoints;
        document.getElementById('total-clicks').textContent = this.game.totalClicks;
        document.getElementById('auto-value').textContent = this.game.formatNumber(this.game.energyPerSecond);
        document.getElementById('click-value').textContent = this.game.formatNumber(this.game.calculateClickPower());
        document.getElementById('username').textContent = this.game.username;
        document.getElementById('player-level').textContent = Math.floor(this.game.prestigeLevel / 5) + 1;
        document.getElementById('total-playtime').textContent = this.game.formatTime(this.game.playTime * 1000);
        
        // Ивенты
        const activeEvent = this.game.getActiveEvent();
        if (activeEvent) {
            const timeLeft = activeEvent.endTime - Date.now();
            document.getElementById('event-timer').textContent = this.game.formatTime(timeLeft);
            document.getElementById('active-event').textContent = activeEvent.name;
        } else {
            const timeToNext = this.game.nextEventTime - Date.now();
            document.getElementById('event-timer').textContent = this.game.formatTime(timeToNext);
            document.getElementById('active-event').textContent = 'Скоро';
        }
        
        // Обновляем прогресс сохранения
        const saveIcon = document.getElementById('save-icon');
        if (this.game.settings.autoSave) {
            saveIcon.style.display = 'block';
        } else {
            saveIcon.style.display = 'none';
        }
    }
    
    updateGenerators() {
        const container = document.getElementById('generators-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.game.generators.forEach(gen => {
            if (!gen.unlocked) return;
            
            const canAfford = this.game.energy >= gen.cost;
            const totalProduction = gen.production * gen.owned;
            
            const generatorHTML = `
                <div class="upgrade-item">
                    <div class="upgrade-header">
                        <div class="upgrade-icon">
                            <i class="${gen.icon}"></i>
                        </div>
                        <div class="upgrade-info">
                            <h3>${gen.name}</h3>
                            <p>${gen.description}</p>
                        </div>
                    </div>
                    <div class="upgrade-stats">
                        <div class="upgrade-stat">
                            <span class="stat-label">Куплено</span>
                            <span class="stat-value">${gen.owned}</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="stat-label">Производство</span>
                            <span class="stat-value">${this.game.formatNumber(gen.production)}/сек</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="stat-label">Всего</span>
                            <span class="stat-value">${this.game.formatNumber(totalProduction)}/сек</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="stat-label">Стоимость</span>
                            <span class="stat-value">${this.game.formatNumber(gen.cost)}</span>
                        </div>
                    </div>
                    <button class="upgrade-action" onclick="gameManager.buyGenerator(${gen.id})" ${canAfford ? '' : 'disabled'}>
                        <i class="fas fa-shopping-cart"></i>
                        ${canAfford ? 'Купить' : 'Не хватает энергии'}
                    </button>
                </div>
            `;
            
            container.innerHTML += generatorHTML;
        });
    }
    
    updateMultipliers() {
        const container = document.getElementById('multipliers-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.game.multipliers.forEach(mul => {
            if (!mul.unlocked) return;
            
            const canAfford = this.game.energy >= mul.cost;
            const totalMultiplier = Math.pow(mul.multiplier, mul.owned).toFixed(2);
            
            const multiplierHTML = `
                <div class="upgrade-item">
                    <div class="upgrade-header">
                        <div class="upgrade-icon">
                            <i class="${mul.icon}"></i>
                        </div>
                        <div class="upgrade-info">
                            <h3>${mul.name}</h3>
                            <p>${mul.description}</p>
                        </div>
                    </div>
                    <div class="upgrade-stats">
                        <div class="upgrade-stat">
                            <span class="stat-label">Куплено</span>
                            <span class="stat-value">${mul.owned}</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="stat-label">Множитель</span>
                            <span class="stat-value">x${mul.multiplier}</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="stat-label">Общий эффект</span>
                            <span class="stat-value">x${totalMultiplier}</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="stat-label">Стоимость</span>
                            <span class="stat-value">${this.game.formatNumber(mul.cost)}</span>
                        </div>
                    </div>
                    <button class="upgrade-action" onclick="gameManager.buyMultiplier(${mul.id})" ${canAfford ? '' : 'disabled'}>
                        <i class="fas fa-chart-line"></i>
                        ${canAfford ? 'Купить' : 'Не хватает энергии'}
                    </button>
                </div>
            `;
            
            container.innerHTML += multiplierHTML;
        });
    }
    
    updatePrestige() {
        const now = Date.now();
        const timeLeft = this.game.nextPrestigeAvailable - now;
        const requiredEnergy = CONSTANTS.PRESTIGE_BASE_REQUIREMENT * Math.pow(2, this.game.prestigeLevel);
        
        // Таймер
        document.getElementById('next-prestige-timer').textContent = this.game.formatTime(timeLeft);
        
        // Бонус
        document.getElementById('current-prestige-bonus').textContent = 
            `+${Math.floor((this.game.prestigeMultiplier - 1) * 100)}%`;
        
        // Очки
        document.getElementById('available-prestige-points').textContent = this.game.prestigePoints;
        
        // Прогресс
        const progressPercent = this.game.prestigeProgress * 100;
        document.getElementById('prestige-progress-fill').style.width = `${progressPercent}%`;
        document.getElementById('prestige-progress-text').textContent = `${Math.floor(progressPercent)}%`;
        
        // Требования
        document.getElementById('prestige-requirement').textContent = 
            this.game.formatNumber(requiredEnergy);
        
        // Кнопка престижа
        const prestigeBtn = document.getElementById('prestige-button');
        if (this.game.canPrestige()) {
            prestigeBtn.disabled = false;
            const points = Math.floor(this.game.totalEnergy / requiredEnergy);
            prestigeBtn.innerHTML = `
                <i class="fas fa-sync-alt"></i>
                <span>ПЕРЕРОДИТЬСЯ</span>
                <small>+${points} очков престижа</small>
            `;
        } else {
            prestigeBtn.disabled = true;
            let reason = '';
            
            if (this.game.totalEnergy < requiredEnergy) {
                reason = `Нужно ${this.game.formatNumber(requiredEnergy - this.game.totalEnergy)} энергии`;
            } else {
                reason = `Осталось ${this.game.formatTime(timeLeft)}`;
            }
            
            prestigeBtn.innerHTML = `
                <i class="fas fa-clock"></i>
                <span>НЕДОСТУПНО</span>
                <small>${reason}</small>
            `;
        }
    }
    
    updateEventsDisplay() {
        const container = document.getElementById('events-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        const activeEvent = this.game.getActiveEvent();
        
        if (activeEvent) {
            const timeLeft = activeEvent.endTime - Date.now();
            const progress = 1 - (timeLeft / activeEvent.duration);
            
            const eventHTML = `
                <div class="event-card">
                    <div class="event-icon">
                        <i class="${activeEvent.icon}"></i>
                    </div>
                    <div class="event-info">
                        <h4>${activeEvent.name}</h4>
                        <p>${activeEvent.description}</p>
                        <div class="event-timer">
                            <i class="fas fa-clock"></i>
                            <span>${this.game.formatTime(timeLeft)}</span>
                        </div>
                    </div>
                    <div class="event-bonus">
                        <span class="bonus-badge">+${Math.floor((activeEvent.multiplier - 1) * 100)}%</span>
                    </div>
                </div>
            `;
            
            container.innerHTML = eventHTML;
        }
        
        // Следующий ивент
        const nextEventTime = this.game.nextEventTime - Date.now();
        document.getElementById('next-event-timer').textContent = this.game.formatTime(nextEventTime);
    }
    
    updateLeaderboard(sortBy = 'energy') {
        const leaderboard = this.game.getLeaderboard(sortBy);
        const tbody = document.getElementById('leaderboard-body');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        leaderboard.slice(0, 10).forEach((player, index) => {
            const row = document.createElement('tr');
            
            // Медальки для топ-3
            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            
            row.innerHTML = `
                <td><strong>${index + 1}</strong> ${medal}</td>
                <td>${player.username}</td>
                <td>${this.game.formatNumber(player.energy)}</td>
                <td>${player.prestige}</td>
                <td>${this.game.formatTime(player.playTime * 1000)}</td>
                <td>${Math.floor(player.prestige / 5) + 1}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Обновляем позицию игрока
        const playerRank = this.game.getPlayerRank();
        document.getElementById('player-rank').textContent = playerRank !== -1 ? playerRank : '-';
        document.getElementById('player-balance-rank').textContent = this.game.formatNumber(this.game.totalEnergy);
        document.getElementById('player-prestige-rank').textContent = this.game.prestigeLevel;
    }
    
    updateQuickStats() {
        let totalGenerators = 0;
        let totalUpgrades = 0;
        let totalMultiplier = this.game.prestigeMultiplier;
        
        this.game.generators.forEach(gen => {
            totalGenerators += gen.owned;
        });
        
        this.game.multipliers.forEach(mul => {
            if (mul.owned > 0) {
                totalUpgrades += mul.owned;
                totalMultiplier *= Math.pow(mul.multiplier, mul.owned);
            }
        });
        
        document.getElementById('total-generators').textContent = totalGenerators;
        document.getElementById('total-upgrades').textContent = totalUpgrades;
        document.getElementById('total-multiplier').textContent = totalMultiplier.toFixed(2) + 'x';
    }
    
    updateMassPurchaseCosts() {
        // Стоимость 10 генераторов
        let cheapestGenerator = null;
        let cheapestCost = Infinity;
        
        for (const gen of this.game.generators) {
            if (gen.unlocked) {
                const cost = this.game.calculateGeneratorCost(gen);
                if (cost < cheapestCost) {
                    cheapestCost = cost;
                    cheapestGenerator = gen;
                }
            }
        }
        
        if (cheapestGenerator) {
            const totalCost = cheapestCost * 10;
            document.getElementById('cost-10-generators').textContent = 
                this.game.formatNumber(totalCost);
            
            const btn = document.getElementById('buy-10-generators');
            btn.disabled = this.game.energy < totalCost;
        }
        
        // Стоимость всех улучшений
        let allUpgradesCost = 0;
        
        if (!this.game.boosts.click2x) allUpgradesCost += 100;
        if (!this.game.boosts.auto5x) allUpgradesCost += 500;
        
        this.game.multipliers.forEach(mul => {
            if (mul.unlocked) {
                allUpgradesCost += mul.cost;
            }
        });
        
        document.getElementById('cost-all-upgrades').textContent = 
            this.game.formatNumber(allUpgradesCost);
        
        const upgradesBtn = document.getElementById('buy-all-upgrades');
        upgradesBtn.disabled = this.game.energy < allUpgradesCost;
    }
    
    updateAchievements() {
        // В этой версии достижения не реализованы, но можно добавить
        this.game.checkUnlocks();
    }
    
    showSettings() {
        const modal = document.getElementById('settings-modal');
        modal.classList.add('active');
        
        // Заполняем текущие значения
        document.getElementById('username-input').value = this.game.username;
        document.getElementById('auto-save').checked = this.game.settings.autoSave;
        document.getElementById('animations').checked = this.game.settings.animations;
        document.getElementById('sound-effects').checked = this.game.settings.soundEffects;
        document.getElementById('number-format').value = this.game.settings.numberFormat;
    }
    
    closeModal(modal) {
        modal.classList.remove('active');
    }
    
    editUsername() {
        const newName = prompt('Введите новое имя игрока:', this.game.username);
        if (newName && newName.trim() !== '') {
            this.game.username = newName.trim().substring(0, 20);
            this.game.saveToLeaderboard();
            this.render();
            this.showNotification('Имя изменено!', 'success');
        }
    }
    
    saveUsername() {
        const input = document.getElementById('username-input');
        const newName = input.value.trim();
        
        if (newName !== '') {
            this.game.username = newName.substring(0, 20);
            this.game.saveToLeaderboard();
            this.render();
            this.showNotification('Имя сохранено!', 'success');
            
            // Закрываем модальное окно
            this.closeModal(document.getElementById('settings-modal'));
        }
    }
    
    exportGame() {
        const saveData = {
            game: this.game,
            timestamp: Date.now(),
            version: '2.0.0'
        };
        
        const dataStr = JSON.stringify(saveData);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `space-incrementor-save-${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showNotification('Игра экспортирована!', 'success');
    }
    
    importGame() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const saveData = JSON.parse(event.target.result);
                    
                    if (saveData.version === '2.0.0') {
                        Object.assign(this.game, saveData.game);
                        this.render();
                        this.saveGame();
                        this.showNotification('Игра импортирована!', 'success');
                    } else {
                        this.showNotification('Неверная версия сохранения', 'error');
                    }
                } catch (error) {
                    this.showNotification('Ошибка загрузки сохранения', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    saveGame() {
        try {
            const saveData = {
                game: this.game,
                timestamp: Date.now(),
                version: '2.0.0'
            };
            
            localStorage.setItem('spaceIncrementorSave', JSON.stringify(saveData));
            
            // Сохраняем в таблицу лидеров
            this.game.saveToLeaderboard();
            
            // Визуальная обратная связь
            const saveIcon = document.getElementById('save-icon');
            saveIcon.style.color = '#00ff9d';
            setTimeout(() => {
                saveIcon.style.color = '#00f3ff';
            }, 500);
            
        } catch (e) {
            console.error('Ошибка сохранения:', e);
            this.showNotification('Ошибка сохранения', 'error');
        }
    }
    
    loadGame() {
        try {
            const saveData = localStorage.getItem('spaceIncrementorSave');
            if (saveData) {
                const loaded = JSON.parse(saveData);
                
                if (loaded.version === '2.0.0') {
                    Object.assign(this.game, loaded.game);
                    
                    // Восстанавливаем вычисляемые значения
                    this.game.calculateEPS();
                    this.game.updatePrestigeProgress();
                    
                    this.showNotification('Игра загружена!', 'success');
                } else {
                    this.showNotification('Сохранение устарело, начата новая игра', 'warning');
                }
            }
        } catch (e) {
            console.error('Ошибка загрузки:', e);
            this.showNotification('Ошибка загрузки, начата новая игра', 'error');
        }
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = 'fas fa-info-circle';
        if (type === 'success') icon = 'fas fa-check-circle';
        else if (type === 'warning') icon = 'fas fa-exclamation-triangle';
        else if (type === 'error') icon = 'fas fa-times-circle';
        
        notification.innerHTML = `
            <i class="${icon}"></i>
            <div class="notification-content">
                <div class="notification-title">${type === 'success' ? 'Успех' : type === 'warning' ? 'Внимание' : type === 'error' ? 'Ошибка' : 'Информация'}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Автоматическое удаление
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// ===== ЗАПУСК ИГРЫ =====
let gameManager;

window.addEventListener('load', () => {
    gameManager = new GameManager();
    window.gameManager = gameManager; // Делаем доступным глобально
});
