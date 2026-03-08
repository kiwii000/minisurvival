import Phaser from 'phaser';
import { AUTOSAVE_SECONDS, DAY_LENGTH, DUSK_LENGTH, INTERACT_RANGE, NIGHT_LENGTH, PLAYER_SPEED, START_SEED, TILE_SIZE, WORLD_H, WORLD_W } from '../config/constants';
import { ITEMS } from '../data/items';
import { NODE_DEFS } from '../data/nodes';
import { RECIPES } from '../data/recipes';
import { gameContext } from '../core/gameContext';
import { generateWorld } from '../systems/worldgen';
import { decayStats } from '../systems/stats';
import { loadSlot, saveSlot } from '../systems/save';
import { RNG } from '../core/rng';
import { Inventory } from '../systems/inventory';

export class PlayingScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private nodeGraphics = new Map<string, Phaser.GameObjects.Rectangle>();
  private enemyGraphics = new Map<string, Phaser.GameObjects.Arc>();
  private hud!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private fixedAccumulator = 0;
  private readonly fixedStep = 1 / 30;
  private actionTimer = 0;
  private actionTarget: string | null = null;
  private autosaveTimer = 0;
  private rng = new RNG(START_SEED);

  constructor() { super('Playing'); }

  create(): void {
    const loaded = loadSlot(1);
    if (loaded) {
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
    } else {
      this.newGame(START_SEED);
    }

    this.drawWorld();
    const spawn = this.playerSpawn();
    this.player = this.add.circle(spawn.x, spawn.y, 8, 0xf2f2ff);

    this.cameras.main.setBounds(0, 0, WORLD_W * TILE_SIZE, WORLD_H * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,F,I,C,ESC,M,L,N,ONE,TWO,THREE') as Record<string, Phaser.Input.Keyboard.Key>;

    this.hud = this.add.text(8, 8, '', { fontSize: '14px', color: '#fff' }).setScrollFactor(0).setDepth(1000);
    this.prompt = this.add.text(8, 84, '', { fontSize: '13px', color: '#ffe08a' }).setScrollFactor(0).setDepth(1000);

    this.input.keyboard?.on('keydown-ESC', () => this.scene.launch('Paused'));
    this.input.keyboard?.on('keydown-M', () => this.scene.launch('MainMenu'));
    this.input.keyboard?.on('keydown-L', () => this.tryLoad());
    this.input.keyboard?.on('keydown-N', () => this.newGame(this.rng.int(1, 999999)));
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

  private playerSpawn() {
    return { x: Math.floor(WORLD_W / 2) * TILE_SIZE, y: Math.floor(WORLD_H / 2) * TILE_SIZE };
  }

  private drawWorld(): void {
    this.children.removeAll();
    this.nodeGraphics.clear();
    const graphics = this.add.graphics();
    for (let y = 0; y < WORLD_H; y += 1) {
      for (let x = 0; x < WORLD_W; x += 1) {
        graphics.fillStyle((x + y + gameContext.seed) % 4 === 0 ? 0x294a3a : 0x3f6b4d, 1);
        graphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }
    for (const node of gameContext.nodes) {
      const color = node.type === 'tree' ? 0x2e8b57 : node.type === 'boulder' ? 0x7f8c8d : node.type === 'berry_bush' ? 0x8e44ad : node.type === 'sapling' ? 0x556b2f : 0x9acd32;
      const rect = this.add.rectangle(node.x, node.y, 14, 14, color).setVisible(node.available);
      this.nodeGraphics.set(node.id, rect);
    }
    for (const s of gameContext.structures) {
      this.add.rectangle(s.x, s.y, 14, 14, s.type === 'campfire' ? 0xffa500 : 0x00bfff);
    }
    this.enemyGraphics.clear();
    for (const e of gameContext.enemies) {
      const arc = this.add.circle(e.x, e.y, 7, 0xff7777);
      this.enemyGraphics.set(e.id, arc);
    }
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

  private fixedUpdate(dt: number): void {
    this.handleInput(dt);
    this.handleActions(dt);
    this.updateNodes(dt);
    this.updateEnemies(dt);
    this.updateStatsAndClock(dt);
    this.handleEvents();
    this.autosaveTimer += dt;
    if (this.autosaveTimer > AUTOSAVE_SECONDS) {
      this.persist();
      this.autosaveTimer = 0;
    }
  }

  private handleInput(dt: number): void {
    let vx = 0; let vy = 0;
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

    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.startInteract();
    if (Phaser.Input.Keyboard.JustDown(this.keys.F)) this.attack();
    if (Phaser.Input.Keyboard.JustDown(this.keys.I)) this.consumeFirstFood();
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.craft('axe');
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.craft('pickaxe');
    if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.craft('torch');
    if (Phaser.Input.Keyboard.JustDown(this.keys.C)) this.placeStructure();
  }

  private startInteract(): void {
    const nearest = gameContext.nodes.find((n) => n.available && Phaser.Math.Distance.Between(n.x, n.y, this.player.x, this.player.y) <= INTERACT_RANGE);
    if (!nearest) { this.prompt.setText('Nothing to interact with.'); return; }
    this.actionTarget = nearest.id;
    this.actionTimer = 0.8;
    this.prompt.setText(`Harvesting ${nearest.type}...`);
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
    const dmg = tool?.kind === def.preferredTool ? 3 : 1;
    node.hp -= dmg;
    if (node.hp <= 0) {
      node.available = false;
      node.regrowAt = gameContext.playtime + def.regrowSeconds;
      this.nodeGraphics.get(node.id)?.setVisible(false);
      for (const drop of def.dropTable) {
        const amount = this.rng.int(drop.min, drop.max);
        if (!gameContext.inventory.add(drop.itemId, amount)) this.prompt.setText('Inventory full!');
        gameContext.eventBus.emit('ItemCollected', { itemId: drop.itemId, amount });
      }
    } else {
      this.actionTarget = node.id;
      this.actionTimer = 0.8;
    }
  }

  private cancelAction(reason: string): void {
    this.actionTarget = null;
    this.prompt.setText(reason);
  }

  private attack(): void {
    const e = gameContext.enemies.find((enemy) => Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < INTERACT_RANGE + 8);
    if (!e) return;
    e.health -= 7;
    gameContext.eventBus.emit('DamageTaken', { target: 'enemy', damage: 7 });
    if (e.health <= 0) {
      gameContext.enemies = gameContext.enemies.filter((x) => x.id !== e.id);
      this.enemyGraphics.get(e.id)?.destroy();
      this.enemyGraphics.delete(e.id);
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
    if (recipe.output.itemId === 'axe' || recipe.output.itemId === 'pickaxe' || recipe.output.itemId === 'torch') gameContext.equipment.hand = recipe.output.itemId;
    gameContext.eventBus.emit('CraftCompleted', recipe.id);
  }

  private placeStructure(): void {
    if (gameContext.inventory.remove('campfire_kit', 1)) {
      gameContext.structures.push({ id: `camp_${Date.now()}`, type: 'campfire', x: this.player.x + 20, y: this.player.y, fuel: 60 });
      this.drawWorld();
      return;
    }
    if (gameContext.inventory.remove('science_kit', 1)) {
      gameContext.structures.push({ id: `science_${Date.now()}`, type: 'science', x: this.player.x + 20, y: this.player.y, fuel: 0 });
      gameContext.scienceBuilt = true;
      this.drawWorld();
    }
  }

  private updateNodes(_dt: number): void {
    for (const node of gameContext.nodes) {
      if (!node.available && node.regrowAt !== undefined && gameContext.playtime >= node.regrowAt) {
        node.available = true;
        node.hp = NODE_DEFS[node.type].maxHp;
        this.nodeGraphics.get(node.id)?.setVisible(true);
      }
    }
  }

  private updateEnemies(dt: number): void {
    for (const e of gameContext.enemies) {
      const d = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
      if (d < 150) {
        const dirX = (this.player.x - e.x) / Math.max(d, 1);
        const dirY = (this.player.y - e.y) / Math.max(d, 1);
        e.x += dirX * 50 * dt;
        e.y += dirY * 50 * dt;
        if (d < 20) {
          gameContext.stats.health -= 5 * dt;
          gameContext.stats.sanity -= 2 * dt;
        }
      }
      this.enemyGraphics.get(e.id)?.setPosition(e.x, e.y);
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
    const hasLight = this.isInLight();
    gameContext.stats = decayStats(gameContext.stats, dt, gameContext.phase, !hasLight, this.enemyNear());
    if (gameContext.stats.health <= 0) {
      gameContext.eventBus.emit('PlayerDied');
      this.persist('dead');
      this.scene.launch('GameOver');
    }
    this.cameras.main.setBackgroundColor(gameContext.phase === 'night' ? '#121222' : gameContext.phase === 'dusk' ? '#584e55' : '#2f4f4f');
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
      version: 1,
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
    if (!loaded) {
      this.prompt.setText('No save in slot 1.');
      return;
    }
    this.scene.restart();
  }

  private handleEvents(): void {
    // Event bus is intentionally simple and available for extension.
  }

  private renderHUD(): void {
    const equipped = gameContext.equipment.hand ?? 'none';
    this.hud.setText([
      `Day ${gameContext.day} (${gameContext.phase})`,
      `HP ${gameContext.stats.health.toFixed(0)} | Hunger ${gameContext.stats.hunger.toFixed(0)} | Sanity ${gameContext.stats.sanity.toFixed(0)}`,
      `Equipped: ${equipped}`,
      'Keys: WASD move, E harvest, F attack, I eat, 1/2/3 craft axe/pickaxe/torch, C place, Esc pause, M menu'
    ]);
  }
}
