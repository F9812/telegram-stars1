// Игровое состояние
class GameState {
    constructor() {
        this.energy = 0;
        this.totalEnergy = 0;
        this.energyPerClick = 1;
        this.energyPerSecond = 0;
        this.clickMultiplier = 1;
        this.prestigeLevel = 0;
        this.prestigePoints = 0;
        this.prestigeMultiplier = 1;
        
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
                icon: "fas fa-solar-panel"
            },
            {
                id: 2,
                name: "Ветрогенератор",
                description: "Стабильный источник энергии",
                baseCost: 50,
                cost: 50,
                owned: 0,
                baseProduction: 0.5,
                production: 0.5,
                icon: "fas fa-wind"
            },
            {
                id: 3,
                name: "Гидроэлектростанция",
                description: "Мощная генерация",
                baseCost: 200,
                cost: 200,
                owned: 0,
                baseProduction: 2,
                production: 2,
                icon: "fas fa-water"
            },
            {
                id: 4,
                name: "Ядерный реактор",
                description: "Высокая эффективность",
                baseCost: 1000,
                cost: 1000,
                owned: 0,
                baseProduction: 10,
                production: 10,
                icon: "fas fa-atom"
            },
            {
                id: 5,
                name: "Термоядерный синтез",
                description: "Передовые технологии",
                baseCost: 5000,
                cost: 5000,
                owned: 0,
                baseProduction: 50,
                production: 50,
                icon: "fas fa-fire"
            },
            {
                id: 6,
                name: "Дайсонная сфера",
                description: "Энергия звезды",
                baseCost: 25000,
                cost: 25000,
                owned: 0,
                baseProduction: 200,
                production: 200,
                icon: "fas fa-sun"
            }
        ];
        
        this.multipliers = [
            {
                id: 1,
                name: "Энергоэффективность I",
                description: "+10% к генерации",
                baseCost: 100,
                cost: 100,
                owned: 0,
                multiplier: 1.1,
                icon: "fas fa-bolt"
            },
            {
                id: 2,
                name: "Оптимизация сети",
                description: "+25% к генерации",
                baseCost: 500,
                cost: 500,
                owned: 0,
                multiplier: 1.25,
                icon: "fas fa-network-wired"
            },
            {
                id: 3,
                name: "Квантовый усилитель",
                description: "+50% к генерации",
                baseCost: 2500,
                cost: 2500,
                owned: 0,
                multiplier: 1.5,
                icon: "fas fa-microchip"
            },
            {
                id: 4,
                name: "Сингулярность",
                description: "x2 ко всей генерации",
                baseCost: 10000,
                cost: 10000,
                owned: 0,
                multiplier: 2,
                icon: "fas fa-infinity"
            }
        ];
        
        this.achievements = [
            {
                id: 1,
                name: "Первая энергия",
                description: "Заработайте 100 энергии",
                unlocked: false,
                target: 100,
                icon: "fas fa-star",
                bonus: "Начальный множитель x1.1"
            },
            {
                id: 2,
                name: "Энергетик",
                description: "Заработайте 1,000 энергии",
                unlocked: false,
                target: 1000,
                icon: "fas fa-medal",
                bonus: "Начальный множитель x1.2"
            },
            {
                id: 3,
                name: "Магнат энергии",
                description: "Заработайте 10,000 энергии",
                unlocked: false,
                target: 10000,
                icon: "fas fa-crown",
                bonus: "Начальный множитель x1.5"
            },
            {
                id: 4,
                name: "Автоматизация",
                description: "Купите 10 генераторов",
                unlocked: false,
                target: 10,
                icon: "fas fa-robot",
                bonus: "+10% к авто-генерации"
            },
            {
                id: 5,
                name: "Индустрия",
                description: "Купите 50 генераторов",
                unlocked: false,
                target: 50,
                icon: "fas fa-industry",
                bonus: "+25% к авто-генерации"
            },
            {
                id: 6,
                name: "Престиж",
                description: "Выполните первый престиж",
                unlocked: false,
                target: 1,
                icon: "fas fa-infinity",
                bonus: "Начальный множитель x2"
            }
        ];
        
        this.upgrades = {
            doubleClick: false,
            tripleClick: false
        };
    }
    
    calculateEPS() {
        let eps = 0;
        this.generators.forEach(gen => {
            eps += gen.production * gen.owned;
        });
        
        // Применяем множители
        let multiplier = this.prestigeMultiplier;
        this.multipliers.forEach(mul => {
            if (mul.owned) {
                multiplier *= Math.pow(mul.multiplier, mul.owned);
            }
        });
        
        // Применяем бонусы достижений
        if (this.achievements[3].unlocked) multiplier *= 1.1;
        if (this.achievements[4].unlocked) multiplier *= 1.25;
        
        this.energyPerSecond = eps * multiplier;
        return this.energyPerSecond;
    }
    
    calculateGeneratorCost(generator) {
        return Math.floor(generator.baseCost * Math.pow(1.15, generator.owned));
    }
    
    calculateMultiplierCost(multiplier) {
        return Math.floor(multiplier.baseCost * Math.pow(1.5, multiplier.owned));
    }
}

