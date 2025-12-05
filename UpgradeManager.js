class UpgradeManager {
    constructor(gameClient) {
        this.gameClient = gameClient;
        this.upgrades = {
            // Улучшения клика
            click_1: { 
                name: 'Усиленный сбор', 
                description: '+10% к энергии за клик',
                baseCost: 100,
                maxLevel: 10,
                effect: (level) => 1 + (level * 0.1)
            },
            click_2: { 
                name: 'Кристальная синергия', 
                description: '+20% к энергии за клик',
                baseCost: 1000,
                maxLevel: 5,
                requires: { click_1: 5 },
                effect: (level) => 1 + (level * 0.2)
            },
            
            // Улучшения генераторов
            gen_solar_1: {
                name: 'Солнечные концентраторы',
                description: '+15% к эффективности солнечных генераторов',
                baseCost: 500,
                maxLevel: 20,
                effect: (level) => 1 + (level * 0.15)
            },
            
            // Квантовые улучшения (после перерождения)
            quantum_1: {
                name: 'Квантовая стабильность',
                description: '+5% к производству энергии (вечный бонус)',
                baseCost: 5, // В квантовых очках
                maxLevel: 50,
                currency: 'quantum',
                effect: (level) => 1 + (level * 0.05)
            }
        };
        
        this.playerUpgrades = {};
    }
    
    canPurchase(upgradeId) {
        const upgrade = this.upgrades[upgradeId];
        if (!upgrade) return false;
        
        // Проверка требований
        if (upgrade.requires) {
            for (const [reqId, reqLevel] of Object.entries(upgrade.requires)) {
                const playerLevel = this.playerUpgrades[reqId]?.level || 0;
                if (playerLevel < reqLevel) return false;
            }
        }
        
        // Проверка валюты
        const currency = upgrade.currency || 'energy';
        const playerCurrency = currency === 'quantum' 
            ? this.gameClient.gameState.quantumPoints 
            : this.gameClient.gameState.energy;
        
        const currentLevel = this.playerUpgrades[upgradeId]?.level || 0;
        const cost = this.calculateCost(upgradeId, currentLevel);
        
        return currentLevel < upgrade.maxLevel && playerCurrency >= cost;
    }
    
    calculateCost(upgradeId, currentLevel) {
        const upgrade = this.upgrades[upgradeId];
        if (!upgrade) return Infinity;
        
        return Math.floor(upgrade.baseCost * Math.pow(1.5, currentLevel));
    }
    
    purchase(upgradeId) {
        if (!this.canPurchase(upgradeId)) {
            return { success: false, error: 'Нельзя купить улучшение' };
        }
        
        const upgrade = this.upgrades[upgradeId];
        const currentLevel = this.playerUpgrades[upgradeId]?.level || 0;
        const cost = this.calculateCost(upgradeId, currentLevel);
        
        // Списание валюты
        const currency = upgrade.currency || 'energy';
        if (currency === 'quantum') {
            this.gameClient.gameState.quantumPoints -= cost;
        } else {
            this.gameClient.gameState.energy -= cost;
        }
        
        // Обновление уровня
        if (!this.playerUpgrades[upgradeId]) {
            this.playerUpgrades[upgradeId] = {
                id: upgradeId,
                level: 0,
                purchased: true
            };
        }
        
        this.playerUpgrades[upgradeId].level++;
        
        // Применение эффекта
        this.applyUpgradeEffect(upgradeId);
        
        return {
            success: true,
            newLevel: this.playerUpgrades[upgradeId].level,
            cost,
            currency
        };
    }
    
    applyUpgradeEffect(upgradeId) {
        const upgrade = this.upgrades[upgradeId];
        const level = this.playerUpgrades[upgradeId]?.level || 0;
        const effect = upgrade.effect(level);
        
        switch (upgradeId) {
            case 'click_1':
            case 'click_2':
                this.gameClient.gameState.clickMultiplier = this.calculateTotalClickMultiplier();
                break;
                
            case 'quantum_1':
                // Вечный бонус применяется на сервере
                break;
        }
    }
    
    calculateTotalClickMultiplier() {
        let multiplier = 1;
        
        Object.entries(this.playerUpgrades).forEach(([id, data]) => {
            const upgrade = this.upgrades[id];
            if (upgrade && id.startsWith('click_')) {
                multiplier *= upgrade.effect(data.level);
            }
        });
        
        return multiplier;
    }
}
