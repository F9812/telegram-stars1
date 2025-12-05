// ===== КОНСТАНТЫ ИГРЫ =====
const GAME_CONSTANTS = {
    PRESTIGE_TIME: 4 * 60 * 60 * 1000, // 4 часа
    EVENT_INTERVAL: 60 * 60 * 1000,    // 1 час
    EVENT_DURATION: 15 * 60 * 1000,    // 15 минут
    SAVE_INTERVAL: 30 * 1000,          // 30 секунд
    BASE_POWER: 1,
    PRESTIGE_BASE: 1000000,
    PRESTIGE_MULTIPLIER: 2.5,
    PRICE_INCREASE: 1.15,
    SERVER_URL: 'http://localhost:3000' // URL сервера для глобального топа
};

// ===== КЛАСС ИГРЫ =====
class SpaceIncrementor {
    constructor() {
        console.log('🚀 Инициализация игры...');
        
        // Состояние игры
        this.energy = 0;
        this.totalEnergy = 0;
        this.energyPerSecond = 0;
        this.totalClicks = 0;
        this.playTime = 0;
        this.startTime = Date.now();
        
        // Престиж
        this.prestigeLevel = 0;
        this.prestigePoints = 0;
        this.lastPrestigeTime = Date.now();
        this.nextPrestigeTime = Date.now() + GAME_CONSTANTS.PRESTIGE_TIME;
        
        // Ивенты
        this.activeEvent = null;
        this.eventEndTime = 0;
        this.nextEventTime = Date.now() + GAME_CONSTANTS.EVENT_INTERVAL;
        
        // Настройки
        this.settings = {
            username: 'Космонавт',
            autoSave: true,
            animations: true,
            notifications: true,
            numberFormat: 'short'
        };
        
        // Генераторы (без множителей)
        this.generators = [
            { id: 1, name: 'Солнечная панель', cost: 10, baseCost: 10, owned: 0, production: 0.1, icon: 'fas fa-solar-panel', unlocked: true },
            { id: 2, name: 'Ветрогенератор', cost: 50, baseCost: 50, owned: 0, production: 0.5, icon: 'fas fa-wind', unlocked: false },
            { id: 3, name: 'Гидростанция', cost: 200, baseCost: 200, owned: 0, production: 2, icon: 'fas fa-water', unlocked: false },
            { id: 4, name: 'Ядерный реактор', cost: 1000, baseCost: 1000, owned: 0, production: 10, icon: 'fas fa-atom', unlocked: false },
            { id: 5, name: 'Термояд', cost: 5000, baseCost: 5000, owned: 0, production: 50, icon: 'fas fa-fire', unlocked: false },
            { id: 6, name: 'Сфера Дайсона', cost: 25000, baseCost: 25000, owned: 0, production: 200, icon: 'fas fa-sun', unlocked: false }
        ];
        
        // Бусты
        this.boosts = {
            click2x: false,
            auto5x: false
        };
        
        // Таймеры
        this.lastUpdate = Date.now();
        this.saveInterval = null;
        this.gameLoopInterval = null;
        this.autoClickerIndicator = null;
        
        // Глобальный топ
        this.leaderboard = [];
        this.leaderboardSort = 'prestige';
        
        // Загружаем игру
        this.loadGame();
        
        // Инициализируем
        this.init();
    }
    
    loadGame() {
        try {
            const saved = localStorage.getItem('spaceIncrementorSave');
            if (saved) {
                const data = JSON.parse(saved);
                
                console.log('📂 Загружаем сохранение...');
                
                // Восстанавливаем основные данные
                this.energy = data.energy || 0;
                this.totalEnergy = data.totalEnergy || 0;
                this.energyPerSecond = data.energyPerSecond || 0;
                this.totalClicks = data.totalClicks || 0;
                this.playTime = data.playTime || 0;
                this.startTime = data.startTime || Date.now();
                
                // Престиж
                this.prestigeLevel = data.prestigeLevel || 0;
                this.prestigePoints = data.prestigePoints || 0;
                this.lastPrestigeTime = data.lastPrestigeTime || Date.now();
                
                // Рассчитываем следующее время престижа
                const timeSinceLastPrestige = Date.now() - this.lastPrestigeTime;
                this.nextPrestigeTime = this.lastPrestigeTime + GAME_CONSTANTS.PRESTIGE_TIME;
                
                // Ивенты
                this.activeEvent = data.activeEvent || null;
                this.eventEndTime = data.eventEndTime || 0;
                this.nextEventTime = data.nextEventTime || (Date.now() + GAME_CONSTANTS.EVENT_INTERVAL);
                
                // Настройки
                this.settings = data.settings || this.settings;
                
                // Улучшения
                if (data.generators) {
                    this.generators = data.generators;
                }
                if (data.boosts) {
                    this.boosts = data.boosts;
                }
                
                // Проверяем ивенты
                if (this.activeEvent && Date.now() > this.eventEndTime) {
                    this.activeEvent = null;
                }
                
                // Пересчитываем производство
                this.calculateProduction();
                
                console.log('✅ Игра успешно загружена');
                this.showMessage('Прогресс загружен!', 'success');
            } else {
                console.log('🆕 Начинаем новую игру');
            }
        } catch (e) {
            console.error('❌ Ошибка загрузки:', e);
            this.showMessage('Ошибка загрузки, начата новая игра', 'error');
        }
    }
    
