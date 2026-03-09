import Phaser from 'phaser';
import {
  ASSET_IDS,
  AUTOSAVE_SECONDS,
  DAY_LENGTH,
  DUSK_LENGTH,
  INTERACT_RANGE,
  NIGHT_LENGTH,
  PALETTE,
  PLAYER_SPEED,
  SAVE_VERSION,
  START_SEED,
  TILE_SIZE,
  WORLD_H,
  WORLD_W
} from '../config/constants';
import { ITEMS } from '../data/items';
import { NODE_DEFS } from '../data/nodes';
import { RECIPES } from '../data/recipes';
import { gameContext } from '../core/gameContext';
import { RNG } from '../core/rng';
import { Inventory } from '../systems/inventory';
import { loadSlot, saveSlot } from '../systems/save';
import { decayStats } from '../systems/stats';
import { generateWorld } from '../systems/worldgen';

const PLAYER_SPRITESHEET_KEY = 'player_spritesheet';

export class PlayingScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private nodeGraphics = new Map<string, Phaser.GameObjects.Image>();
  private enemyGraphics = new Map<string, Phaser.GameObjects.Image>();
  private structureGraphics = new Map<string, Phaser.GameObjects.Image>();
  private worldGraphics!: Phaser.GameObjects.Graphics;
  private dayOverlay!: Phaser.GameObjects.Rectangle;
  private hud!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private fixedAccumulator = 0;
  private readonly fixedStep = 1 / 30;
  private actionTimer = 0;
  private actionTarget: string | null = null;
  private autosaveTimer = 0;
  private rng = new RNG(START_SEED);

  constructor() {
    super('Playing');
  }


  preload(): void {
    this.load.spritesheet(PLAYER_SPRITESHEET_KEY, 'assets/characters/player-character.PNG', { frameWidth: 32, frameHeight: 32 });
  }

  create(): void {
    this.createTextures();
    this.createPlayerAnimations();
    this.bootstrapContext();

    this.worldGraphics = this.add.graphics();
    this.drawTerrain();
    this.spawnWorldObjects();

    const spawn = this.playerSpawn();
    this.player = this.add.sprite(spawn.x, spawn.y, PLAYER_SPRITESHEET_KEY, 0).setDepth(50).setOrigin(0.5, 1);
    this.player.play('player_idle');

    this.cameras.main.setBounds(0, 0, WORLD_W * TILE_SIZE, WORLD_H * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.2);

    this.dayOverlay = this.add
      .rectangle(0, 0, WORLD_W * TILE_SIZE, WORLD_H * TILE_SIZE, PALETTE.nightTint, 0)
      .setOrigin(0)
      .setDepth(900)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,F,I,C,ESC,M,L,N,ONE,TWO,THREE') as Record<string, Phaser.Input.Keyboard.Key>;

    this.hud = this.add.text(10, 10, '', { fontSize: '14px', color: PALETTE.hudText }).setScrollFactor(0).setDepth(1000);
    this.prompt = this.add.text(10, 86, '', { fontSize: '13px', color: PALETTE.promptText }).setScrollFactor(0).setDepth(1000);

    this.input.keyboard?.on('keydown-ESC', () => this.scene.launch('Paused'));
    this.input.keyboard?.on('keydown-M', () => this.scene.launch('MainMenu'));
    this.input.keyboard?.on('keydown-L', () => this.tryLoad());
    this.input.keyboard?.on('keydown-N', () => {
      this.newGame(this.rng.int(1, 999999));
      this.refreshScene();
    });
  }

  update(_time: number, deltaMs: number): void {
    if (this.scene.isActive('Paused') || this.scene.isActive('MainMenu') || this.scene.isActive('GameOver')) return;
    const dt = deltaMs / 1000;
    this.fixedAccumulator += dt;
    while (this.fixedAccumulator >= this.fixedStep) {
      this.fixedAccumulator -= this.fixedStep;
      this.fixedUpdate(this.fixedStep);
    }
    this.renderHUD();
  }

  private bootstrapContext(): void {
    const loaded = loadSlot(1);
    if (!loaded || loaded.version !== SAVE_VERSION) {
      this.newGame(START_SEED);
      return;
    }
    gameContext.seed = loaded.worldSeed;
    gameContext.timeOfDay = loaded.timeOfDay;
    gameContext.day = loaded.metadata.day;
    gameContext.playtime = loaded.metadata.playtime;
    gameContext.stats = loaded.player.stats;
    gameContext.inventory.fromJSON(loaded.player.inventory);
    gameContext.equipment = loaded.player.equipment;
    gameContext.nodes = loaded.nodes;
    gameContext.structures = loaded.structures;
    gameContext.enemies = loaded.enemies;
  }

  private newGame(seed: number): void {
    gameContext.seed = seed;
    const world = generateWorld(seed);
    gameContext.nodes = world.nodes;
    gameContext.timeOfDay = 0;
    gameContext.day = 1;
    gameContext.playtime = 0;
    gameContext.stats = { health: 100, maxHealth: 100, hunger: 100, maxHunger: 100, sanity: 100, maxSanity: 100 };
    gameContext.scienceBuilt = false;
    gameContext.inventory = new Inventory(20);
    gameContext.inventory.add('twigs', 6);
    gameContext.inventory.add('grass', 6);
    gameContext.inventory.add('berries', 4);
    gameContext.inventory.add('flint', 3);
    gameContext.equipment = { hand: null, body: null };
    gameContext.structures = [];
    gameContext.enemies = [{ id: 'hound_0', x: world.spawn.x + 260, y: world.spawn.y + 130, health: 20 }];
  }

  private fixedUpdate(dt: number): void {
    this.handleInput(dt);
    this.handleActions(dt);
    this.updateNodes();
    this.updateEnemies(dt);
    this.updateStatsAndClock(dt);
    this.autosaveTimer += dt;
    if (this.autosaveTimer > AUTOSAVE_SECONDS) {
      this.persist();
      this.autosaveTimer = 0;
    }
  }

  private handleInput(dt: number): void {
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) vy += 1;
    const moving = vx !== 0 || vy !== 0;
    const len = Math.hypot(vx, vy) || 1;
    this.player.x += (vx / len) * PLAYER_SPEED * dt;
    this.player.y += (vy / len) * PLAYER_SPEED * dt;
    this.player.x = Phaser.Math.Clamp(this.player.x, 0, WORLD_W * TILE_SIZE);
    this.player.y = Phaser.Math.Clamp(this.player.y, 0, WORLD_H * TILE_SIZE);
    if (moving && this.actionTarget) this.cancelAction('Interrupted by movement');

    if (moving) {
      this.player.play('player_run', true);
      this.player.setFlipX(vx < 0);
    } else if (!this.actionTarget) {
      this.player.play('player_idle', true);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.startInteract();
    if (Phaser.Input.Keyboard.JustDown(this.keys.F)) this.attack();
    if (Phaser.Input.Keyboard.JustDown(this.keys.I)) this.consumeFirstFood();
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.craft('axe');
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.craft('pickaxe');
    if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.craft('torch');
    if (Phaser.Input.Keyboard.JustDown(this.keys.C)) this.placeStructure();
  }

  private handleActions(dt: number): void {
    if (!this.actionTarget) return;
    this.actionTimer -= dt;
    if (this.actionTimer > 0) return;

    const node = gameContext.nodes.find((n) => n.id === this.actionTarget);
    this.actionTarget = null;
    if (!node || !node.available) return;

    const def = NODE_DEFS[node.type];
    const tool = gameContext.equipment.hand ? ITEMS[gameContext.equipment.hand]?.tool : undefined;
    const damage = tool?.kind === def.preferredTool ? 3 : 1;
    node.hp -= damage;

    if (node.hp <= 0) {
      node.available = false;
      node.regrowAt = gameContext.playtime + def.regrowSeconds;
      this.nodeGraphics.get(node.id)?.setVisible(false);
      for (const drop of def.dropTable) {
        const amount = this.rng.int(drop.min, drop.max);
        if (!gameContext.inventory.add(drop.itemId, amount)) this.prompt.setText('Inventory full!');
        gameContext.eventBus.emit('ItemCollected', { itemId: drop.itemId, amount });
      }
      return;
    }

    this.actionTarget = node.id;
    this.actionTimer = 0.8;
  }

  private updateNodes(): void {
    for (const node of gameContext.nodes) {
      if (!node.available && node.regrowAt !== undefined && gameContext.playtime >= node.regrowAt) {
        node.available = true;
        node.hp = NODE_DEFS[node.type].maxHp;
        this.nodeGraphics.get(node.id)?.setVisible(true);
      }
    }
  }

  private updateEnemies(dt: number): void {
    for (const enemy of gameContext.enemies) {
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (distance < 150) {
        const dirX = (this.player.x - enemy.x) / Math.max(distance, 1);
        const dirY = (this.player.y - enemy.y) / Math.max(distance, 1);
        enemy.x += dirX * 48 * dt;
        enemy.y += dirY * 48 * dt;
        if (distance < 20) {
          gameContext.stats.health -= 5 * dt;
          gameContext.stats.sanity -= 2 * dt;
        }
      }
      this.enemyGraphics.get(enemy.id)?.setPosition(enemy.x, enemy.y);
    }
  }

  private updateStatsAndClock(dt: number): void {
    gameContext.playtime += dt;
    gameContext.timeOfDay += dt;

    const cycle = DAY_LENGTH + DUSK_LENGTH + NIGHT_LENGTH;
    if (gameContext.timeOfDay >= cycle) {
      gameContext.timeOfDay -= cycle;
      gameContext.day += 1;
      this.persist();
    }

    const phase = gameContext.timeOfDay < DAY_LENGTH ? 'day' : gameContext.timeOfDay < DAY_LENGTH + DUSK_LENGTH ? 'dusk' : 'night';
    if (phase !== gameContext.phase) {
      gameContext.phase = phase;
      gameContext.eventBus.emit(phase === 'night' ? 'NightStarted' : 'DayStarted');
    }

    gameContext.stats = decayStats(gameContext.stats, dt, gameContext.phase, !this.isInLight(), this.enemyNear());
    if (gameContext.stats.health <= 0) {
      gameContext.eventBus.emit('PlayerDied');
      this.persist('dead');
      this.scene.launch('GameOver');
    }

    if (gameContext.phase === 'night') this.dayOverlay.setFillStyle(PALETTE.nightTint, 0.40);
    else if (gameContext.phase === 'dusk') this.dayOverlay.setFillStyle(PALETTE.duskTint, 0.18);
    else this.dayOverlay.setFillStyle(PALETTE.nightTint, 0);
  }

  private startInteract(): void {
    const node = gameContext.nodes.find(
      (n) => n.available && Phaser.Math.Distance.Between(n.x, n.y, this.player.x, this.player.y) <= INTERACT_RANGE
    );
    if (!node) {
      this.prompt.setText('Nothing to interact with.');
      return;
    }
    this.actionTarget = node.id;
    this.actionTimer = 0.8;
    this.prompt.setText(`Harvesting ${node.type.replace('_', ' ')}...`);
  }

  private cancelAction(reason: string): void {
    this.actionTarget = null;
    this.prompt.setText(reason);
  }

  private attack(): void {
    const enemy = gameContext.enemies.find((e) => Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < INTERACT_RANGE + 8);
    if (!enemy) return;
    enemy.health -= 7;
    gameContext.eventBus.emit('DamageTaken', { target: 'enemy', damage: 7 });
    if (enemy.health <= 0) {
      gameContext.enemies = gameContext.enemies.filter((e) => e.id !== enemy.id);
      this.enemyGraphics.get(enemy.id)?.destroy();
      this.enemyGraphics.delete(enemy.id);
      gameContext.inventory.add('claw', 1);
    }
  }

  private consumeFirstFood(): void {
    const food = gameContext.inventory.slots.find((s) => s && ITEMS[s.itemId].edible);
    if (!food) return;
    const edible = ITEMS[food.itemId].edible!;
    gameContext.inventory.remove(food.itemId, 1);
    gameContext.stats.hunger += edible.hunger ?? 0;
    gameContext.stats.health += edible.health ?? 0;
    gameContext.stats.sanity += edible.sanity ?? 0;
  }

  private craft(recipeId: string): void {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return;
    if (recipe.unlock === 'science' && !gameContext.scienceBuilt) {
      this.prompt.setText('Requires science machine.');
      return;
    }
    if (!gameContext.inventory.hasIngredients(recipe.ingredients)) {
      this.prompt.setText('Missing ingredients.');
      return;
    }

    recipe.ingredients.forEach((i) => gameContext.inventory.remove(i.itemId, i.amount));
    gameContext.inventory.add(recipe.output.itemId, recipe.output.amount);
    if (['axe', 'pickaxe', 'torch'].includes(recipe.output.itemId)) gameContext.equipment.hand = recipe.output.itemId;
    gameContext.eventBus.emit('CraftCompleted', recipe.id);
  }

  private placeStructure(): void {
    if (gameContext.inventory.remove('campfire_kit', 1)) {
      const id = `camp_${Date.now()}`;
      gameContext.structures.push({ id, type: 'campfire', x: this.player.x + 20, y: this.player.y, fuel: 60 });
      const sprite = this.add.image(this.player.x + 20, this.player.y, ASSET_IDS.campfire).setDepth(35).setScale(1.1);
      this.structureGraphics.set(id, sprite);
      return;
    }

    if (gameContext.inventory.remove('science_kit', 1)) {
      const id = `science_${Date.now()}`;
      gameContext.structures.push({ id, type: 'science', x: this.player.x + 20, y: this.player.y, fuel: 0 });
      gameContext.scienceBuilt = true;
      const sprite = this.add.image(this.player.x + 20, this.player.y, ASSET_IDS.science).setDepth(35).setScale(1.1);
      this.structureGraphics.set(id, sprite);
    }
  }

  private isInLight(): boolean {
    if (gameContext.phase !== 'night') return true;
    if (gameContext.equipment.hand === 'torch') return true;
    return gameContext.structures.some((s) => s.type === 'campfire' && Phaser.Math.Distance.Between(s.x, s.y, this.player.x, this.player.y) < 90);
  }

  private enemyNear(): boolean {
    return gameContext.enemies.some((e) => Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < 140);
  }

  private persist(status: 'alive' | 'dead' = 'alive'): void {
    saveSlot(1, {
      version: SAVE_VERSION,
      metadata: { day: gameContext.day, playtime: gameContext.playtime, status },
      worldSeed: gameContext.seed,
      timeOfDay: gameContext.timeOfDay,
      player: {
        x: this.player?.x ?? this.playerSpawn().x,
        y: this.player?.y ?? this.playerSpawn().y,
        stats: gameContext.stats,
        inventory: gameContext.inventory.toJSON(),
        equipment: gameContext.equipment
      },
      nodes: gameContext.nodes,
      structures: gameContext.structures,
      enemies: gameContext.enemies
    });
  }

  private tryLoad(): void {
    const loaded = loadSlot(1);
    if (!loaded || loaded.version !== SAVE_VERSION) {
      this.prompt.setText('No compatible save in slot 1.');
      return;
    }
    this.refreshScene();
  }

  private refreshScene(): void {
    this.scene.restart();
  }

  private renderHUD(): void {
    const equipped = gameContext.equipment.hand ?? 'none';
    this.hud.setText([
      `Day ${gameContext.day} (${gameContext.phase})`,
      `HP ${gameContext.stats.health.toFixed(0)} | Hunger ${gameContext.stats.hunger.toFixed(0)} | Sanity ${gameContext.stats.sanity.toFixed(0)}`,
      `Equipped: ${equipped}`,
      'WASD move | E harvest | F attack | I eat | 1/2/3 craft | C place | Esc pause | M menu'
    ]);
  }

  private playerSpawn(): { x: number; y: number } {
    return { x: Math.floor(WORLD_W / 2) * TILE_SIZE, y: Math.floor(WORLD_H / 2) * TILE_SIZE };
  }

  private drawTerrain(): void {
    this.worldGraphics.clear();
    for (let y = 0; y < WORLD_H; y += 1) {
      for (let x = 0; x < WORLD_W; x += 1) {
        const biomeNoise = this.hash2D(x >> 2, y >> 2, gameContext.seed + 101);
        const detailNoise = this.hash2D(x >> 1, y >> 1, gameContext.seed + 389);
        const isMeadow = biomeNoise > 0.42;
        const base = isMeadow ? (detailNoise > 0.52 ? PALETTE.meadowA : PALETTE.meadowB) : (detailNoise > 0.52 ? PALETTE.forestA : PALETTE.forestB);
        this.worldGraphics.fillStyle(base, 1);
        this.worldGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        const dirtRoll = this.hash2D(x, y, gameContext.seed + 777);
        if (dirtRoll > 0.975) {
          this.worldGraphics.fillStyle(PALETTE.dirtPatch, 0.20);
          this.worldGraphics.fillRect(x * TILE_SIZE + 6, y * TILE_SIZE + 6, 12, 12);
        }
      }
    }
  }

  private spawnWorldObjects(): void {
    this.nodeGraphics.forEach((sprite) => sprite.destroy());
    this.nodeGraphics.clear();
    this.structureGraphics.forEach((sprite) => sprite.destroy());
    this.structureGraphics.clear();
    this.enemyGraphics.forEach((sprite) => sprite.destroy());
    this.enemyGraphics.clear();

    for (const node of gameContext.nodes) {
      const sprite = this.add.image(node.x, node.y, this.nodeAssetId(node.type)).setDepth(30).setScale(1.15).setVisible(node.available);
      this.nodeGraphics.set(node.id, sprite);
    }

    for (const structure of gameContext.structures) {
      const texture = structure.type === 'campfire' ? ASSET_IDS.campfire : ASSET_IDS.science;
      const sprite = this.add.image(structure.x, structure.y, texture).setDepth(35).setScale(1.1);
      this.structureGraphics.set(structure.id, sprite);
    }

    for (const enemy of gameContext.enemies) {
      const sprite = this.add.image(enemy.x, enemy.y, ASSET_IDS.enemy).setDepth(40).setScale(1.12);
      this.enemyGraphics.set(enemy.id, sprite);
    }
  }

  private nodeAssetId(type: string): string {
    if (type === 'tree') return ASSET_IDS.tree;
    if (type === 'boulder') return ASSET_IDS.boulder;
    if (type === 'berry_bush') return ASSET_IDS.berryBush;
    if (type === 'sapling') return ASSET_IDS.sapling;
    return ASSET_IDS.grassTuft;
  }

  private hash2D(x: number, y: number, seed: number): number {
    const n = Math.sin((x * 127.1 + y * 311.7 + seed * 0.113) * 0.0174533) * 43758.5453;
    return n - Math.floor(n);
  }



  private createPlayerAnimations(): void {
    if (!this.anims.exists('player_idle')) {
      this.anims.create({ key: 'player_idle', frames: [{ key: PLAYER_SPRITESHEET_KEY, frame: 0 }], frameRate: 1, repeat: -1 });
    }
    if (!this.anims.exists('player_run')) {
      this.anims.create({ key: 'player_run', frames: [{ key: PLAYER_SPRITESHEET_KEY, frame: 0 }], frameRate: 10, repeat: -1 });
    }
    if (!this.anims.exists('player_jump')) {
      this.anims.create({ key: 'player_jump', frames: [{ key: PLAYER_SPRITESHEET_KEY, frame: 0 }], frameRate: 1, repeat: -1 });
    }
  }

  private createTextures(): void {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    if (!this.textures.exists(PLAYER_SPRITESHEET_KEY)) {
      g.clear();
      g.fillStyle(0x000000, 0.2); g.fillEllipse(16, 28, 16, 6);
      g.fillStyle(0x263245); g.fillRoundedRect(11, 18, 10, 10, 2);
      g.fillStyle(0xeccdaf); g.fillCircle(16, 12, 6);
      g.fillStyle(0x4e5c7a); g.fillRect(12, 20, 8, 8);
      g.generateTexture(PLAYER_SPRITESHEET_KEY, 32, 32);
    }

    g.clear();
    g.fillStyle(0x000000, 0.2); g.fillEllipse(12, 18, 12, 4);
    g.fillStyle(0x6e3a2f); g.fillEllipse(12, 12, 16, 13);
    g.fillStyle(0xaf5a49); g.fillEllipse(12, 12, 11, 9);
    g.fillStyle(0x281816); g.fillCircle(9, 10, 1.3); g.fillCircle(15, 10, 1.3);
    g.generateTexture(ASSET_IDS.enemy, 24, 24);

    g.clear();
    g.fillStyle(0x6f4e2f); g.fillRect(10, 11, 4, 10);
    g.fillStyle(0x3f7d3c); g.fillCircle(12, 9, 8);
    g.fillStyle(0x336632); g.fillCircle(8, 10, 4); g.fillCircle(16, 10, 4);
    g.generateTexture(ASSET_IDS.tree, 24, 24);

    g.clear();
    g.fillStyle(0x828a92); g.fillRoundedRect(4, 8, 16, 12, 4);
    g.fillStyle(0xa8afb6); g.fillRoundedRect(8, 10, 6, 3, 2);
    g.fillStyle(0x6f767d); g.fillRoundedRect(12, 13, 5, 2, 2);
    g.generateTexture(ASSET_IDS.boulder, 24, 24);

    g.clear();
    g.fillStyle(0x4f8f45); g.fillCircle(12, 15, 6);
    g.fillStyle(0x5ea250); g.fillCircle(8, 13, 4); g.fillCircle(16, 13, 4);
    g.fillStyle(0x8f3d70); g.fillCircle(9, 14, 1.6); g.fillCircle(14, 16, 1.6); g.fillCircle(16, 12, 1.6);
    g.generateTexture(ASSET_IDS.berryBush, 24, 24);

    g.clear();
    g.fillStyle(0x6da94e); g.fillTriangle(12, 9, 6, 20, 18, 20);
    g.fillStyle(0x54853e); g.fillTriangle(12, 11, 8, 20, 16, 20);
    g.generateTexture(ASSET_IDS.sapling, 24, 24);

    g.clear();
    g.fillStyle(0x57893e); g.fillRect(10, 14, 4, 8);
    g.fillStyle(0x8bcb62); g.fillTriangle(12, 8, 6, 17, 18, 17);
    g.generateTexture(ASSET_IDS.grassTuft, 24, 24);

    g.clear();
    g.fillStyle(0x6e5237); g.fillRoundedRect(7, 15, 10, 6, 2);
    g.fillStyle(0xffa23a); g.fillTriangle(12, 7, 7, 16, 17, 16);
    g.fillStyle(0xffd887); g.fillTriangle(12, 9, 9, 16, 15, 16);
    g.generateTexture(ASSET_IDS.campfire, 24, 24);

    g.clear();
    g.fillStyle(0x7e95ad); g.fillRoundedRect(6, 9, 12, 12, 2);
    g.fillStyle(0x4fd3ff); g.fillRect(10, 5, 4, 4);
    g.fillStyle(0x2f3f55); g.fillRect(5, 20, 14, 2);
    g.generateTexture(ASSET_IDS.science, 24, 24);

    g.destroy();
  }
}
