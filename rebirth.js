class RebirthSystem {
    constructor() {
        this.baseCost = 1000;
        this.costMultiplier = 2.5;
        this.sessionRequirement = 4 * 3600; // 4 часа в секундах
    }
    
    calculateRebirthCost(rebirthCount) {
        if (rebirthCount === 0) return this.baseCost;
        return Math.floor(this.baseCost * Math.pow(this.costMultiplier, rebirthCount));
    }
    
    calculateQuantumPoints(rebirthCount, currentEnergy, totalPlayTime, generators = []) {
        // Базовые очки
        let points = 1;
        
        // Бонус за энергию
        const energyBonus = Math.floor(Math.log10(currentEnergy + 1));
        points += energyBonus;
        
        // Бонус за перерождения
        const rebirthBonus = Math.floor(rebirthCount * 0.5);
        points += rebirthBonus;
        
        // Бонус за генераторы
        const generatorCount = generators.reduce((sum, g) => sum + g.count, 0);
        const generatorBonus = Math.floor(generatorCount / 10);
        points += generatorBonus;
        
        // Бонус за время игры
        const timeBonus = Math.floor(totalPlayTime / 3600 / 10); // +1 за каждые 10 часов
        points += timeBonus;
        
        // Минимум 1 очко
        return Math.max(1, points);
    }
    
    canRebirth(playerData) {
        const requiredEnergy = this.calculateRebirthCost(playerData.rebirthCount || 0);
        const hasEnoughEnergy = playerData.energy >= requiredEnergy;
        const hasEnoughSession = (playerData.sessionTime || 0) >= this.sessionRequirement;
        
        return {
            canRebirth: hasEnoughEnergy && hasEnoughSession,
            requiredEnergy,
            currentEnergy: playerData.energy,
            sessionTime: playerData.sessionTime || 0,
            requiredSession: this.sessionRequirement,
            missingEnergy: Math.max(0, requiredEnergy - playerData.energy),
            missingSession: Math.max(0, this.sessionRequirement - (playerData.sessionTime || 0))
        };
    }
    
    performRebirth(playerData) {
        const check = this.canRebirth(playerData);
        if (!check.canRebirth) {
            throw new Error(`Требования не выполнены: ${check.missingEnergy > 0 ? 'Недостаточно энергии' : 'Недостаточно времени сессии'}`);
        }
        
        // Расчет квантовых очков
        const quantumPoints = this.calculateQuantumPoints(
            playerData.rebirthCount || 0,
            playerData.energy,
            playerData.totalPlayTime || 0,
            playerData.generators || []
        );
        
        // Вечный бонус
        const eternalBonus = 1 + ((playerData.rebirthCount || 0) * 0.05); // +5% за каждое перерождение
        
        // Сброшенные данные
        const resetData = {
            energy: 0,
            generators: [],
            upgrades: playerData.upgrades ? playerData.upgrades.filter(u => u.startsWith('quantum_')) : [],
            sessionTime: 0
        };
        
        // Новые значения
        const newData = {
            rebirthCount: (playerData.rebirthCount || 0) + 1,
            quantumPoints: (playerData.quantumPoints || 0) + quantumPoints,
            eternalBonus,
            lastRebirth: new Date().toISOString()
        };
        
        // Разблокировки
        const unlocks = this.getUnlocks(newData.rebirthCount);
        
        return {
            success: true,
            quantumPointsEarned: quantumPoints,
            eternalBonus,
            resetData,
            newData,
            unlocks
        };
    }
    
    getUnlocks(rebirthCount) {
        const unlocks = [];
        
        if (rebirthCount >= 1) {
            unlocks.push('quantum_upgrades'); // Квантовые улучшения
            unlocks.push('prestige_generators'); // Престижные генераторы
        }
        
        if (rebirthCount >= 3) {
            unlocks.push('advanced_events'); // Продвинутые события
            unlocks.push('guild_leader'); // Возможность создать гильдию
        }
        
        if (rebirthCount >= 5) {
            unlocks.push('market_master'); // Расширенные функции рынка
            unlocks.push('energy_trading'); // Торговля энергией
        }
        
        if (rebirthCount >= 10) {
            unlocks.push('cosmic_artifacts'); // Космические артефакты
            unlocks.push('dimension_travel'); // Путешествие по измерениям
        }
        
        return unlocks;
    }
    
    // Расчет необходимой энергии для следующего перерождения
    getRebirthProgress(playerData) {
        const requiredEnergy = this.calculateRebirthCost(playerData.rebirthCount || 0);
        const energyProgress = Math.min(1, (playerData.energy || 0) / requiredEnergy);
        const sessionProgress = Math.min(1, (playerData.sessionTime || 0) / this.sessionRequirement);
        const overallProgress = (energyProgress + sessionProgress) / 2;
        
        return {
            energyProgress,
            sessionProgress,
            overallProgress,
            requiredEnergy,
            requiredSession: this.sessionRequirement,
            canRebirth: energyProgress >= 1 && sessionProgress >= 1
        };
    }
    
    // Бонусы от квантовых очков
    getQuantumBonuses(quantumPoints) {
        const bonuses = [];
        
        // Множитель энергии
        const energyMultiplier = 1 + (quantumPoints * 0.01);
        bonuses.push({
            type: 'energy_multiplier',
            value: energyMultiplier,
            description: `×${energyMultiplier.toFixed(2)} к производству энергии`
        });
        
        // Скорость клика
        const clickSpeedBonus = Math.min(0.5, quantumPoints * 0.002);
        if (clickSpeedBonus > 0) {
            bonuses.push({
                type: 'click_speed',
                value: clickSpeedBonus,
                description: `+${(clickSpeedBonus * 100).toFixed(1)}% к скорости клика`
            });
        }
        
        // Шанс критического клика
        const critChance = Math.min(0.2, quantumPoints * 0.001);
        if (critChance > 0) {
            bonuses.push({
                type: 'critical_chance',
                value: critChance,
                description: `${(critChance * 100).toFixed(1)}% шанс критического клика`
            });
        }
        
        // Офлайн эффективность
        const offlineBonus = Math.min(0.3, quantumPoints * 0.003);
        if (offlineBonus > 0) {
            bonuses.push({
                type: 'offline_efficiency',
                value: offlineBonus,
                description: `+${(offlineBonus * 100).toFixed(1)}% к офлайн производству`
            });
        }
        
        return bonuses;
    }
}

module.exports = new RebirthSystem();
