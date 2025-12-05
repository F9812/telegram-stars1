// ===== КОНСТАНТЫ =====
const GAME_CONSTANTS = {
    PRESTIGE_TIME: 4 * 60 * 60 * 1000, // 4 часа
    EVENT_INTERVAL: 60 * 60 * 1000,    // 1 час
    EVENT_DURATION: 15 * 60 * 1000,    // 15 минут
    SAVE_INTERVAL: 30 * 1000,          // 30 секунд
    BASE_POWER: 1,
    PRESTIGE_BASE: 1000000,
    PRESTIGE_MULTIPLIER: 2.5,          // Увеличение сложности
    PRICE_INCREASE: 1.15
};

// ===== КЛАСС ИГРЫ =====
class SpaceIncrementor {
    constructor() {
        this.lastUpdate = Date.now();
        this.saveInterval = null;
        this.leaderboard = [];
        
        this.load();
        this.init();
    }
    
    load() {
        try {
            // Загружаем сохранение игры
            const saved = localStorage.getItem('spaceIncrementorSave');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Восстанавливаем состояние игры
                this.energy = data.energy || 0;
                this.totalEnergy = data.totalEnergy || 0;
                this.energyPerSecond = data.energyPerSecond || 0;
                this.totalClicks = data.totalClicks || 0;
                this.playTime = data.playTime || 0;
                this.startTime = Date.now() - (this.playTime * 1000);
                
                // Престиж
                this.prestigeLevel = data.prestigeLevel || 0;
                this.prestigePoints = data.prestigePoints || 0;
                this.lastPrestige = data.lastPrestige || Date.now();
                this.nextPrestige = data.nextPrestige || (Date.now() + GAME_CONSTANTS.PRESTIGE_TIME);
                
                // Ивенты
                this.activeEvent = data.activeEvent || null;
                this.eventEndTime = data.eventEndTime || 0;
                this.nextEventTime = data.nextEventTime || (Date.now() + GAME_CONSTANTS.EVENT_INTERVAL);
                
                // Настройки
                this.settings = data.settings || {
                    username: 'Космонавт',
                    autoSave: true,
                    animations: true,
                    notifications: true,
                    numberFormat: 'short'
                };
                
                // Генераторы
                this.generators = data.generators || [
                    { id: 1, name: 'Солнечная панель', cost: 10, baseCost: 10, owned: 0, production: 0.1, icon: 'fas fa-solar-panel', unlocked: true },
                    { id: 2, name: 'Ветрогенератор', cost: 50, baseCost: 50, owned: 0, production: 0.5, icon: 'fas fa-wind', unlocked: false },
                    { id: 3, name: 'Гидростанция', cost: 200, baseCost: 200, owned: 0, production: 2, icon: 'fas fa-water', unlocked: false },
                    { id: 4, name: 'Ядерный реактор', cost: 1000, baseCost: 1000, owned: 0, production: 10, icon: 'fas fa-atom', unlocked: false },
                    { id: 5, name: 'Термояд', cost: 5000, baseCost: 5000, owned: 0, production: 50, icon: 'fas fa-fire', unlocked: false },
                    { id: 6, name: 'Сфера Дайсона', cost: 25000, baseCost: 25000, owned: 0, production: 200, icon: 'fas fa-sun', unlocked: false }
                ];
                
                // Множители
                this.multipliers = data.multipliers || [
                    { id: 1, name: 'Эффективность I', cost: 100, baseCost: 100, owned: 0, multiplier: 1.1, icon: 'fas fa-bolt', unlocked: true },
                    { id: 2, name: 'Сеть II', cost: 500, baseCost: 500, owned: 0, multiplier: 1.25, icon: 'fas fa-network-wired', unlocked: false },
                    { id: 3, name: 'Квант III', cost: 2500, baseCost: 2500, owned: 0, multiplier: 1.5, icon: 'fas fa-microchip', unlocked: false },
                    { id: 4, name: 'Сингулярность', cost: 10000, baseCost: 10000, owned: 0, multiplier: 2, icon: 'fas fa-infinity', unlocked: false }
                ];
                
                // Бусты
                this.boosts = data.boosts || {
                    click2x: false,
                    auto5x: false
                };
                
                // Загружаем таблицу лидеров
                this.leaderboard = JSON.parse(localStorage.getItem('spaceIncrementorLeaderboard') || '[]');
                
                this.checkUnlocks();
                this.calculateProduction();
                
                console.log('✅ Игра успешно загружена');
                if (this.settings.notifications) {
                    this.showMessage('Прогресс загружен!', 'success');
                }
            } else {
                this.reset();
            }
        } catch (e) {
            console.error('❌ Ошибка загрузки:', e);
            this.reset();
            if (this.settings.notifications) {
                this.showMessage('Ошибка загрузки, начата новая игра', 'error');
            }
        }
    }
    
    reset() {
        console.log('🔄 Начата новая игра');
        
        this.energy = 0;
        this.totalEnergy = 0;
        this.energyPerSecond = 0;
        this.totalClicks = 0;
        this.playTime = 0;
        this.startTime = Date.now();
        
        this.prestigeLevel = 0;
        this.prestigePoints = 0;
        this.lastPrestige = Date.now();
        this.nextPrestige = Date.now() + GAME_CONSTANTS.PRESTIGE_TIME;
        
        this.activeEvent = null;
        this.eventEndTime = 0;
        this.nextEventTime = Date.now() + GAME_CONSTANTS.EVENT_INTERVAL;
        
        this.settings = {
            username: 'Космонавт',
            autoSave: true,
            animations: true,
            notifications: true,
            numberFormat: 'short'
        };
        
        this.generators = [
            { id: 1, name: 'Солнечная панель', cost: 10, baseCost: 10, owned: 0, production: 0.1, icon: 'fas fa-solar-panel', unlocked: true },
            { id: 2, name: 'Ветрогенератор', cost: 50, baseCost: 50, owned: 0, production: 0.5, icon: 'fas fa-wind', unlocked: false },
            { id: 3, name: 'Гидростанция', cost: 200, baseCost: 200, owned: 0, production: 2, icon: 'fas fa-water', unlocked: false },
            { id: 4, name: 'Ядерный реактор', cost: 1000, baseCost: 1000, owned: 0, production: 10, icon: 'fas fa-atom', unlocked: false },
            { id: 5, name: 'Термояд', cost: 5000, baseCost: 5000, owned: 0, production: 50, icon: 'fas fa-fire', unlocked: false },
            { id: 6, name: 'Сфера Дайсона', cost: 25000, baseCost: 25000, owned: 0, production: 200, icon: 'fas fa-sun', unlocked: false }
        ];
        
        this.multipliers = [
            { id: 1, name: 'Эффективность I', cost: 100, baseCost: 100, owned: 0, multiplier: 1.1, icon: 'fas fa-bolt', unlocked: true },
            { id: 2, name: 'Сеть II', cost: 500, baseCost: 500, owned: 0, multiplier: 1.25, icon: 'fas fa-network-wired', unlocked: false },
            { id: 3, name: 'Квант III', cost: 2500, baseCost: 2500, owned: 0, multiplier: 1.5, icon: 'fas fa-microchip', unlocked: false },
            { id: 4, name: 'Сингулярность', cost: 10000, baseCost: 10000, owned: 0, multiplier: 2, icon: 'fas fa-infinity', unlocked: false }
        ];
        
        this.boosts = {
            click2x: false,
            auto5x: false
        };
        
        this.leaderboard = [];
    }
    
    init() {
        this.setupEventListeners();
        this.gameLoop();
        this.startAutoSave();
        this.updateLeaderboard();
        this.render();
    }
    
    setupEventListeners() {
        // Клик по ядру
        document.getElementById('core').addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Вкладки улучшений
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Вкладки таблицы лидеров
        document.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const boardType = tab.dataset.board;
                this.switchLeaderboard(boardType);
            });
        });
        
        // Настройки
        document.getElementById('auto-save').addEventListener('change', (e) => {
            this.settings.autoSave = e.target.checked;
            this.save();
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
        
        // Анимация клика
        if (this.settings.animations) {
            this.createClickEffect(event, power);
        }
        
        // Проверяем разблокировки
        this.checkUnlocks();
        
        // Рендерим
        this.render();
        
        // Обновляем каждые 100 кликов
        if (this.totalClicks % 100 === 0) {
            this.save();
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
        
        // Анимация
        let opacity = 1;
        let posY = y;
        
        const animate = () => {
            opacity -= 0.02;
            posY -= 2;
            
            effect.style.opacity = opacity;
            effect.style.top = `${posY}px`;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                effect.remove();
            }
        };
        
        animate();
    }
    
    buyGenerator(id, amount = 1) {
        const generator = this.generators.find(g => g.id === id);
        if (!generator || !generator.unlocked) {
            console.log(`❌ Генератор ${id} не разблокирован`);
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
            
            console.log(`✅ Куплено ${bought} ${generator.name}`);
        } else {
            console.log(`❌ Недостаточно энергии для ${generator.name}`);
        }
        
        return bought;
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
            this.render();
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
            this.render();
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
    
    buyMultiplier(id) {
        const multiplier = this.multipliers.find(m => m.id === id);
        if (!multiplier || !multiplier.unlocked) {
            console.log(`❌ Множитель ${id} не разблокирован`);
            return false;
        }
        
        if (this.energy < multiplier.cost) {
            console.log(`❌ Недостаточно энергии для ${multiplier.name}`);
            return false;
        }
        
        this.energy -= multiplier.cost;
        multiplier.owned++;
        multiplier.cost = this.getMultiplierCost(multiplier);
        
        // Пересчитываем производство
        this.calculateProduction();
        
        if (this.settings.notifications) {
            this.showMessage(`${multiplier.name} куплен!`, 'success');
        }
        
        console.log(`✅ Куплен множитель: ${multiplier.name}`);
        return true;
    }
    
    getMultiplierCost(multiplier) {
        const baseMultiplier = Math.pow(1.5, multiplier.owned);
        const prestigeMultiplier = Math.pow(GAME_CONSTANTS.PRESTIGE_MULTIPLIER, this.prestigeLevel);
        return Math.floor(multiplier.baseCost * baseMultiplier * prestigeMultiplier);
    }
    
    buyBoost(type, cost) {
        if (this.boosts[type]) {
            console.log(`❌ Буст ${type} уже куплен`);
            return false;
        }
        
        if (this.energy < cost) {
            console.log(`❌ Недостаточно энергии для буста ${type}`);
            return false;
        }
        
        this.energy -= cost;
        this.boosts[type] = true;
        
        this.calculateProduction();
        
        if (this.settings.notifications) {
            this.showMessage('Буст активирован!', 'success');
        }
        
        console.log(`✅ Активирован буст: ${type}`);
        this.render();
        
        return true;
    }
    
    calculateProduction() {
        let eps = 0;
        
        // Производство генераторов
        for (const gen of this.generators) {
            eps += gen.production * gen.owned;
        }
        
        // Множители
        let multiplier = 1 + (this.prestigeLevel * 0.5); // Бонус престижа
        
        for (const mul of this.multipliers) {
            if (mul.owned > 0) {
                multiplier *= Math.pow(mul.multiplier, mul.owned);
            }
        }
        
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
                    console.log(`🔓 Разблокирован генератор: ${this.generators[i + 1].name}`);
                }
            }
        }
        
        // Разблокировка множителей
        const multiplierPoints = [500, 2500, 10000];
        for (let i = 0; i < multiplierPoints.length; i++) {
            if (this.totalEnergy >= multiplierPoints[i] && i + 1 < this.multipliers.length) {
                if (!this.multipliers[i + 1].unlocked) {
                    this.multipliers[i + 1].unlocked = true;
                    if (this.settings.notifications) {
                        this.showMessage(`Разблокирован ${this.multipliers[i + 1].name}!`, 'success');
                    }
                    console.log(`🔓 Разблокирован множитель: ${this.multipliers[i + 1].name}`);
                }
            }
        }
        
        // Пересчет стоимостей
        for (const gen of this.generators) {
            gen.cost = this.getGeneratorCost(gen);
        }
        
        for (const mul of this.multipliers) {
            mul.cost = this.getMultiplierCost(mul);
        }
    }
    
    canPrestige() {
        const required = this.getPrestigeRequirement();
        const now = Date.now();
        
        return this.totalEnergy >= required && now >= this.nextPrestige;
    }
    
    getPrestigeRequirement() {
        // Увеличиваем требование с каждым престижем
        return GAME_CONSTANTS.PRESTIGE_BASE * Math.pow(2.5, this.prestigeLevel);
    }
    
    prestige() {
        if (!this.canPrestige()) {
            console.log('❌ Нельзя выполнить престиж');
            return false;
        }
        
        const required = this.getPrestigeRequirement();
        const points = Math.floor(this.totalEnergy / required);
        
        console.log(`🔄 Выполнение престижа ${this.prestigeLevel + 1}`);
        
        // Обновляем престиж
        this.prestigeLevel++;
        this.prestigePoints += points;
        
        // Сбрасываем прогресс
        this.energy = 0;
        this.totalEnergy = 0;
        this.energyPerSecond = 0;
        
        for (const gen of this.generators) {
            gen.owned = 0;
            gen.cost = this.getGeneratorCost(gen);
        }
        
        for (const mul of this.multipliers) {
            mul.owned = 0;
            mul.cost = this.getMultiplierCost(mul);
        }
        
        this.boosts.click2x = false;
        this.boosts.auto5x = false;
        
        // Устанавливаем время следующего престижа
        this.lastPrestige = Date.now();
        this.nextPrestige = Date.now() + GAME_CONSTANTS.PRESTIGE_TIME;
        
        // Обновляем таблицу лидеров
        this.updateLeaderboardEntry();
        
        // Сохраняем
        this.save();
        
        if (this.settings.notifications) {
            this.showMessage(`Престиж ${this.prestigeLevel}! +${points} очков`, 'warning');
        }
        
        console.log(`✅ Престиж ${this.prestigeLevel} выполнен! +${points} очков`);
        this.render();
        
        return true;
    }
    
    checkEvent() {
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
        
        console.log(`🎉 Начат ивент: ${event.name}`);
    }
    
    updateLeaderboardEntry() {
        const playerEntry = {
            username: this.settings.username,
            energy: this.totalEnergy,
            prestige: this.prestigeLevel,
            playTime: this.playTime + (Date.now() - this.startTime) / 1000,
            lastUpdated: Date.now()
        };
        
        // Находим существующую запись
        const existingIndex = this.leaderboard.findIndex(p => p.username === this.settings.username);
        
        if (existingIndex !== -1) {
            // Обновляем существующую запись
            this.leaderboard[existingIndex] = playerEntry;
        } else {
            // Добавляем новую запись
            this.leaderboard.push(playerEntry);
        }
        
        // Сохраняем таблицу лидеров
        this.saveLeaderboard();
    }
    
    saveLeaderboard() {
        try {
            localStorage.setItem('spaceIncrementorLeaderboard', JSON.stringify(this.leaderboard));
        } catch (e) {
            console.error('❌ Ошибка сохранения таблицы лидеров:', e);
        }
    }
    
    loadLeaderboard() {
        try {
            this.leaderboard = JSON.parse(localStorage.getItem('spaceIncrementorLeaderboard') || '[]');
        } catch (e) {
            console.error('❌ Ошибка загрузки таблицы лидеров:', e);
            this.leaderboard = [];
        }
    }
    
    updateLeaderboard(sortBy = 'balance') {
        this.loadLeaderboard();
        
        let sortedLeaderboard = [...this.leaderboard];
        
        switch (sortBy) {
            case 'prestige':
                sortedLeaderboard.sort((a, b) => b.prestige - a.prestige);
                break;
            case 'total':
                // Общий рейтинг (престиж + баланс)
                sortedLeaderboard.sort((a, b) => {
                    const scoreA = a.prestige * 1000000 + a.energy;
                    const scoreB = b.prestige * 1000000 + b.energy;
                    return scoreB - scoreA;
                });
                break;
            default: // 'balance'
                sortedLeaderboard.sort((a, b) => b.energy - a.energy);
        }
        
        // Обновляем таблицу
        const tbody = document.getElementById('leaderboard-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        sortedLeaderboard.slice(0, 10).forEach((player, index) => {
            const row = document.createElement('tr');
            
            // Медальки для топ-3
            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            
            row.innerHTML = `
                <td>${index + 1} ${medal}</td>
                <td>${player.username}</td>
                <td>${this.formatNumber(player.energy)}</td>
                <td>${player.prestige}</td>
                <td>${this.formatTime(player.playTime)}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Находим позицию игрока
        const playerIndex = sortedLeaderboard.findIndex(p => p.username === this.settings.username);
        if (playerIndex !== -1) {
            document.getElementById('player-rank').textContent = playerIndex + 1;
            document.getElementById('player-balance').textContent = this.formatNumber(this.totalEnergy);
        } else {
            document.getElementById('player-rank').textContent = '-';
            document.getElementById('player-balance').textContent = this.formatNumber(this.totalEnergy);
        }
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
    }
    
    switchLeaderboard(boardType) {
        // Убираем активные классы
        document.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Активируем выбранную вкладку
        const tabBtn = document.querySelector(`[data-board="${boardType}"]`);
        if (tabBtn) tabBtn.classList.add('active');
        
        // Обновляем таблицу лидеров
        this.updateLeaderboard(boardType);
    }
    
    gameLoop() {
        const update = () => {
            const now = Date.now();
            const delta = (now - this.lastUpdate) / 1000;
            this.lastUpdate = now;
            
            // Обновляем время игры
            this.playTime += delta;
            
            // Пассивный доход
            if (this.energyPerSecond > 0) {
                this.energy += this.energyPerSecond * delta;
                this.totalEnergy += this.energyPerSecond * delta;
            }
            
            // Проверяем ивенты
            this.checkEvent();
            
            // Обновляем прогресс престижа
            const timeLeft = this.nextPrestige - now;
            if (timeLeft < 0 && document.getElementById('prestige-time-left')) {
                document.getElementById('prestige-time-left').textContent = '00:00:00';
            }
            
            // Обновляем рендер каждые 100мс для плавности
            if (now - this.lastRender > 100) {
                this.render();
                this.lastRender = now;
            }
            
            // Следующий кадр
            requestAnimationFrame(update);
        };
        
        this.lastUpdate = Date.now();
        this.lastRender = Date.now();
        update();
    }
    
    startAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        
        this.saveInterval = setInterval(() => {
            if (this.settings.autoSave) {
                this.save();
            }
        }, GAME_CONSTANTS.SAVE_INTERVAL);
    }
    
    save() {
        try {
            const saveData = {
                energy: this.energy,
                totalEnergy: this.totalEnergy,
                energyPerSecond: this.energyPerSecond,
                totalClicks: this.totalClicks,
                playTime: this.playTime + (Date.now() - this.startTime) / 1000,
                
                prestigeLevel: this.prestigeLevel,
                prestigePoints: this.prestigePoints,
                lastPrestige: this.lastPrestige,
                nextPrestige: this.nextPrestige,
                
                activeEvent: this.activeEvent,
                eventEndTime: this.eventEndTime,
                nextEventTime: this.nextEventTime,
                
                settings: this.settings,
                generators: this.generators,
                multipliers: this.multipliers,
                boosts: this.boosts,
                
                version: '4.0',
                timestamp: Date.now()
            };
            
            localStorage.setItem('spaceIncrementorSave', JSON.stringify(saveData));
            
            // Обновляем таблицу лидеров
            this.updateLeaderboardEntry();
            
            // Визуальная обратная связь
            const icon = document.getElementById('save-icon');
            const text = document.getElementById('save-status-text');
            
            if (icon) {
                icon.style.color = '#00ff9d';
                setTimeout(() => {
                    icon.style.color = '';
                }, 500);
            }
            
            if (text) {
                text.textContent = 'Сохранено';
                text.style.color = '#00ff9d';
                setTimeout(() => {
                    text.textContent = 'Автосохранение';
                    text.style.color = '';
                }, 2000);
            }
            
            console.log('💾 Игра сохранена');
            return true;
        } catch (e) {
            console.error('❌ Ошибка сохранения:', e);
            return false;
        }
    }
    
    resetGame() {
        if (confirm('Вы уверены? Весь прогресс будет потерян!')) {
            localStorage.removeItem('spaceIncrementorSave');
            this.reset();
            this.render();
            
            if (this.settings.notifications) {
                this.showMessage('Игра сброшена', 'warning');
            }
            
            console.log('🔄 Игра сброшена');
        }
    }
    
    showSettings() {
        const modal = document.getElementById('settings-modal');
        modal.classList.add('active');
        
        // Заполняем значения
        document.getElementById('username-input').value = this.settings.username;
        document.getElementById('auto-save').checked = this.settings.autoSave;
        document.getElementById('animations').checked = this.settings.animations;
        document.getElementById('notifications').checked = this.settings.notifications;
        document.getElementById('number-format').value = this.settings.numberFormat;
    }
    
    hideSettings() {
        document.getElementById('settings-modal').classList.remove('active');
    }
    
    changeUsername() {
        const input = document.getElementById('username-input');
        const name = input.value.trim();
        
        if (name && name !== this.settings.username) {
            this.settings.username = name.substring(0, 20);
            this.save();
            
            if (this.settings.notifications) {
                this.showMessage('Имя сохранено!', 'success');
            }
            
            this.render();
            console.log(`📝 Имя изменено на: ${this.settings.username}`);
        }
    }
    
    exportSave() {
        try {
            const saveData = localStorage.getItem('spaceIncrementorSave');
            const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(saveData)}`;
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `space-incrementor-save-${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            
            if (this.settings.notifications) {
                this.showMessage('Сохранение экспортировано!', 'success');
            }
        } catch (e) {
            console.error('❌ Ошибка экспорта:', e);
            if (this.settings.notifications) {
                this.showMessage('Ошибка экспорта', 'error');
            }
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
                    
                    if (saveData.version && saveData.version.startsWith('4.')) {
                        localStorage.setItem('spaceIncrementorSave', JSON.stringify(saveData));
                        location.reload();
                    } else {
                        if (this.settings.notifications) {
                            this.showMessage('Неверная версия сохранения', 'error');
                        }
                    }
                } catch (error) {
                    console.error('❌ Ошибка импорта:', error);
                    if (this.settings.notifications) {
                        this.showMessage('Ошибка импорта сохранения', 'error');
                    }
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    render() {
        // Обновляем основную статистику
        document.getElementById('energy').textContent = this.formatNumber(this.energy);
        document.getElementById('total-energy').textContent = this.formatNumber(this.totalEnergy);
        document.getElementById('eps').textContent = this.formatNumber(this.energyPerSecond);
        document.getElementById('multiplier').textContent = (1 + (this.prestigeLevel * 0.5)).toFixed(2) + 'x';
        document.getElementById('prestige').textContent = this.prestigeLevel;
        document.getElementById('prestige-points').textContent = this.prestigePoints;
        document.getElementById('username').textContent = this.settings.username;
        document.getElementById('player-name-display').querySelector('span').textContent = this.settings.username;
        document.getElementById('playtime').textContent = this.formatTime(this.playTime * 1000);
        
        // Рассчитываем силу клика
        let clickPower = GAME_CONSTANTS.BASE_POWER;
        clickPower *= 1 + (this.prestigeLevel * 0.5);
        if (this.boosts.click2x) clickPower *= 2;
        if (this.activeEvent && this.activeEvent.type === 'click') clickPower *= this.activeEvent.multiplier;
        
        document.getElementById('click-power-value').textContent = this.formatNumber(clickPower);
        document.getElementById('auto-power-value').textContent = this.formatNumber(this.energyPerSecond);
        
        // Престиж
        const required = this.getPrestigeRequirement();
        const progress = Math.min(this.totalEnergy / required, 1);
        const timeLeft = this.nextPrestige - Date.now();
        const pointsReward = Math.floor(this.totalEnergy / required);
        
        document.getElementById('prestige-required').textContent = this.formatNumber(required);
        document.getElementById('prestige-progress-bar').style.width = `${progress * 100}%`;
        document.getElementById('prestige-progress-text').textContent = `${Math.floor(progress * 100)}%`;
        document.getElementById('prestige-time-left').textContent = this.formatTime(Math.max(0, timeLeft));
        document.getElementById('prestige-reward-points').textContent = pointsReward;
        
        const prestigeBtn = document.getElementById('prestige-btn');
        if (this.canPrestige()) {
            prestigeBtn.disabled = false;
            prestigeBtn.innerHTML = `<i class="fas fa-sync-alt"></i> Переродиться (+${pointsReward})`;
        } else {
            prestigeBtn.disabled = true;
            let reason = '';
            
            if (this.totalEnergy < required) {
                const needed = required - this.totalEnergy;
                reason = `Нужно ${this.formatNumber(needed)} энергии`;
            } else {
                reason = `Осталось ${this.formatTime(timeLeft)}`;
            }
            
            prestigeBtn.innerHTML = `<i class="fas fa-clock"></i> ${reason}`;
        }
        
        // Ивенты
        if (this.activeEvent) {
            const eventCard = document.getElementById('event-card');
            const timeLeftEvent = this.eventEndTime - Date.now();
            
            eventCard.innerHTML = `
                <div class="event-icon">
                    <i class="${this.activeEvent.icon}"></i>
                </div>
                <div class="event-info">
                    <h4>${this.activeEvent.name}</h4>
                    <p>Осталось: <span>${this.formatTime(timeLeftEvent)}</span></p>
                </div>
            `;
            
            document.getElementById('next-event').textContent = this.formatTime(timeLeftEvent);
        } else {
            const timeToNext = Math.max(0, this.nextEventTime - Date.now());
            document.getElementById('next-event').textContent = this.formatTime(timeToNext);
        }
        
        // Быстрые улучшения
        document.getElementById('boost-2x').disabled = this.energy < 100 || this.boosts.click2x;
        document.getElementById('boost-5x').disabled = this.energy < 500 || this.boosts.auto5x;
        
        if (this.boosts.click2x) {
            document.getElementById('boost-2x').innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Куплено</span>
                <small>Активно</small>
            `;
        }
        
        if (this.boosts.auto5x) {
            document.getElementById('boost-5x').innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Куплено</span>
                <small>Активно</small>
            `;
        }
        
        // Рендерим генераторы
        this.renderGenerators();
        
        // Рендерим множители
        this.renderMultipliers();
        
        // Обновляем таблицу лидеров
        const activeTab = document.querySelector('.leaderboard-tab.active');
        if (activeTab) {
            this.updateLeaderboard(activeTab.dataset.board);
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
                            <p>${gen.production.toFixed(1)}/сек</p>
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
    
    renderMultipliers() {
        const container = document.getElementById('multipliers-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const mul of this.multipliers) {
            if (!mul.unlocked) continue;
            
            const canAfford = this.energy >= mul.cost;
            const totalMultiplier = Math.pow(mul.multiplier, mul.owned).toFixed(2);
            
            const html = `
                <div class="upgrade-item">
                    <div class="upgrade-header">
                        <div class="upgrade-icon">
                            <i class="${mul.icon}"></i>
                        </div>
                        <div class="upgrade-info">
                            <h4>${mul.name}</h4>
                            <p>+${Math.floor((mul.multiplier - 1) * 100)}% к генерации</p>
                        </div>
                    </div>
                    <div class="upgrade-stats">
                        <div class="upgrade-stat">
                            <span class="label">Куплено</span>
                            <span class="value">${mul.owned}</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="label">Множитель</span>
                            <span class="value">x${mul.multiplier}</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="label">Общий</span>
                            <span class="value">x${totalMultiplier}</span>
                        </div>
                    </div>
                    <button class="upgrade-btn" onclick="game.buyMultiplier(${mul.id})" ${canAfford ? '' : 'disabled'}>
                        <i class="fas fa-chart-line"></i>
                        ${canAfford ? 'Купить' : 'Не хватает'}
                    </button>
                </div>
            `;
            
            container.innerHTML += html;
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
        return num.toFixed(2);
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
    game = new SpaceIncrementor();
    
    // Делаем методы доступными глобально
    window.game = {
        // Основные методы
        buyGenerator: (id) => {
            if (game.buyGenerator(id) > 0) {
                game.render();
                game.save();
            }
        },
        buyMultiplier: (id) => {
            if (game.buyMultiplier(id)) {
                game.render();
                game.save();
            }
        },
        buyBoost: (type, cost) => {
            if (game.buyBoost(type, cost)) {
                game.save();
            }
        },
        buyMultiple: (amount) => {
            if (game.buyMultiple(amount) > 0) {
                game.save();
            }
        },
        buyMax: () => {
            if (game.buyMax() > 0) {
                game.save();
            }
        },
        prestige: () => {
            game.prestige();
        },
        save: () => {
            game.save();
        },
        
        // Настройки
        showSettings: () => game.showSettings(),
        hideSettings: () => game.hideSettings(),
        changeUsername: () => game.changeUsername(),
        exportSave: () => game.exportSave(),
        importSave: () => game.importSave(),
        resetGame: () => game.resetGame()
    };
    
    // Обработка закрытия страницы
    window.addEventListener('beforeunload', () => {
        console.log('💾 Сохранение перед закрытием...');
        game.save();
    });
    
    // Обработка видимости страницы
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('💾 Сохранение при скрытии страницы...');
            game.save();
        }
    });
    
    console.log('🎮 Игра запущена!');
});
