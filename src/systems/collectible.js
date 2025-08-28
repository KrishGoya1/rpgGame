// collectible.js
// small helper: spawnCollectible(scene, x, y, spriteKey, itemId, inventorySystem, questSystem)
// When player overlaps, adds to inventory and notifies questSystem.collectItem

export function spawnCollectible(scene, x, y, spriteKey, itemId, inventorySystem = null, questSystem = null, opts = {}) {
  const spr = scene.physics.add.sprite(x, y, spriteKey);
  spr.setDepth(opts.depth ?? 5);
  spr.setData('itemId', itemId);

  // overlap with player
  const onPickup = (player, obj) => {
    const id = obj.getData('itemId');
    // add to inventory
    if (inventorySystem) inventorySystem.addItem(id, 1);
    // notify quest system (so collection-type quests update)
    if (questSystem) questSystem.collectItem(id, 1);
    // optional sound
    if (opts.soundKey) {
      try { scene.sound.play(opts.soundKey); } catch (e) {}
    }
    obj.destroy();
  };

  scene.physics.add.overlap(scene.player, spr, onPickup, null, scene);

  return spr;
}