    saveGame() {
        try {
            const saveData = {
                // Основные данные
                energy: this.energy,
                totalEnergy: this.totalEnergy,
                energyPerSecond: this.energyPerSecond,
                totalClicks: this.totalClicks,
                playTime: this.playTime,
                startTime: this.startTime,
                lastSaveTime: Date.now(),
                
                // Престиж
                prestigeLevel: this.prestigeLevel,
                prestigePoints: this.prestigePoints,
                lastPrestigeTime: this.lastPrestigeTime,
                nextPrestigeTime: this.nextPrestigeTime,
                
                // Ивенты
                activeEvent: this.activeEvent,
                eventEndTime: this.eventEndTime,
                nextEventTime: this.nextEventTime,
                
                // Настройки
                settings: this.settings,
                
                // Улучшения
                generators: this.generators,
                boosts: this.boosts,
                
                // Версия
                version: '2.0',
                timestamp: Date.now()
            };
            
            localStorage.setItem('spaceIncrementorSave', JSON.stringify(saveData));
            
            // Обновляем глобальный топ
            this.updateGlobalLeaderboard();
            
            console.log('💾 Игра сохранена');
            
            return true;
        } catch (e) {
            console.error('❌ Ошибка сохранения:', e);
            return false;
        }
    }
    
    async updateGlobalLeaderboard() {
        try {
            const playerData = {
                username: this.settings.username,
                prestigeLevel: this.prestigeLevel,
                totalEnergy: this.totalEnergy,
                playTime: this.playTime,
                lastUpdated: Date.now()
            };
            
            // Сохраняем локально для тестирования
            let localLeaderboard = JSON.parse(localStorage.getItem('globalLeaderboard') || '[]');
            
            const existingIndex = localLeaderboard.findIndex(p => p.username === this.settings.username);
            if (existingIndex !== -1) {
                localLeaderboard[existingIndex] = playerData;
            } else {
                localLeaderboard.push(playerData);
            }
            
            // Сортируем по престижу и энергии
            localLeaderboard.sort((a, b) => {
                if (b.prestigeLevel !== a.prestigeLevel) {
                    return b.prestigeLevel - a.prestigeLevel;
                }
                return b.totalEnergy - a.totalEnergy;
            });
            
            // Ограничиваем топ 50 игроками
            localLeaderboard = localLeaderboard.slice(0, 50);
            
            localStorage.setItem('globalLeaderboard', JSON.stringify(localLeaderboard));
            
            // Для реального сервера (раскомментировать когда сервер будет готов):
            /*
            const response = await fetch(`${GAME_CONSTANTS.SERVER_URL}/update-leaderboard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(playerData)
            });
            
            if (response.ok) {
                console.log('✅ Топ обновлен на сервере');
            }
            */
            
        } catch (error) {
            console.error('❌ Ошибка обновления топа:', error);
        }
    }
    
    async loadGlobalLeaderboard() {
        try {
            // Загружаем из localStorage для тестирования
            let localLeaderboard = JSON.parse(localStorage.getItem('globalLeaderboard') || '[]');
            
            // Сортируем по выбранному критерию
            localLeaderboard.sort((a, b) => {
                switch (this.leaderboardSort) {
                    case 'prestige':
                        if (b.prestigeLevel !== a.prestigeLevel) {
                            return b.prestigeLevel - a.prestigeLevel;
                        }
                        return b.totalEnergy - a.totalEnergy;
                    case 'totalEnergy':
                        return b.totalEnergy - a.totalEnergy;
                    case 'playTime':
                        return b.playTime - a.playTime;
                    default:
                        return b.prestigeLevel - a.prestigeLevel;
                }
            });
            
            this.leaderboard = localLeaderboard;
            
            // Для реального сервера (раскомментировать когда сервер будет готов):
            /*
            const response = await fetch(`${GAME_CONSTANTS.SERVER_URL}/leaderboard`);
            if (response.ok) {
                this.leaderboard = await response.json();
            }
            */
            
            this.renderLeaderboard();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки топа:', error);
            this.leaderboard = [];
        }
    }
    
    init() {
        console.log('🎮 Инициализация интерфейса...');
        
        // Настраиваем обработчики
        this.setupEventListeners();
        
        // Запускаем игровой цикл
        this.startGameLoop();
        
        // Запускаем автосохранение
        this.startAutoSave();
        
        // Создаем индикатор авто-кликера
        this.createAutoClickerIndicator();
        
        // Загружаем глобальный топ
        this.loadGlobalLeaderboard();
        
        // Первый рендер
        this.render();
        
        console.log('✅ Игра запущена!');
    }
    
