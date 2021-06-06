if (typeof Crustulum !== 'undefined') {
    if (Crustulum === null) {
        delete Crustulum;
    } else throw new Error('Crustulum already loaded.');
}
var Crustulum = {
    OG: {}, // Original Game Data
    Game: { // Our overrides
        UpdateMenu: () => {
            Crustulum.OG.UpdateMenu();
            if (Game.onMenu == 'prefs') {
                let fragment = document.createDocumentFragment();
                fragment.appendChild(Crustulum.Menu.heading('Crustulum Toggleables'));
                fragment.appendChild(Crustulum.Menu.toggleButton('infiniteSwaps','Infinite Swaps','Causes your Pantheon swaps to regenerate almost instantly.'));
                fragment.appendChild(Crustulum.Menu.toggleButton('miracleSpells','Miracle Spell™','Grimoire spells will never fail.'));
                fragment.appendChild(Crustulum.Menu.toggleButton('immortalPlants','Make Plants Immortal','Makes it so plants never wither.'));
                fragment.appendChild(Crustulum.Menu.toggleButton('neverWeeds','Never Weed™','Makes it so weeds never spawn on their own. You can still plant them and they still may spread.'));
                fragment.appendChild(Crustulum.Menu.heading('Crustulum Actions'));
                // Unload Crustulum button. Doesn't work if you loaded other add-ons first. We check only for Cookie Monster.
                if (typeof CM === 'undefined' || Crustulum.cookieMonsterLoaded) fragment.appendChild(Crustulum.Menu.actionButton('unloadCrustulum','Unload Crustulum','Unloads Crustulum and disabled all of it\'s features.', Crustulum.Actions.unloadCrustulum));

                Crustulum.PluginHooks.UpdateMenu(fragment);

                l('menu').childNodes[2].insertBefore(fragment, l('menu').childNodes[2].childNodes[l('menu').childNodes[2].childNodes.length - 1]);
            }
        },
    },
    Actions: { // Our action library
        unloadCrustulum: ()=>{
            Object.keys(Crustulum.ticks).forEach((tickThis) => {
                let tick = Crustulum.ticks[tickThis];
                if (tick.intervalId) {
                    clearInterval(tick.intervalId);
                    tick.intervalId = 0;
                }
            });
            Crustulum.Liberate.Game();
            Crustulum.PluginHooks.UnloadPlugins();
            Game.UpdateMenu();
            setTimeout(() => Crustulum = null, 100);
        },
    },
    ConfigDefaults: { // The default value for the configs
        'infiniteSwaps': false,
        'miracleSpells': false,
        'immortalPlants': false,
        'neverWeeds': false,
    },
    Config: {}, // User settings
    Init: () => { // Initialize the add-on.
        if (!Game || !Game.version || !Game.updateLog) {
            alert('The game isn\'t loaded yet or this isn\'t the game.');
            return;
        }
        Crustulum.Hijack.Game();
        Crustulum.loadConfig();
        Crustulum.initTicks();
        Game.Win('Third-party');
        if (typeof CM === 'object' && typeof Queue !== 'undefined' && typeof jscolor !== 'undefined') Crustulum.cookieMonsterLoaded = true;
        Crustulum.PluginHooks.Init();
    },
    cookieMonsterLoaded: false,
    Menu: {
        toggleButton: (configParam, text, description) => {
            let div = document.createElement('div'), a = document.createElement('a'), label = document.createElement('label');
            if (!Crustulum.getConfig(configParam)) a.className = 'option off';
            else a.className = 'option';
            a.id = `crustulum-${configParam}`;
            a.onclick = ()=>Crustulum.toggleConfig(configParam);
            a.textContent = text;
            label.textContent = description;
            div.className = 'listing';
            div.appendChild(a);
            div.appendChild(label);
            return div;
        },
        actionButton: (configParam, text, description, action) => {
            let div = document.createElement('div'), a = document.createElement('a'), label = document.createElement('label');
            a.className = 'option';
            a.id = `crustulum-${configParam}`;
            a.onclick = action;
            a.textContent = text;
            label.textContent = description;
            div.className = 'listing';
            div.appendChild(a);
            div.appendChild(label);
            return div;
        },
        heading: (text) => {
            let heading = document.createElement('div');
            heading.className = 'title';
            heading.textContent = text;
            return heading;
        },
    },
    saveConfig: () => {
        localStorage.setItem('Crustulum', JSON.stringify(Crustulum.Config));
    },
    loadConfig: () => {
        let config = localStorage.getItem('Crustulum');
        if (config) {
            config = JSON.parse(config);
            Object.keys(config).forEach((key) => {
                Crustulum.setConfig(key, config[key]);
            });
        }
    },
    getConfig: (configParam) => {
        if (typeof Crustulum.Config[configParam] === 'undefined')
            return Crustulum.ConfigDefaults[configParam];
        else return Crustulum.Config[configParam];
    },
    setConfig: (configParam, configValue) => {
        if (configValue === Crustulum.ConfigDefaults[configParam])
            delete Crustulum.Config[configParam];
        else Crustulum.Config[configParam] = configValue;
        Crustulum.saveConfig();
        return Crustulum.getConfig(configParam);
    },
    toggleConfig: (configParam) => {
        let val = Crustulum.setConfig(configParam, !Crustulum.getConfig(configParam));
        Crustulum.updateMenuView(configParam);
        return val;
    },
    updateMenuView: (configParam) => {
        if (!Crustulum.getConfig(configParam))
            l(`crustulum-${configParam}`).className = 'option off';
        else
            l(`crustulum-${configParam}`).className = 'option';
    },
    Liberate: {
        Game: () => {
            if (Crustulum.OG.UpdateMenu) Game.UpdateMenu = Crustulum.OG.UpdateMenu;
            Crustulum.Liberate.miniGames();
        },
        miniGames: () => {
            if(Game.Objects['Farm'].minigameLoaded && Game.Objects['Farm'].minigame.plants && Game.Objects['Farm'].minigame.soils) {
                if (Crustulum.OG.gardenPlantsMortality) Object.keys(Game.Objects['Farm'].minigame.plants).forEach((plantName) => {
                    let plant = Game.Objects['Farm'].minigame.plants[plantName];
                    Object.defineProperty(plant, 'immortal', {value:Crustulum.OG.gardenPlantsMortality[plantName],configurable: true});
                });

                if (Crustulum.OG.gardenSoilWeed) Object.keys(Game.Objects['Farm'].minigame.soils).forEach((soilName) => {
                    let soil = Game.Objects['Farm'].minigame.soils[soilName];
                    Object.defineProperty(soil, 'weedMult', {value:Crustulum.OG.gardenSoilWeed[soilName],configurable: true});
                });
            }
            if(Game.Objects['Wizard tower'].minigameLoaded && Game.Objects['Wizard tower'].minigame.getFailChance) {
                if (Crustulum.OG.grimoireFailChance) Game.Objects['Wizard tower'].minigame.getFailChance = Crustulum.OG.grimoireFailChance;
            }
        },
    },
    Hijack: {
        Game: () => {
            if (!Crustulum.OG.UpdateMenu) {
                Crustulum.OG.UpdateMenu = Game.UpdateMenu;
                Game.UpdateMenu = Crustulum.Game.UpdateMenu;
            }

            Crustulum.Hijack.miniGames();
        },
        miniGames: () => {
            if (!Crustulum) return;
            retry = false;

            if(!Game.Objects['Farm'].minigameLoaded || !Game.Objects['Farm'].minigame.plants || !Game.Objects['Farm'].minigame.soils) {
                retry = true;
            } else {
                if (!Crustulum.OG.gardenPlantsMortality) {
                    Crustulum.OG.gardenPlantsMortality = {};
                    Object.keys(Game.Objects['Farm'].minigame.plants).forEach((plantName) => {
                        let plant = Game.Objects['Farm'].minigame.plants[plantName];
                        Crustulum.OG.gardenPlantsMortality[plantName] = plant.immortal;
                        Object.defineProperty(plant, 'immortal', {get:()=>{return (Crustulum.getConfig('immortalPlants')?true:Crustulum.OG.gardenPlantsMortality[plantName])},configurable: true});
                    });
                }

                if (!Crustulum.OG.gardenSoilWeed) {
                    Crustulum.OG.gardenSoilWeed = {};
                    Object.keys(Game.Objects['Farm'].minigame.soils).forEach((soilName) => {
                        let soil = Game.Objects['Farm'].minigame.soils[soilName];
                        Crustulum.OG.gardenSoilWeed[soilName] = soil.weedMult;
                        Object.defineProperty(soil, 'weedMult',{get:()=>{return (Crustulum.getConfig('neverWeeds')?0:Crustulum.OG.gardenSoilWeed[soilName])},configurable: true});
                    });
                }
            }

            if(!Game.Objects['Wizard tower'].minigameLoaded || !Game.Objects['Wizard tower'].minigame.getFailChance) {
                retry = true;
            } else {
                if (!Crustulum.OG.grimoireFailChance) {
                    Crustulum.OG.grimoireFailChance = Game.Objects['Wizard tower'].minigame.getFailChance;
                    Game.Objects['Wizard tower'].minigame.getFailChance = (spell)=>(Crustulum.getConfig('miracleSpells')?0:Crustulum.OG.grimoireFailChance(spell));
                }
            }

            if (retry) setTimeout(Crustulum.Hijack.miniGames, 1000);
        },
    },
    initTicks: () => {
        Object.keys(Crustulum.ticks).forEach((tickThis) => {
            let tick = Crustulum.ticks[tickThis];
            if (!tick.intervalId) tick.intervalId = setInterval(tick.onTick, tick.rate);
        });
    },
    ticks: {
        'infiniteSwaps': {
            'intervalId': null,
            'rate': 1000,
            'onTick': ()=>{
                if (!Crustulum.getConfig('infiniteSwaps')) return;
                if(!Game.Objects['Temple'].minigameLoaded || !Game.Objects['Temple'].minigame.gods) return;
                Game.Objects['Temple'].minigame.swaps=3;
                Game.Objects['Temple'].minigame.swapT=Date.now();
                Game.Objects['Temple'].minigame.lastSwapT=0;
            },
        },
    },
    PluginHooks: {
        Init: () => {
            Object.keys(Crustulum.Plugins).forEach((key) => {
                let plugin = Crustulum.Plugins[key];
                if (typeof plugin['Init'] === 'function') plugin['Init']();
            });
        },
        UnloadPlugins: () => {
            Object.keys(Crustulum.Plugins).forEach((key) => {
                let plugin = Crustulum.Plugins[key];
                if (typeof plugin['Unload'] === 'function') plugin['Unload']();
            });
        },
        UpdateMenu: (fragment) => {
            Object.keys(Crustulum.Plugins).forEach((key) => {
                let plugin = Crustulum.Plugins[key];
                if (typeof plugin['Game'] === 'object' && typeof plugin['Game']['UpdateMenu'] === 'function') plugin['Game']['UpdateMenu'](fragment);
            });
        },
    },
    Plugins: {}, // Plugins
};

// You can setup `CrustulumPlugins` (object) with your custom plugins before loading this script
if (typeof CrustulumPlugins === 'object') {
    Object.keys(CrustulumPlugins).forEach((key) => {
        let plugin = CrustulumPlugins[key];
        if (typeof plugin === 'object') {
            Crustulum.Plugins[key] = plugin;
            if (typeof Crustulum.Plugins[key]['Loaded'] === 'function') Crustulum.Plugins[key].Loaded();
        } else if (typeof plugin === 'function') {
            Crustulum.Plugins[key] = plugin;
            Crustulum.Plugins[key]();
        }
    });
}

// Alternatively, you can set CrustulumInit to false to prevent the Init and set up your plugins after loading the script, remember to call `Crustulum.Init()` afterwards.
if (typeof CrustulumInit === 'undefined' || CrustulumInit) Crustulum.Init();

/* cSpell:ignore Crustulum, Toggleables, prefs, minigame, Mult, grimoire, grimoire's, grimoire\'s, Cyclius, dragonflight, Achiev, jscolor */