// Игровой менеджер
class GameManager {
    constructor() {
        this.game = new GameState();
        this.lastUpdate = Date.now();
        this.saveInterval = null;
        this.saveTimer = 10;
        this.clickParticles = [];
        
        this.init();
    }
    
    init() {
        this.loadGame();
        this.setupEventListeners();
        this.render();
        this.startGameLoop();
        this.startSaveTimer();
    }
    
    setupEventListeners() {
        // Клик по ядру
        document.getElementById('core').addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Улучшения кликера
        document.getElementById('double-click').addEventListener('click', () => {
            this.buyClickUpgrade('doubleClick', 100);
        });
        
        document.getElementById('triple-click').addEventListener('click', () => {
            this.buyClickUpgrade('tripleClick', 500);
        });
        
        // Табы
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Престиж
        document.getElementById('prestige-button').addEventListener('click', () => {
            this.prestige();
        });
        
        // Кнопки управления
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveGame();
            this.showMessage('Игра сохранена!', 'success');
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            if (confirm('Вы уверены? Весь прогресс будет потерян!')) {
                this.resetGame();
            }
        });
        
        document.getElementById('help-btn').addEventListener('click', () => {
            this.showHelp();
        });
        
        // Закрытие модального окна
        document.querySelector('.close-btn').addEventListener('click', () => {
            this.hideHelp();
        });
        
        // Клик вне модального окна
        document.getElementById('help-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('help-modal')) {
                this.hideHelp();
            }
        });
    }
    
    handleClick(event) {
        // Добавляем энергию
        let clickValue = this.game.energyPerClick * this.game.clickMultiplier;
        
        if (this.game.upgrades.doubleClick) clickValue *= 2;
        if (this.game.upgrades.tripleClick) clickValue *= 3;
        
        // Применяем престиж множитель
        clickValue *= this.game.prestigeMultiplier;
        
        this.game.energy += clickValue;
        this.game.totalEnergy += clickValue;
        
        // Создаем частицу
        this.createParticle(event);
        
        // Обновляем отображение
        this.updateAchievements();
        this.render();
        
        // Визуальная обратная связь
        this.showClickEffect(clickValue);
    }
    
    createParticle(event) {
        const core = document.getElementById('core');
        const rect = core.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        const particlesContainer = document.getElementById('particles');
        particlesContainer.appendChild(particle);
        
        // Анимация
        setTimeout(() => {
            particle.style.transform = `translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px)`;
            particle.style.opacity = '0';
        }, 10);
        
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }
    
    showClickEffect(value) {
        const core = document.getElementById('core');
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = `+${Math.floor(value)}`;
        effect.style.position = 'absolute';
        effect.style.color = '#00ff9d';
        effect.style.fontWeight = 'bold';
        effect.style.fontSize = '1.2rem';
        effect.style.textShadow = '0 0 10px #00ff9d';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '100';
        
        core.appendChild(effect);
        
        // Анимация
        const startX = 100;
        const startY = 100;
        effect.style.left = `${startX}px`;
        effect.style.top = `${startY}px`;
        
        let opacity = 1;
        let y = startY;
        
        const animate = () => {
            opacity -= 0.02;
            y -= 2;
            
            effect.style.opacity = opacity;
            effect.style.top = `${y}px`;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                effect.remove();
            }
        };
        
        animate();
    }
    
    buyGenerator(generatorId) {
        const generator = this.game.generators.find(g => g.id === generatorId);
        if (!generator || this.game.energy < generator.cost) return false;
        
        this.game.energy -= generator.cost;
        generator.owned++;
        generator.cost = this.game.calculateGeneratorCost(generator);
        
        this.updateAchievements();
        this.render();
        this.showMessage(`${generator.name} куплен!`, 'success');
        
        return true;
    }
    
    buyMultiplier(multiplierId) {
        const multiplier = this.game.multipliers.find(m => m.id === multiplierId);
        if (!multiplier || this.game.energy < multiplier.cost) return false;
        
        this.game.energy -= multiplier.cost;
        multiplier.owned++;
        multiplier.cost = this.game.calculateMultiplierCost(multiplier);
        
        // Пересчитываем производство генераторов
        this.game.generators.forEach(gen => {
            gen.production = gen.baseProduction * Math.pow(multiplier.multiplier, multiplier.owned);
        });
        
        this.render();
        this.showMessage(`${multiplier.name} куплен!`, 'success');
        
        return true;
    }
    
    buyClickUpgrade(type, cost) {
        if (this.game.energy < cost || this.game.upgrades[type]) return false;
        
        this.game.energy -= cost;
        this.game.upgrades[type] = true;
        
        this.render();
        this.showMessage('Улучшение куплено!', 'success');
        
        return true;
    }
    
    prestige() {
        const requiredEnergy = 1000000;
        if (this.game.totalEnergy < requiredEnergy) return false;
        
        // Вычисляем очки престижа
        const points = Math.floor(this.game.totalEnergy / requiredEnergy);
        
        // Сохраняем престиж
        this.game.prestigeLevel++;
        this.game.prestigePoints += points;
        this.game.prestigeMultiplier = 1 + (this.game.prestigeLevel * 0.5); // +50% за уровень
        
        // Сбрасываем прогресс
        this.game.energy = 0;
        this.game.totalEnergy = 0;
        this.game.energyPerClick = 1;
        this.game.clickMultiplier = 1;
        
        this.game.generators.forEach(gen => {
            gen.owned = 0;
            gen.cost = gen.baseCost;
            gen.production = gen.baseProduction;
        });
        
        this.game.multipliers.forEach(mul => {
            mul.owned = 0;
            mul.cost = mul.baseCost;
        });
        
        this.game.upgrades.doubleClick = false;
        this.game.upgrades.tripleClick = false;
        
        // Разблокируем достижение
        this.game.achievements[5].unlocked = true;
        
        this.showMessage(`Престиж ${this.game.prestigeLevel} выполнен! +${points} очков`, 'warning');
        this.render();
        this.saveGame();
        
        return true;
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
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }
    
    updateAchievements() {
        let totalGenerators = 0;
        this.game.generators.forEach(gen => {
            totalGenerators += gen.owned;
        });
        
        // Проверяем достижения
        this.game.achievements[0].unlocked = this.game.totalEnergy >= 100;
        this.game.achievements[1].unlocked = this.game.totalEnergy >= 1000;
        this.game.achievements[2].unlocked = this.game.totalEnergy >= 10000;
        this.game.achievements[3].unlocked = totalGenerators >= 10;
        this.game.achievements[4].unlocked = totalGenerators >= 50;
    }
    
    render() {
        // Обновляем основные показатели
        document.getElementById('energy').textContent = this.formatNumber(this.game.energy);
        document.getElementById('eps').textContent = this.formatNumber(this.game.calculateEPS());
        document.getElementById('click-power').textContent = this.game.energyPerClick;
        
        // Значения в кликере
        let clickValue = this.game.energyPerClick * this.game.clickMultiplier;
        if (this.game.upgrades.doubleClick) clickValue *= 2;
        if (this.game.upgrades.tripleClick) clickValue *= 3;
        clickValue *= this.game.prestigeMultiplier;
        
        document.getElementById('click-value').textContent = this.formatNumber(clickValue);
        document.getElementById('auto-value').textContent = this.formatNumber(this.game.energyPerSecond);
        
        // Обновляем генераторы
        this.renderGenerators();
        
        // Обновляем множители
        this.renderMultipliers();
        
        // Обновляем достижения
        this.renderAchievements();
        
        // Обновляем престиж
        this.updatePrestige();
        
        // Обновляем улучшения кликера
        this.updateClickUpgrades();
    }
    
    renderGenerators() {
        const container = document.getElementById('generators-list');
        container.innerHTML = '';
        
        this.game.generators.forEach(gen => {
            const canAfford = this.game.energy >= gen.cost;
            const totalProduction = gen.production * gen.owned;
            
            const generatorHTML = `
                <div class="upgrade-card">
                    <div class="upgrade-header">
                        <div class="upgrade-icon">
                            <i class="${gen.icon}"></i>
                        </div>
                        <div class="upgrade-title">
                            <h3>${gen.name}</h3>
                            <p>${gen.description}</p>
                        </div>
                    </div>
                    <div class="upgrade-stats">
                        <div class="stat">
                            <div class="label">Куплено</div>
                            <div class="value">${gen.owned}</div>
                        </div>
                        <div class="stat">
                            <div class="label">Производство</div>
                            <div class="value">${this.formatNumber(gen.production)}/сек</div>
                        </div>
                        <div class="stat">
                            <div class="label">Всего</div>
                            <div class="value">${this.formatNumber(totalProduction)}/сек</div>
                        </div>
                        <div class="stat">
                            <div class="label">Стоимость</div>
                            <div class="value">${this.formatNumber(gen.cost)}</div>
                        </div>
                    </div>
                    <button class="upgrade-btn-main" onclick="game.buyGenerator(${gen.id})" ${canAfford ? '' : 'disabled'}>
                        <i class="fas fa-shopping-cart"></i>
                        ${canAfford ? 'Купить' : 'Не хватает энергии'}
                    </button>
                </div>
            `;
            
            container.innerHTML += generatorHTML;
        });
    }
    
    renderMultipliers() {
        const container = document.getElementById('multipliers-list');
        container.innerHTML = '';
        
        this.game.multipliers.forEach(mul => {
            const canAfford = this.game.energy >= mul.cost;
            const totalMultiplier = Math.pow(mul.multiplier, mul.owned).toFixed(2);
            
            const multiplierHTML = `
                <div class="upgrade-card">
                    <div class="upgrade-header">
                        <div class="upgrade-icon">
                            <i class="${mul.icon}"></i>
                        </div>
                        <div class="upgrade-title">
                            <h3>${mul.name}</h3>
                            <p>${mul.description}</p>
                        </div>
                    </div>
                    <div class="upgrade-stats">
                        <div class="stat">
                            <div class="label">Куплено</div>
                            <div class="value">${mul.owned}</div>
                        </div>
                        <div class="stat">
                            <div class="label">Множитель</div>
                            <div class="value">x${mul.multiplier}</div>
                        </div>
                        <div class="stat">
                            <div class="label">Общий эффект</div>
                            <div class="value">x${totalMultiplier}</div>
                        </div>
                        <div class="stat">
                            <div class="label">Стоимость</div>
                            <div class="value">${this.formatNumber(mul.cost)}</div>
                        </div>
                    </div>
                    <button class="upgrade-btn-main" onclick="game.buyMultiplier(${mul.id})" ${canAfford ? '' : 'disabled'}>
                        <i class="fas fa-chart-line"></i>
                        ${canAfford ? 'Купить' : 'Не хватает энергии'}
                    </button>
                </div>
            `;
            
            container.innerHTML += multiplierHTML;
        });
    }
    
    renderAchievements() {
        const container = document.getElementById('achievements-list');
        container.innerHTML = '';
        
        this.game.achievements.forEach(ach => {
            let progress = 0;
            let progressPercent = 0;
            
            if (ach.id <= 3) {
                progress = Math.min(this.game.totalEnergy / ach.target, 1);
                progressPercent = Math.min((this.game.totalEnergy / ach.target) * 100, 100);
            } else if (ach.id <= 5) {
                let totalGenerators = 0;
                this.game.generators.forEach(gen => {
                    totalGenerators += gen.owned;
                });
                progress = Math.min(totalGenerators / ach.target, 1);
                progressPercent = Math.min((totalGenerators / ach.target) * 100, 100);
            } else {
                progress = this.game.prestigeLevel >= ach.target ? 1 : 0;
                progressPercent = progress * 100;
            }
            
            const achievementHTML = `
                <div class="achievement ${ach.unlocked ? 'unlocked' : ''}">
                    <div class="achievement-icon">
                        <i class="${ach.icon}"></i>
                    </div>
                    <div class="achievement-info">
                        <h4>${ach.name}</h4>
                        <p>${ach.description}</p>
                        <div class="achievement-progress">
                            <div class="achievement-progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                </div>
            `;
            
            container.innerHTML += achievementHTML;
        });
    }
    
    updatePrestige() {
        const requiredEnergy = 1000000;
        const progress = Math.min(this.game.totalEnergy / requiredEnergy, 1);
        const progressPercent = progress * 100;
        
        document.getElementById('prestige-level').textContent = this.game.prestigeLevel;
        document.getElementById('prestige-bonus').textContent = `+${Math.floor((this.game.prestigeMultiplier - 1) * 100)}%`;
        document.getElementById('prestige-points').textContent = this.game.prestigePoints;
        document.getElementById('prestige-progress').style.width = `${progressPercent}%`;
        document.getElementById('prestige-progress-text').textContent = 
            `${this.formatNumber(this.game.totalEnergy)}/${this.formatNumber(requiredEnergy)}`;
        
        const prestigeBtn = document.getElementById('prestige-button');
        if (this.game.totalEnergy >= requiredEnergy) {
            prestigeBtn.disabled = false;
            prestigeBtn.innerHTML = `
                <i class="fas fa-sync-alt"></i>
                <span>ВЫПОЛНИТЬ ПРЕСТИЖ</span>
                <small>+${Math.floor(this.game.totalEnergy / requiredEnergy)} очков престижа</small>
            `;
        } else {
            prestigeBtn.disabled = true;
        }
    }
    
    updateClickUpgrades() {
        const doubleBtn = document.getElementById('double-click');
        const tripleBtn = document.getElementById('triple-click');
        
        if (this.game.upgrades.doubleClick) {
            doubleBtn.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Усилитель ядра (x2)</span>
                <div class="upgrade-cost">Куплено</div>
            `;
            doubleBtn.disabled = true;
        } else {
            doubleBtn.disabled = this.game.energy < 100;
        }
        
        if (this.game.upgrades.tripleClick) {
            tripleBtn.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Квантовый реактор (x3)</span>
                <div class="upgrade-cost">Куплено</div>
            `;
            tripleBtn.disabled = true;
        } else {
            tripleBtn.disabled = this.game.energy < 500;
        }
    }
    
    startGameLoop() {
        setInterval(() => {
            const now = Date.now();
            const delta = (now - this.lastUpdate) / 1000; // в секундах
            this.lastUpdate = now;
            
            // Добавляем пассивную энергию
            if (this.game.energyPerSecond > 0) {
                this.game.energy += this.game.energyPerSecond * delta;
                this.game.totalEnergy += this.game.energyPerSecond * delta;
            }
            
            // Обновляем достижения каждую секунду
            this.updateAchievements();
            
            // Обновляем отображение
            this.render();
        }, 100); // Обновляем 10 раз в секунду для плавности
    }
    
    startSaveTimer() {
        this.saveInterval = setInterval(() => {
            this.saveTimer--;
            document.getElementById('save-timer').textContent = this.saveTimer;
            
            if (this.saveTimer <= 0) {
                this.saveGame();
                this.saveTimer = 10;
            }
        }, 1000);
    }
    
    saveGame() {
        const saveData = {
            game: this.game,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('spaceIncrementorSave', JSON.stringify(saveData));
            console.log('Игра сохранена');
        } catch (e) {
            console.error('Ошибка сохранения:', e);
        }
    }
    
    loadGame() {
        try {
            const saveData = localStorage.getItem('spaceIncrementorSave');
            if (saveData) {
                const loaded = JSON.parse(saveData);
                
                // Восстанавливаем состояние игры
                Object.assign(this.game, loaded.game);
                
                // Пересчитываем производство
                this.game.calculateEPS();
                
                console.log('Игра загружена');
                this.showMessage('Прогресс загружен!', 'success');
            }
        } catch (e) {
            console.error('Ошибка загрузки:', e);
        }
    }
    
    resetGame() {
        if (confirm('Вы уверены? Весь прогресс будет потерян!')) {
            this.game = new GameState();
            localStorage.removeItem('spaceIncrementorSave');
            this.render();
            this.showMessage('Игра сброшена', 'warning');
        }
    }
    
    showHelp() {
        document.getElementById('help-modal').classList.add('active');
    }
    
    hideHelp() {
        document.getElementById('help-modal').classList.remove('active');
    }
    
    showMessage(text, type = 'info') {
        const container = document.getElementById('message-container');
        if (!container) return;
        
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${text}</span>
        `;
        
        container.appendChild(message);
        
        // Автоматическое удаление
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateX(100%)';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }
    
    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(2);
    }
}

// Создаем экземпляр игры при загрузке страницы
let game;

window.addEventListener('load', () => {
    game = new GameManager();
    
    // Делаем функции доступными глобально для обработчиков onclick
    window.buyGenerator = (id) => game.buyGenerator(id);
    window.buyMultiplier = (id) => game.buyMultiplier(id);
});
