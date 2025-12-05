class GuildSystem {
    constructor() {
        this.guilds = new Map();
        this.nextGuildId = 1;
        this.initSampleGuilds();
    }
    
    initSampleGuilds() {
        // Примеры гильдий для начала
        const sampleGuilds = [
            {
                id: this.nextGuildId++,
                name: 'Хранители Энергии',
                tag: 'HE',
                description: 'Старейшая гильдия мастеров энергии',
                leader: 'Админ',
                level: 10,
                experience: 15000,
                members: ['Админ'],
                maxMembers: 50,
                joinType: 'open',
                created: Date.now()
            },
            {
                id: this.nextGuildId++,
                name: 'Квантовые Волки',
                tag: 'QW',
                description: 'Охотники за квантовыми технологиями',
                leader: 'Квант',
                level: 8,
                experience: 12000,
                members: ['Квант'],
                maxMembers: 40,
                joinType: 'approval',
                created: Date.now()
            },
            {
                id: this.nextGuildId++,
                name: 'Созвездие',
                tag: 'CON',
                description: 'Исследователи космических энергий',
                leader: 'Астра',
                level: 12,
                experience: 20000,
                members: ['Астра'],
                maxMembers: 30,
                joinType: 'closed',
                created: Date.now()
            }
        ];
        
        sampleGuilds.forEach(guild => {
            this.guilds.set(guild.id, guild);
        });
    }
    
    createGuild(leaderName, guildName, guildTag, description = '') {
        // Проверка существующей гильдии
        for (const guild of this.guilds.values()) {
            if (guild.name === guildName) {
                return { success: false, error: 'Гильдия с таким названием уже существует' };
            }
            if (guild.tag === guildTag) {
                return { success: false, error: 'Гильдия с таким тегом уже существует' };
            }
        }
        
        // Проверка требований
        if (guildName.length < 3 || guildName.length > 20) {
            return { success: false, error: 'Название гильдии должно быть от 3 до 20 символов' };
        }
        
        if (guildTag.length < 2 || guildTag.length > 4) {
            return { success: false, error: 'Тег гильдии должен быть от 2 до 4 символов' };
        }
        
        // Создание гильдии
        const newGuild = {
            id: this.nextGuildId++,
            name: guildName,
            tag: guildTag,
            description,
            leader: leaderName,
            level: 1,
            experience: 0,
            energy: 0,
            members: [leaderName],
            maxMembers: 20,
            joinType: 'open',
            upgrades: [],
            chat: [],
            created: Date.now(),
            lastActivity: Date.now()
        };
        
        this.guilds.set(newGuild.id, newGuild);
        
        return {
            success: true,
            guild: newGuild,
            message: `Гильдия "${guildName}" создана!`
        };
    }
    
    disbandGuild(guildId, requesterName) {
        const guild = this.guilds.get(guildId);
        if (!guild) {
            return { success: false, error: 'Гильдия не найдена' };
        }
        
        if (guild.leader !== requesterName) {
            return { success: false, error: 'Только лидер может распустить гильдию' };
        }
        
        this.guilds.delete(guildId);
        
        return {
            success: true,
            message: `Гильдия "${guild.name}" распущена`
        };
    }
    
    joinGuild(guildId, playerName) {
        const guild = this.guilds.get(guildId);
        if (!guild) {
            return { success: false, error: 'Гильдия не найдена' };
        }
        
        // Проверка лимита участников
        if (guild.members.length >= guild.maxMembers) {
            return { success: false, error: 'Гильдия заполнена' };
        }
        
        // Проверка типа вступления
        if (guild.joinType === 'closed') {
            return { success: false, error: 'Гильдия закрыта для новых участников' };
        }
        
        // Проверка уже состоящего участника
        if (guild.members.includes(playerName)) {
            return { success: false, error: 'Вы уже состоите в этой гильдии' };
        }
        
        if (guild.joinType === 'open') {
            // Автоматическое вступление
            guild.members.push(playerName);
            guild.lastActivity = Date.now();
            
            return {
                success: true,
                guild,
                message: `Вы вступили в гильдию "${guild.name}"`
            };
        } else if (guild.joinType === 'approval') {
            // Требуется одобрение лидера
            return {
                success: true,
                requiresApproval: true,
                message: 'Заявка отправлена на рассмотрение лидеру'
            };
        }
    }
    
    leaveGuild(playerName) {
        for (const guild of this.guilds.values()) {
            const memberIndex = guild.members.indexOf(playerName);
            if (memberIndex !== -1) {
                // Если игрок - лидер, нужно передать лидерство или распустить гильдию
                if (guild.leader === playerName) {
                    if (guild.members.length === 1) {
                        // Распустить гильдию если только лидер
                        this.guilds.delete(guild.id);
                        return {
                            success: true,
                            message: 'Гильдия распущена так как вы были единственным участником'
                        };
                    } else {
                        // Передать лидерство следующему участнику
                        const newLeader = guild.members.find(m => m !== playerName);
                        guild.leader = newLeader;
                    }
                }
                
                guild.members.splice(memberIndex, 1);
                guild.lastActivity = Date.now();
                
                return {
                    success: true,
                    message: `Вы покинули гильдию "${guild.name}"`
                };
            }
        }
        
        return { success: false, error: 'Вы не состоите в гильдии' };
    }
    
    getGuildInfo(guildId) {
        const guild = this.guilds.get(guildId);
        if (!guild) return null;
        
        // Расчет ранга гильдии
        const rank = this.calculateGuildRank(guild);
        
        return {
            ...guild,
            rank,
            memberCount: guild.members.length,
            activityLevel: this.getActivityLevel(guild.lastActivity)
        };
    }
    
    calculateGuildRank(guild) {
        // Простой расчет ранга на основе уровня и опыта
        const score = guild.level * 1000 + guild.experience;
        
        if (score > 50000) return 'Легендарный';
        if (score > 25000) return 'Эпический';
        if (score > 10000) return 'Редкий';
        if (score > 5000) return 'Необычный';
        return 'Обычный';
    }
    
    getActivityLevel(lastActivity) {
        const hoursSinceActivity = (Date.now() - lastActivity) / (1000 * 3600);
        
        if (hoursSinceActivity < 1) return 'Очень высокая';
        if (hoursSinceActivity < 6) return 'Высокая';
        if (hoursSinceActivity < 24) return 'Средняя';
        if (hoursSinceActivity < 72) return 'Низкая';
        return 'Неактивная';
    }
    
    addGuildExperience(guildId, experience) {
        const guild = this.guilds.get(guildId);
        if (!guild) return;
        
        guild.experience += experience;
        guild.lastActivity = Date.now();
        
        // Проверка повышения уровня
        const expForNextLevel = guild.level * 1000;
        if (guild.experience >= expForNextLevel) {
            guild.level++;
            guild.experience -= expForNextLevel;
            
            // Награды за уровень
            const levelRewards = this.getLevelRewards(guild.level);
            
            return {
                levelUp: true,
                newLevel: guild.level,
                rewards: levelRewards
            };
        }
        
        return { levelUp: false };
    }
    
    getLevelRewards(level) {
        const rewards = {
            energy: level * 1000,
            maxMembers: Math.min(100, 20 + Math.floor(level / 2) * 5)
        };
        
        if (level % 5 === 0) {
            rewards.special = `Разблокировано улучшение уровня ${level}`;
        }
        
        return rewards;
    }
    
    searchGuilds(searchTerm = '', filters = {}) {
        let results = Array.from(this.guilds.values());
        
        // Поиск по названию и тегу
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(guild => 
                guild.name.toLowerCase().includes(term) ||
                guild.tag.toLowerCase().includes(term) ||
                guild.description.toLowerCase().includes(term)
            );
        }
        
        // Фильтры
        if (filters.joinType) {
            results = results.filter(guild => guild.joinType === filters.joinType);
        }
        
        if (filters.minLevel) {
            results = results.filter(guild => guild.level >= filters.minLevel);
        }
        
        if (filters.maxMembers) {
            results = results.filter(guild => guild.members.length <= filters.maxMembers);
        }
        
        // Сортировка
        results.sort((a, b) => {
            if (filters.sortBy === 'level') {
                return b.level - a.level;
            } else if (filters.sortBy === 'members') {
                return b.members.length - a.members.length;
            } else if (filters.sortBy === 'activity') {
                return b.lastActivity - a.lastActivity;
            }
            // По умолчанию по уровню
            return b.level - a.level;
        });
        
        return results.slice(0, filters.limit || 50);
    }
    
    sendGuildChat(guildId, playerName, message) {
        const guild = this.guilds.get(guildId);
        if (!guild) return { success: false, error: 'Гильдия не найдена' };
        
        if (!guild.members.includes(playerName)) {
            return { success: false, error: 'Вы не состоите в этой гильдии' };
        }
        
        const chatMessage = {
            player: playerName,
            message,
            timestamp: Date.now(),
            type: 'chat'
        };
        
        guild.chat.push(chatMessage);
        
        // Ограничение истории чата
        if (guild.chat.length > 1000) {
            guild.chat = guild.chat.slice(-500);
        }
        
        guild.lastActivity = Date.now();
        
        return {
            success: true,
            message: chatMessage
        };
    }
    
    getGuildChat(guildId, limit = 100) {
        const guild = this.guilds.get(guildId);
        if (!guild) return [];
        
        return guild.chat.slice(-limit);
    }
}

module.exports = new GuildSystem();
