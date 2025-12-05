class GameEngine {
  constructor() {
    this.generatorConfigs = {
      solar: { baseCost: 10, baseProduction: 0.1, costMultiplier: 1.15 },
      geothermal: { baseCost: 100, baseProduction: 1, costMultiplier: 1.15 },
      quantum: { baseCost: 1000, baseProduction: 10, costMultiplier: 1.15 },
      gravity: { baseCost: 10000, baseProduction: 100, costMultiplier: 1.15 },
      stellar: { baseCost: 100000, baseProduction: 1000, costMultiplier: 1.15 }
    };
    
    this.rebirthRequirements = [
      1000,      // 1-е перерождение
      5000,      // 2-е
      25000,     // 3-е
      100000,    // 4-е
      500000,    // 5-е
      // Экспоненциальный рост
    ];
  }
  
  // Расчет стоимости генератора
  calculateGeneratorCost(type, count, level) {
    const config = this.generatorConfigs[type];
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, count) * level);
  }
  
  // Расчет производства генератора
  calculateGeneratorProduction(type, count, level, efficiency = 1.0) {
    const config = this.generatorConfigs[type];
    return config.baseProduction * count * level * efficiency;
  }
  
  // Расчет офлайн производства
  calculateOfflineProduction(player, offlineSeconds) {
    let totalProduction = 0;
    const offlineEfficiency = 0.7; // 70% эффективности
    
    player.generators.forEach(generator => {
      const production = this.calculateGeneratorProduction(
        generator.type, 
        generator.count, 
        generator.level, 
        generator.efficiency
      );
      totalProduction += production * offlineSeconds * offlineEfficiency;
    });
    
    return Math.floor(totalProduction);
  }
  
  // Проверка возможности перерождения
  canRebirth(player, currentEnergy) {
    const requiredEnergy = this.getRebirthRequirement(player.rebirthCount);
    const hasEnoughEnergy = currentEnergy >= requiredEnergy;
    const hasEnoughSessionTime = player.sessionTimeForRebirth >= 4 * 3600; // 4 часа в секундах
    
    return {
      canRebirth: hasEnoughEnergy && hasEnoughSessionTime,
      requiredEnergy,
      currentEnergy,
      sessionTime: player.sessionTimeForRebirth,
      requiredSessionTime: 4 * 3600
    };
  }
  
  // Выполнение перерождения
  performRebirth(player) {
    const check = this.canRebirth(player, player.energy);
    
    if (!check.canRebirth) {
      throw new Error('Не выполнены требования для перерождения');
    }
    
    // Расчет квантовых очков
    const baseQP = 1 + Math.floor(Math.log10(check.currentEnergy / 1000));
    const bonusQP = Math.floor(player.rebirthCount * 0.5);
    const totalQP = baseQP + bonusQP;
    
    // Сброс прогресса
    player.energy = 0;
    player.rebirthCount += 1;
    player.generators = []; // Сброс генераторов
    player.quantumPoints += totalQP;
    player.sessionTimeForRebirth = 0;
    player.lastRebirthTime = new Date();
    
    // Бонус вечности
    const eternalBonus = 1 + (player.rebirthCount * 0.05); // +5% за каждое перерождение
    
    return {
      success: true,
      quantumPointsEarned: totalQP,
      eternalBonus,
      newRebirthCount: player.rebirthCount
    };
  }
  
  getRebirthRequirement(rebirthCount) {
    if (rebirthCount < this.rebirthRequirements.length) {
      return this.rebirthRequirements[rebirthCount];
    }
    // Экспоненциальный рост после 5-го перерождения
    return Math.floor(500000 * Math.pow(2.5, rebirthCount - 4));
  }
}

module.exports = new GameEngine();