    setupEventListeners() {
        // Клик по ядру
        document.getElementById('core').addEventListener('click', (e) => this.handleClick(e));
        
        // Быстрые улучшения
        document.getElementById('boost-2x').addEventListener('click', () => this.buyBoost('click2x', 100));
        document.getElementById('boost-5x').addEventListener('click', () => this.buyBoost('auto5x', 500));
        
        // Вкладки улучшений и топа
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Вкладки топа
        document.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const sortBy = tab.dataset.sort;
                this.switchLeaderboardSort(sortBy);
            });
        });
        
        // Кнопка обновления топа
        document.getElementById('refresh-leaderboard').addEventListener('click', () => {
            this.loadGlobalLeaderboard();
            this.showMessage('Топ обновлен!', 'success');
        });
        
        // Массовые покупки
        document.getElementById('buy-10').addEventListener('click', () => this.buyMultiple(10));
        document.getElementById('buy-100').addEventListener('click', () => this.buyMultiple(100));
        document.getElementById('buy-max').addEventListener('click', () => this.buyMax());
        
        // Престиж
        document.getElementById('prestige-btn').addEventListener('click', () => this.prestige());
        
        // Настройки
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.querySelector('.close-modal').addEventListener('click', () => this.hideSettings());
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveGame();
            this.hideSettings();
        });
        
        // Настройки чекбоксы
        document.getElementById('auto-save').addEventListener('change', (e) => {
            this.settings.autoSave = e.target.checked;
            if (this.settings.autoSave) {
                this.startAutoSave();
            } else {
                this.stopAutoSave();
            }
        });
        
        document.getElementById('animations').addEventListener('change', (e) => {
            this.settings.animations = e.target.checked;
        });
        
        document.getElementById('notifications').addEventListener('change', (e) => {
            this.settings.notifications = e.target.checked;
        });
        
        document.getElementById('number-format').addEventListener('change', (e) => {
            this.settings.numberFormat = e.target.value;
            this.render();
        });
        
        // Имя пользователя
        document.getElementById('username-input').addEventListener('change', (e) => {
            this.settings.username = e.target.value.substring(0, 20);
            this.renderStats();
            this.saveGame();
        });
        
        // Импорт/экспорт
        document.getElementById('export-btn').addEventListener('click', () => this.exportSave());
        document.getElementById('import-btn').addEventListener('click', () => this.importSave());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        
        // Обработка кликов вне модального окна
        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('settings-modal')) {
                this.hideSettings();
            }
        });
    }
    
    startGameLoop() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }
        
        // Игровой цикл - обновляем логику каждые 100мс (10 FPS)
        this.gameLoopInterval = setInterval(() => {
            this.updateGameLogic();
        }, 100);
    }
    
    updateGameLogic() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000; // В секундах
        
        // Обновляем время игры
        this.playTime += deltaTime;
        
        // Автоматическая генерация энергии
        if (this.energyPerSecond > 0) {
            const energyGained = this.energyPerSecond * deltaTime;
            this.energy += energyGained;
            this.totalEnergy += energyGained;
            
            // Обновляем индикатор авто-кликера в реальном времени
            this.updateAutoClickerIndicator(energyGained, deltaTime);
            
            // Обновляем статистику каждые 200мс
            if (now - this.lastUpdate >= 200) {
                this.renderStats();
            }
        }
        
        // Обновляем ивенты
        this.updateEvents();
        
        // Обновляем таймеры каждую секунду
        if (now - this.lastUpdate >= 1000) {
            this.updateTimersDisplay();
        }
        
        this.lastUpdate = now;
    }
    
    updateEvents() {
        const now = Date.now();
        
        // Проверяем активный ивент
        if (this.activeEvent && now >= this.eventEndTime) {
            if (this.settings.notifications) {
                this.showMessage('Ивент завершен', 'info');
            }
            this.activeEvent = null;
        }
        
        // Запускаем новый ивент
        if (!this.activeEvent && now >= this.nextEventTime) {
            this.startEvent();
        }
    }
    
    updateTimersDisplay() {
        // Обновляем таймер престижа
        const prestigeTimeLeft = this.nextPrestigeTime - Date.now();
        const prestigeElement = document.getElementById('prestige-time-left');
        if (prestigeElement) {
            if (prestigeTimeLeft <= 0) {
                prestigeElement.textContent = "Готово!";
                prestigeElement.style.color = "#00ff9d";
            } else {
                prestigeElement.textContent = this.formatTime(Math.max(0, prestigeTimeLeft));
                prestigeElement.style.color = "";
            }
        }
        
        // Обновляем таймер ивента
        const eventElement = document.getElementById('next-event');
        if (eventElement) {
            if (this.activeEvent) {
                const eventTimeLeft = this.eventEndTime - Date.now();
                eventElement.textContent = this.formatTime(Math.max(0, eventTimeLeft));
                eventElement.style.color = "#00ff9d";
            } else {
                const nextEventTimeLeft = this.nextEventTime - Date.now();
                eventElement.textContent = this.formatTime(Math.max(0, nextEventTimeLeft));
                eventElement.style.color = "";
            }
        }
        
        // Обновляем время игры
        const playtimeElement = document.getElementById('playtime');
        if (playtimeElement) {
            playtimeElement.textContent = this.formatTime(this.playTime * 1000);
        }
        
        // Обновляем прогресс престижа
        this.updatePrestigeProgress();
    }
    
    updatePrestigeProgress() {
        const required = this.getPrestigeRequirement();
        const progress = Math.min(this.totalEnergy / required, 1);
        const progressPercent = Math.floor(progress * 100);
        
        // Обновляем прогресс-бар
        const progressBar = document.getElementById('prestige-progress-bar');
        const progressText = document.getElementById('prestige-progress-text');
        const progressValue = document.getElementById('prestige-progress-value');
        
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${progressPercent}%`;
            if (progressPercent >= 100) {
                progressText.style.color = "#00ff9d";
            } else {
                progressText.style.color = "";
            }
        }
        
        if (progressValue) {
            progressValue.textContent = `${this.formatNumber(this.totalEnergy)} / ${this.formatNumber(required)}`;
        }
        
        // Обновляем кнопку престижа
        this.updatePrestigeButton();
    }
    
    updatePrestigeButton() {
        const prestigeBtn = document.getElementById('prestige-btn');
        if (!prestigeBtn) return;
        
        const required = this.getPrestigeRequirement();
        const timeLeft = this.nextPrestigeTime - Date.now();
        const pointsReward = Math.floor(this.totalEnergy / required);
        
        if (this.canPrestige()) {
            prestigeBtn.disabled = false;
            prestigeBtn.innerHTML = `
                <i class="fas fa-sync-alt"></i>
                <span>Переродиться</span>
                <small>(+${pointsReward} очков)</small>
            `;
            prestigeBtn.style.background = "linear-gradient(45deg, #ffcc00, #ff9900)";
        } else {
            prestigeBtn.disabled = true;
            
            if (this.totalEnergy < required) {
                const needed = required - this.totalEnergy;
                const progress = Math.min(this.totalEnergy / required, 1) * 100;
                prestigeBtn.innerHTML = `
                    <i class="fas fa-chart-line"></i>
                    <span>Прогресс: ${Math.floor(progress)}%</span>
                    <small>Нужно: ${this.formatNumber(needed)}</small>
                `;
            } else {
                prestigeBtn.innerHTML = `
                    <i class="fas fa-clock"></i>
                    <span>Ожидание</span>
                    <small>${this.formatTime(timeLeft)}</small>
                `;
            }
            prestigeBtn.style.background = "linear-gradient(45deg, #3a3a3a, #4a4a4a)";
        }
    }
    
    createAutoClickerIndicator() {
        this.autoClickerIndicator = document.createElement('div');
        this.autoClickerIndicator.className = 'auto-clicker-indicator';
        this.autoClickerIndicator.innerHTML = `
            <h4><i class="fas fa-bolt"></i> Авто-кликер</h4>
            <div class="auto-clicker-value">+0/сек</div>
        `;
        document.body.appendChild(this.autoClickerIndicator);
        this.updateAutoClickerIndicator();
    }
    
    updateAutoClickerIndicator(energyGained = 0, deltaTime = 1) {
        if (!this.autoClickerIndicator) return;
        
        const valueElement = this.autoClickerIndicator.querySelector('.auto-clicker-value');
        if (valueElement) {
            // Показываем текущее производство
            valueElement.textContent = `+${this.formatNumber(this.energyPerSecond)}/сек`;
            
            // Анимация при получении энергии
            if (energyGained > 0 && deltaTime < 0.2) {
                valueElement.style.color = '#00ff9d';
                valueElement.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    valueElement.style.color = '';
                    valueElement.style.transform = '';
                }, 200);
            }
        }
    }
    
    startAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        
        if (this.settings.autoSave) {
            this.saveInterval = setInterval(() => {
                this.saveGame();
            }, GAME_CONSTANTS.SAVE_INTERVAL);
        }
    }
    
    stopAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }
    
    handleClick(event) {
        // Рассчитываем силу клика
        let power = GAME_CONSTANTS.BASE_POWER;
        let prestigeBonus = 1 + (this.prestigeLevel * 0.5);
        
        power *= prestigeBonus;
        
        if (this.boosts.click2x) {
            power *= 2;
        }
        
        if (this.activeEvent && this.activeEvent.type === 'click') {
            power *= this.activeEvent.multiplier;
        }
        
        // Добавляем энергию
        this.energy += power;
        this.totalEnergy += power;
        this.totalClicks++;
        
        // Визуальная обратная связь
        this.showVisualFeedback('energy-stat', '+ ' + this.formatNumber(power));
        this.showVisualFeedback('total-energy-stat', 'Всего: ' + this.formatNumber(this.totalEnergy));
        
        // Анимация клика
        if (this.settings.animations) {
            this.createClickEffect(event, power);
        }
        
        // Проверяем разблокировки
        this.checkUnlocks();
        
        // Немедленно обновляем отображение
        this.renderStats();
    }
    
    showVisualFeedback(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('updated');
            const originalHTML = element.innerHTML;
            
            // Добавляем временный текст
            const feedback = document.createElement('div');
            feedback.className = 'visual-feedback';
            feedback.textContent = text;
            feedback.style.color = '#00ff9d';
            feedback.style.fontSize = '0.8rem';
            feedback.style.textAlign = 'right';
            feedback.style.marginTop = '5px';
            
            element.appendChild(feedback);
            
            // Убираем через 1 секунду
            setTimeout(() => {
                element.classList.remove('updated');
                feedback.remove();
            }, 1000);
        }
    }
    
    createClickEffect(event, power) {
        const core = document.getElementById('core');
        const rect = core.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Создаем эффект клика
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = `+${this.formatNumber(power)}`;
        effect.style.position = 'absolute';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        effect.style.color = '#00ff9d';
        effect.style.fontWeight = 'bold';
        effect.style.fontSize = '1.2rem';
        effect.style.textShadow = '0 0 10px #00ff9d';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '100';
        effect.style.transform = 'translate(-50%, -50%)';
        
        core.appendChild(effect);
        
        // Удаляем через 1 секунду
        setTimeout(() => effect.remove(), 1000);
    }
    
    buyGenerator(id, amount = 1) {
        const generator = this.generators.find(g => g.id === id);
        if (!generator || !generator.unlocked) {
            this.showMessage('Генератор не разблокирован!', 'error');
            return 0;
        }
        
        let bought = 0;
        
        for (let i = 0; i < amount; i++) {
            const cost = this.getGeneratorCost(generator);
            if (this.energy >= cost) {
                this.energy -= cost;
                generator.owned++;
                generator.cost = this.getGeneratorCost(generator);
                bought++;
                
                // Визуальная обратная связь
                this.showPurchaseFeedback(generator.name);
            } else {
                break;
            }
        }
        
        if (bought > 0) {
            this.calculateProduction();
            this.checkUnlocks();
            
            if (this.settings.notifications) {
                this.showMessage(`Куплено ${bought} ${generator.name}`, 'success');
            }
            
            // Немедленно обновляем отображение
            this.renderStats();
            this.renderGenerators();
            
            // Обновляем индикатор авто-кликера
            this.updateAutoClickerIndicator();
        }
        
        return bought;
    }
    
    showPurchaseFeedback(generatorName) {
        // Создаем плавающее сообщение о покупке
        const feedback = document.createElement('div');
        feedback.className = 'click-effect';
        feedback.textContent = `✓ ${generatorName}`;
        feedback.style.position = 'fixed';
        feedback.style.top = '50%';
        feedback.style.left = '50%';
        feedback.style.color = '#00ff9d';
        feedback.style.fontWeight = 'bold';
        feedback.style.fontSize = '1.5rem';
        feedback.style.textShadow = '0 0 20px #00ff9d';
        feedback.style.pointerEvents = 'none';
        feedback.style.zIndex = '1000';
        feedback.style.transform = 'translate(-50%, -50%)';
        
        document.body.appendChild(feedback);
        
        // Анимация
        let opacity = 1;
        let scale = 1;
        
        const animate = () => {
            opacity -= 0.02;
            scale += 0.01;
            
            feedback.style.opacity = opacity;
            feedback.style.transform = `translate(-50%, -50%) scale(${scale})`;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                feedback.remove();
            }
        };
        
        animate();
    }
    
    getGeneratorCost(generator) {
        const baseMultiplier = Math.pow(GAME_CONSTANTS.PRICE_INCREASE, generator.owned);
        const prestigeMultiplier = Math.pow(GAME_CONSTANTS.PRESTIGE_MULTIPLIER, this.prestigeLevel);
        return Math.floor(generator.baseCost * baseMultiplier * prestigeMultiplier);
    }
    
    buyMultiple(amount) {
        let totalBought = 0;
        
        // Покупаем самые дешевые генераторы
        while (totalBought < amount) {
            const cheapest = this.getCheapestGenerator();
            if (!cheapest || this.energy < cheapest.cost) break;
            
            if (this.buyGenerator(cheapest.id, 1) > 0) {
                totalBought++;
            } else {
                break;
            }
        }
        
        if (totalBought > 0) {
            this.renderStats();
            this.renderGenerators();
        }
        
        return totalBought;
    }
    
    buyMax() {
        let bought = 0;
        
        while (true) {
            const cheapest = this.getCheapestGenerator();
            if (!cheapest || this.energy < cheapest.cost) break;
            
            if (this.buyGenerator(cheapest.id, 1) > 0) {
                bought++;
            } else {
                break;
            }
        }
        
        if (bought > 0) {
            if (this.settings.notifications) {
                this.showMessage(`Куплено ${bought} генераторов`, 'success');
            }
            this.renderStats();
            this.renderGenerators();
        }
        
        return bought;
    }
    
    getCheapestGenerator() {
        let cheapest = null;
        let minCost = Infinity;
        
        for (const gen of this.generators) {
            if (gen.unlocked && gen.cost < minCost) {
                minCost = gen.cost;
                cheapest = gen;
            }
        }
        
        return cheapest;
    }
    
    buyBoost(type, cost) {
        if (this.boosts[type]) {
            this.showMessage('Буст уже куплен!', 'error');
            return false;
        }
        
        if (this.energy < cost) {
            this.showMessage('Недостаточно энергии!', 'error');
            return false;
        }
        
        this.energy -= cost;
        this.boosts[type] = true;
        
        this.calculateProduction();
        
        if (this.settings.notifications) {
            this.showMessage('Буст активирован!', 'success');
        }
        
        this.render();
        
        return true;
    }
    
    calculateProduction() {
        let eps = 0;
        
        // Производство генераторов
        for (const gen of this.generators) {
            eps += gen.production * gen.owned;
        }
        
        // Множители (только бонус престижа)
        let multiplier = 1 + (this.prestigeLevel * 0.5);
        
        // Буст авто
        if (this.boosts.auto5x) {
            multiplier *= 5;
        }
        
        // Ивент
        if (this.activeEvent && this.activeEvent.type === 'production') {
            multiplier *= this.activeEvent.multiplier;
        }
        
        this.energyPerSecond = eps * multiplier;
        return this.energyPerSecond;
    }
    
    checkUnlocks() {
        // Разблокировка генераторов
        const unlockPoints = [50, 200, 1000, 5000, 25000];
        for (let i = 0; i < unlockPoints.length; i++) {
            if (this.totalEnergy >= unlockPoints[i] && i + 1 < this.generators.length) {
                if (!this.generators[i + 1].unlocked) {
                    this.generators[i + 1].unlocked = true;
                    if (this.settings.notifications) {
                        this.showMessage(`Разблокирован ${this.generators[i + 1].name}!`, 'success');
                    }
                }
            }
        }
        
        // Пересчет стоимостей
        for (const gen of this.generators) {
            gen.cost = this.getGeneratorCost(gen);
        }
    }
    
    canPrestige() {
        const required = this.getPrestigeRequirement();
        const now = Date.now();
        
        return this.totalEnergy >= required && now >= this.nextPrestigeTime;
    }
    
    getPrestigeRequirement() {
        // Увеличиваем требование с каждым престижем
        return GAME_CONSTANTS.PRESTIGE_BASE * Math.pow(GAME_CONSTANTS.PRESTIGE_MULTIPLIER, this.prestigeLevel);
    }
    
    prestige() {
        if (!this.canPrestige()) {
            this.showMessage('Нельзя выполнить престиж!', 'error');
            return false;
        }
        
        const required = this.getPrestigeRequirement();
        const points = Math.floor(this.totalEnergy / required);
        
        // Обновляем престиж
        this.prestigeLevel++;
        this.prestigePoints += points;
        
        // Сбрасываем прогресс
        this.energy = 0;
        this.totalEnergy = 0;
        this.energyPerSecond = 0;
        this.totalClicks = 0;
        
        for (const gen of this.generators) {
            gen.owned = 0;
            gen.cost = this.getGeneratorCost(gen);
        }
        
        this.boosts.click2x = false;
        this.boosts.auto5x = false;
        
        // Устанавливаем время следующего престижа
        this.lastPrestigeTime = Date.now();
        this.nextPrestigeTime = Date.now() + GAME_CONSTANTS.PRESTIGE_TIME;
        
        // Разблокируем первый уровень улучшений
        this.generators[0].unlocked = true;
        
        // Пересчитываем производство
        this.calculateProduction();
        
        // Сохраняем и обновляем топ
        this.saveGame();
        
        if (this.settings.notifications) {
            this.showMessage(`Престиж ${this.prestigeLevel}! +${points} очков`, 'success');
        }
        
        this.render();
        
        return true;
    }
    
    startEvent() {
        const events = [
            {
                type: 'production',
                name: 'Энергетический всплеск',
                description: 'Все генераторы работают в 2 раза быстрее',
                multiplier: 2,
                icon: 'fas fa-bolt'
            },
            {
                type: 'click',
                name: 'Квантовый ускоритель',
                description: 'Сила клика увеличена в 3 раза',
                multiplier: 3,
                icon: 'fas fa-mouse-pointer'
            },
            {
                type: 'bonus',
                name: 'Звездный дождь',
                description: '+100% ко всей энергии',
                multiplier: 2,
                icon: 'fas fa-star'
            }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        this.activeEvent = event;
        this.eventEndTime = Date.now() + GAME_CONSTANTS.EVENT_DURATION;
        this.nextEventTime = Date.now() + GAME_CONSTANTS.EVENT_INTERVAL;
        
        if (this.settings.notifications) {
            this.showMessage(`Начат ивент: ${event.name}`, 'success');
        }
        
        this.updateTimersDisplay();
    }
    
    switchTab(tabName) {
        // Убираем активные классы
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.upgrades-list').forEach(list => {
            list.classList.remove('active');
        });
        
        // Активируем выбранную вкладку
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(`${tabName}-list`);
        
        if (tabBtn) tabBtn.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
        
        // Если переключились на топ, обновляем его
        if (tabName === 'leaderboard') {
            this.loadGlobalLeaderboard();
        }
    }
    
    switchLeaderboardSort(sortBy) {
        this.leaderboardSort = sortBy;
        
        // Убираем активные классы
        document.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Активируем выбранную вкладку
        const tabBtn = document.querySelector(`[data-sort="${sortBy}"]`);
        if (tabBtn) tabBtn.classList.add('active');
        
        // Обновляем топ
        this.loadGlobalLeaderboard();
    }
    
    render() {
        this.renderStats();
        this.renderGenerators();
        this.updatePrestigeProgress();
    }
    
    renderStats() {
        try {
            // Основная статистика
            document.getElementById('energy').textContent = this.formatNumber(this.energy);
            document.getElementById('total-energy').textContent = this.formatNumber(this.totalEnergy);
            document.getElementById('eps').textContent = this.formatNumber(this.energyPerSecond) + "/сек";
            document.getElementById('prestige').textContent = this.prestigeLevel;
            document.getElementById('prestige-points').textContent = this.prestigePoints;
            document.getElementById('player-name-display').textContent = this.settings.username;
            document.getElementById('total-clicks').textContent = this.totalClicks;
            document.getElementById('player-energy').textContent = this.formatNumber(this.totalEnergy);
            
            // Рассчитываем силу клика
            let clickPower = GAME_CONSTANTS.BASE_POWER;
            clickPower *= 1 + (this.prestigeLevel * 0.5);
            if (this.boosts.click2x) clickPower *= 2;
            if (this.activeEvent && this.activeEvent.type === 'click') clickPower *= this.activeEvent.multiplier;
            
            document.getElementById('click-power-value').textContent = this.formatNumber(clickPower);
            
            // Быстрые улучшения
            const boost2x = document.getElementById('boost-2x');
            const boost5x = document.getElementById('boost-5x');
            
            if (boost2x) {
                boost2x.disabled = this.energy < 100 || this.boosts.click2x;
                if (this.boosts.click2x) {
                    boost2x.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <span>Куплено</span>
                        <small>Активно</small>
                    `;
                    boost2x.classList.add('active');
                } else {
                    boost2x.innerHTML = `
                        <i class="fas fa-expand-alt"></i>
                        <span>x2 Клик</span>
                        <small>100 энергии</small>
                    `;
                    boost2x.classList.remove('active');
                }
            }
            
            if (boost5x) {
                boost5x.disabled = this.energy < 500 || this.boosts.auto5x;
                if (this.boosts.auto5x) {
                    boost5x.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <span>Куплено</span>
                        <small>Активно</small>
                    `;
                    boost5x.classList.add('active');
                } else {
                    boost5x.innerHTML = `
                        <i class="fas fa-rocket"></i>
                        <span>x5 Авто</span>
                        <small>500 энергии</small>
                    `;
                    boost5x.classList.remove('active');
                }
            }
            
            // Массовые покупки
            const cheapestGen = this.getCheapestGenerator();
            document.getElementById('buy-10').disabled = !cheapestGen || this.energy < cheapestGen.cost;
            document.getElementById('buy-100').disabled = !cheapestGen || this.energy < cheapestGen.cost;
            document.getElementById('buy-max').disabled = !cheapestGen || this.energy < cheapestGen.cost;
            
            // Обновляем информацию о ивенте
            const eventInfo = document.getElementById('active-event-info');
            if (eventInfo) {
                if (this.activeEvent) {
                    const timeLeft = this.eventEndTime - Date.now();
                    eventInfo.innerHTML = `
                        <p><strong>${this.activeEvent.name}</strong>: ${this.activeEvent.description}</p>
                        <p>Осталось: ${this.formatTime(timeLeft)}</p>
                    `;
                } else {
                    eventInfo.innerHTML = '<p>Нет активных событий</p>';
                }
            }
            
        } catch (e) {
            console.error('❌ Ошибка рендера статистики:', e);
        }
    }
    
    renderGenerators() {
        const container = document.getElementById('generators-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const gen of this.generators) {
            if (!gen.unlocked) continue;
            
            const canAfford = this.energy >= gen.cost;
            const totalProduction = gen.production * gen.owned;
            
            const html = `
                <div class="upgrade-item">
                    <div class="upgrade-header">
                        <div class="upgrade-icon">
                            <i class="${gen.icon}"></i>
                        </div>
                        <div class="upgrade-info">
                            <h4>${gen.name}</h4>
                            <p>${gen.production.toFixed(1)} энергии/сек</p>
                        </div>
                    </div>
                    <div class="upgrade-stats">
                        <div class="upgrade-stat">
                            <span class="label">Куплено</span>
                            <span class="value">${gen.owned}</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="label">Всего</span>
                            <span class="value">${this.formatNumber(totalProduction)}/сек</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="label">Стоимость</span>
                            <span class="value">${this.formatNumber(gen.cost)}</span>
                        </div>
                    </div>
                    <button class="upgrade-btn" onclick="game.buyGenerator(${gen.id})" ${canAfford ? '' : 'disabled'}>
                        <i class="fas fa-shopping-cart"></i>
                        ${canAfford ? 'Купить 1' : 'Не хватает'}
                    </button>
                </div>
            `;
            
            container.innerHTML += html;
        }
    }
    
    renderLeaderboard() {
        const container = document.getElementById('leaderboard-body');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.leaderboard.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px;">
                        <i class="fas fa-users" style="font-size: 2rem; color: #00b8ff; margin-bottom: 10px; display: block;"></i>
                        <p>Топ игроков пуст</p>
                        <p style="color: #a0a0ff; font-size: 0.9rem;">Будьте первым!</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Находим позицию текущего игрока
        const playerIndex = this.leaderboard.findIndex(p => p.username === this.settings.username);
        if (playerIndex !== -1) {
            document.getElementById('player-rank').textContent = playerIndex + 1;
        } else {
            document.getElementById('player-rank').textContent = '-';
        }
        
        // Отображаем топ 20 игроков
        this.leaderboard.slice(0, 20).forEach((player, index) => {
            const row = document.createElement('tr');
            
            // Медали для топ-3
            let medal = '';
            let rankClass = '';
            if (index === 0) {
                medal = '🥇';
                rankClass = 'rank-1';
            } else if (index === 1) {
                medal = '🥈';
                rankClass = 'rank-2';
            } else if (index === 2) {
                medal = '🥉';
                rankClass = 'rank-3';
            }
            
            // Подсвечиваем текущего игрока
            if (player.username === this.settings.username) {
                row.style.background = 'rgba(0, 255, 157, 0.1)';
                row.style.borderLeft = '3px solid #00ff9d';
            }
            
            row.className = rankClass;
            row.innerHTML = `
                <td>${index + 1} ${medal}</td>
                <td><strong>${player.username}</strong></td>
                <td>${player.prestigeLevel}</td>
                <td>${this.formatNumber(player.totalEnergy)}</td>
                <td>${this.formatTime(player.playTime * 1000)}</td>
            `;
            
            container.appendChild(row);
        });
    }
    
    showSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('active');
            
            // Заполняем значения
            document.getElementById('username-input').value = this.settings.username;
            document.getElementById('auto-save').checked = this.settings.autoSave;
            document.getElementById('animations').checked = this.settings.animations;
            document.getElementById('notifications').checked = this.settings.notifications;
            document.getElementById('number-format').value = this.settings.numberFormat;
        }
    }
    
    hideSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    exportSave() {
        try {
            const saveData = localStorage.getItem('spaceIncrementorSave');
            if (!saveData) {
                this.showMessage('Нет данных для экспорта', 'error');
                return;
            }
            
            const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(saveData)}`;
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `space-incrementor-save-${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            
            this.showMessage('Сохранение экспортировано!', 'success');
        } catch (e) {
            console.error('❌ Ошибка экспорта:', e);
            this.showMessage('Ошибка экспорта', 'error');
        }
    }
    
    importSave() {
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
                    
                    if (saveData.version) {
                        localStorage.setItem('spaceIncrementorSave', JSON.stringify(saveData));
                        location.reload();
                    } else {
                        this.showMessage('Неверный формат сохранения', 'error');
                    }
                } catch (error) {
                    console.error('❌ Ошибка импорта:', error);
                    this.showMessage('Ошибка импорта сохранения', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    resetGame() {
        if (confirm('ВЫ УВЕРЕНЫ?\nВесь прогресс будет безвозвратно удален!')) {
            localStorage.removeItem('spaceIncrementorSave');
            location.reload();
        }
    }
    
    formatNumber(num) {
        if (this.settings.numberFormat === 'full') {
            return Math.floor(num).toLocaleString();
        }
        
        // Короткий формат
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return Math.floor(num).toLocaleString();
    }
    
    formatTime(ms) {
        if (ms < 0) ms = 0;
        
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    showMessage(text, type = 'info') {
        if (!this.settings.notifications) return;
        
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
                <div class="notification-title">${type === 'success' ? 'Успех' : type === 'warning' ? 'Внимание' : 'Ошибка'}</div>
                <div class="notification-message">${text}</div>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Автоудаление
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// ===== ЗАПУСК ИГРЫ =====
let game;

window.addEventListener('load', () => {
    console.log('🎮 Запускаем игру...');
    
    try {
        game = new SpaceIncrementor();
        
        // Делаем методы доступными глобально
        window.game = {
            buyGenerator: (id) => {
                if (game.buyGenerator(id) > 0) {
                    game.saveGame();
                }
            },
            buyBoost: (type, cost) => {
                if (game.buyBoost(type, cost)) {
                    game.saveGame();
                }
            },
            buyMultiple: (amount) => {
                game.buyMultiple(amount);
                game.saveGame();
            },
            buyMax: () => {
                game.buyMax();
                game.saveGame();
            },
            prestige: () => {
                if (game.prestige()) {
                    game.saveGame();
                }
            },
            save: () => {
                game.saveGame();
            }
        };
        
        // Сохранение при закрытии
        window.addEventListener('beforeunload', () => {
            console.log('💾 Сохранение перед закрытием...');
            game.saveGame();
        });
        
        console.log('✅ Игра успешно запущена!');
    } catch (e) {
        console.error('❌ Критическая ошибка при запуске:', e);
        alert('Ошибка при запуске игры. Проверьте консоль для подробностей.');
    }
});
