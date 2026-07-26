export type BlockType = 
  | 'GRASS'
  | 'DIRT'
  | 'STONE'
  | 'WATER'
  | 'SAND'
  | 'WOOD_LOG'
  | 'LEAVES'
  | 'PLANKS'
  | 'COBBLESTONE'
  | 'BRICK'
  | 'WALL_BEIGE'
  | 'WALL_WHITE'
  | 'WALL_STONE'
  | 'ROOF_BROWN'
  | 'ROOF_RED'
  | 'ROOF_BLUE'
  | 'ROOF_DARK'
  | 'FENCE'
  | 'FLOWER'
  | 'LAMP'
  | 'CAUTION_TAPE'
  | 'TABLE_WOOD'
  | 'GOLD_ORE'
  | 'COAL_ORE'
  | 'IRON_ORE'
  | 'CRYSTAL_ORE'
  | 'HERB'
  | 'BERRY_BUSH'
  | 'MUSHROOM'
  | 'TREASURE_CHEST'
  | 'CROPS'
  | 'BENCH'
  | 'LOG_SEAT'
  | 'BBQ_GRILL'
  | 'CIRCUS_TENT'
  | 'FERRIS_WHEEL'
  | 'MERRY_GO_ROUND'
  | 'ICE_CREAM_CART'
  | 'BALLOON_STAND'
  | 'WATERFALL'
  | 'BEEHIVE'
  | 'COW'
  | 'CHICKEN'
  | 'SHEEP'
  | 'HORSE'
  | 'GOAT'
  | 'RABBIT'
  | 'DEER'
  | 'DUCK'
  | 'DOG'
  | 'CAT'
  | 'BOXING_RING'
  | 'SMALL_POND'
  | 'WINDMILL'
  | 'STONE_MONOLITH'
  | 'HAY_BALE'
  | 'GAZEBO'
  | 'STONE_WELL'
  | 'WOODEN_BRIDGE'
  | 'MARKET_STALL'
  | 'CAMPFIRE'
  | 'GARDEN_ARCH'
  | 'TRAINING_DUMMY'
  | 'FOUNTAIN';

export type ToolType = 'HAND' | 'PICKAXE' | 'AXE' | 'SHOVEL' | 'SWORD' | 'BUILD_WAND';

export interface BlockDef {
  id: BlockType;
  name: string;
  color: number;
  topColor?: number;
  sideColor?: number;
  transparent?: boolean;
  isFluid?: boolean;
  isInteractable?: boolean;
  hardness: number; // seconds to mine with correct tool
  preferredTool: ToolType;
  icon: string;
  category: 'terrain' | 'building' | 'nature' | 'decoration';
  lightEmission?: number;
  isCustomMesh?:
    | 'fence'
    | 'flower'
    | 'caution'
    | 'table'
    | 'lamp'
    | 'coal'
    | 'iron'
    | 'gold'
    | 'crystal'
    | 'herb'
    | 'berry'
    | 'mushroom'
    | 'chest'
    | 'crops'
    | 'bench'
    | 'log_seat'
    | 'bbq'
    | 'circus'
    | 'ferris'
    | 'merry'
    | 'icecream'
    | 'balloon'
    | 'waterfall'
    | 'beehive'
    | 'cow'
    | 'chicken'
    | 'sheep'
    | 'horse'
    | 'goat'
    | 'rabbit'
    | 'deer'
    | 'duck'
    | 'dog'
    | 'cat'
    | 'ring'
    | 'pond'
    | 'windmill'
    | 'monolith'
    | 'hay_bale'
    | 'gazebo'
    | 'well'
    | 'bridge'
    | 'market_stall'
    | 'campfire'
    | 'garden_arch'
    | 'training_dummy'
    | 'fountain';
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'block' | 'tool' | 'consumable' | 'quest';
  blockType?: BlockType;
  toolType?: ToolType;
  count: number;
  icon: string;
  description: string;
  power?: number;
}

export interface Quest {
  id: string;
  title: string;
  summary: string;
  giverNpcId: string;
  giverName: string;
  status: 'available' | 'active' | 'completed';
  objectives: {
    id: string;
    description: string;
    current: number;
    target: number;
    type: 'mine' | 'build' | 'talk' | 'inspect';
    targetId?: string;
  }[];
  rewardGold: number;
  rewardExp: number;
  rewardItem?: { name: string; count: number; icon: string; id: string };
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  x: number;
  y: number;
  z: number;
  targetX?: number;
  targetZ?: number;
  rotation: number;
  headStyle: 'villager' | 'guard' | 'merchant' | 'detective' | 'blacksmith' | 'wizard';
  outfitColor: string;
  hairColor: string;
  isBot?: boolean;
  level: number;
  dialogue: {
    greeting: string;
    options: {
      text: string;
      response: string;
      action?: 'accept_quest' | 'complete_quest' | 'open_shop' | 'heal' | 'hint';
      questId?: string;
    }[];
  };
  questMarker?: 'question' | 'exclamation' | 'none';
  statusBubble?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole?: 'Player' | 'System' | 'Town Guard' | 'Elder' | 'Bot' | 'Detective';
  text: string;
  timestamp: string;
  color?: string;
}

export interface PlayerStats {
  name: string;
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  gold: number;
  title: string;
  headStyle: string;
  outfitColor: string;
}

export interface WorldCoord {
  x: number;
  y: number;
  z: number;
}

export type MonsterType = 'wolf' | 'bear' | 'goblin' | 'zombie' | 'elite';

export interface MonsterDef {
  type: MonsterType;
  name: string;
  icon: string;
  hp: number;
  speed: number;
  damage: number;
  goldReward: number;
  isElite?: boolean;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  icon: string;
  category: 'tools' | 'weapons' | 'cooking' | 'brewing' | 'smelting' | 'building';
  description: string;
  ingredients: { name: string; icon: string; count: number }[];
  result: { name: string; icon: string; count: number; blockType?: BlockType };
  craftTimeMs?: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  summary: string;
  icon: string;
  category: 'chop' | 'mine' | 'fish' | 'cook' | 'craft' | 'monsters' | 'explore' | 'gold';
  current: number;
  target: number;
  rewardGold: number;
  rewardExp: number;
  completed: boolean;
  claimed: boolean;
  guideSteps?: string[];
}
