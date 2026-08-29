import std.core;
import std.io;

struct SevenBitEncodedIntByte {
    u8 byte;
    if ((byte & 0x80) == 0x00)
        break;
};

struct SevenBitEncodedInt {
    SevenBitEncodedIntByte bytes[while(true)];
} [[sealed, format("transformSevenBitEncodedInt"), transform("transformSevenBitEncodedInt")]];

fn transformSevenBitEncodedInt(ref auto encodedInt) {
  u64 result = 0;

  for (u32 i = 0, i < std::core::member_count(encodedInt.bytes), i += 1) {
    result |= (encodedInt.bytes[i].byte & 0x7F) << (i * 7);
  }
  
  retu

struct String {
    SevenBitEncodedInt size;
    char string[size];
} [[format("formatString")]];

fn formatString(ref auto string) {
    return string.string;
};

struct Object<T> {
    bool hasValue [[tree_hidden]];
    
    if (hasValue)
        T value;
} [[sealed, format("formatObject")]];

fn formatObject(ref auto object) {
    if (!object.hasValue)
        return "<Empty>";
    else
        return object.value;
};

struct KeyValuePair<Key, Value> {
    Key key;
    Value value;
} [[name(std::format("[{}]", this.key))]];

enum Viewpoint : s32 {
    None,
    Front,
    Right,
    Back,
    Left,
    Up,
    Down,
    Perspective
};

struct Vector3 {
    float x, y, z;
};

struct List<T> {
    s32 count;
    T items[count];
};

enum ActorType : s32 {
  None,
  Ladder,
  Bouncer,
  Sign,
  GoldenCube,
  PickUp,
  Bomb,
  Destructible,
  DestructiblePermanent,
  Vase,
  Door,
  Heart,
  Watcher,
  Crystal,
  BlackHole,
  Vine,
  BigBomb,
  TntBlock,
  TntPickup,
  MotorBlock,
  Hurt,
  Checkpoint,
  TreasureChest,
  CubeShard,
  BigHeart,
  SkeletonKey,
  ExploSwitch,
  PushSwitch,
  EightBitDoor,
  PushSwitchSticky,
  PushSwitchPermanent,
  SuckBlock,
  WarpGate,
  OneBitDoor,
  SpinBlock,
  PivotHandle,
  FourBitDoor,
  LightningPlatform,
  LightningGhost,
  Tombstone,
  SplitUpCube,
  UnlockedDoor,
  Hole,
  Couch,
  Valve,
  Rumbler,
  Waterfall,
  Trickle,
  Drips,
  Geyser,
  ConnectiveRail,
  BoltHandle,
  BoltNutBottom,
  BoltNutTop,
  CodeMachine,
  NumberCube,
  LetterCube,
  TriSkull,
  Tome,
  SecretCube,
  LesserGate,
  Crumbler,
  LaserEmitter,
  LaserBender,
  LaserReceiver,
  RebuildingHexahedron,
  TreasureMap,
  Timeswitch,
  TimeswitchMovingPart,
  Mail,
  Mailbox,
  Bookcase,
  TwoBitDoor,
  SixteenBitDoor,
  ThirtyTwoBitDoor,
  SixtyFourBitDoor,
  Owl,
  Bell,
  RotatingGroup,
  BigWaterfall,
  Telescope,
  SinkPickup,
  QrCode,
  FpsPost,
  PieceOfHeart,
  SecretPassage,
  Piston
};

struct TrileEmplacement {
    s32 x, y, z;
};

struct WinConditions {
    s32 lockedDoorCount;
    s32 unlockedDoorCount;
    s32 chestCount;
    s32 cubeShardCount;
    s32 otherCollectibleCount;
    s32 splitUpCount;
    List<s32> scriptIds;
    s32 secretCount;
};

struct LevelSaveData {
    List<TrileEmplacement> destroyedTriles;
    List<TrileEmplacement> inactiveTriles;
    List<s32> inactiveArtObjects;
    List<s32> inactiveEvents;
    List<s32> InactiveGroups;
    List<s32> inactiveVolumes;
    List<s32> inactiveNPCs;
    List<KeyValuePair<s32, s32>> pivotRotations;
    Object<float> lastStableLiquidHeight;
    Object<String> scriptingState;
    bool firstVsisit;
    WinConditions filledConditions;
};

struct FezSaveFile {
    s64 fileTime;

    s64 versionMaybe;
    s64 creationTime;
    bool finished32;
    bool finished64;
    bool hasFpView;
    bool hasStereo3d;
    bool canNewGamePlus;
    bool isNewGamePlus;
    List<KeyValuePair<Object<String>, bool>> oneTimeTutorials;
    Object<String> level;
    Viewpoint view;
    Vector3 ground;
    s64 timeOfDay;
    List<Object<String>> unlockedWarpDestinations;
    s32 keys;
    s32 cubeShards;
    s32 secretCubes;
    s32 collectedParts;
    s32 collectedOwls;
    s32 piecesOfHeart;
    List<Object<String>> maps;
    List<ActorType> artifacts;
    List<Object<String>> earnedAchievements;
    List<Object<String>> earnedGamerPictures;
    Object<String> scriptingState;
    bool fezHidden;
    Object<float> globalWaterLevelModifier;
    bool hasHadMapHelp;
    bool canOpenMap;
    bool achievementCheatCodeDone;
    bool anyCodeDeciphered;
    bool mapCheatCodeDone;
    List<KeyValuePair<Object<String>, LevelSaveData>> worlds;
    bool scoreDirty;
    bool hasDoneHeartReboot;
    s64 playTime;
    bool isNew;
} [[fixed_size(0xA000)]];

FezSaveFile saveFile @ 0x00;