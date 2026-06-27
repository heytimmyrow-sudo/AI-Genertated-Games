import { SETTINGS } from "../config/settings.js";

const { THREE } = window;

const chargeStatePattern = /charge|dive|pounce/i;
const areaStatePattern = /slam|splash|pulse|gust|burst|howl/i;

export function updateAttackCooldown(entity, deltaSeconds) {
  entity.attackCooldown = Math.max(0, (entity.attackCooldown ?? 0) - deltaSeconds);
}

export function getPlayerFeetY(player) {
  return player.group.position.y - SETTINGS.player.height / 2;
}

export function getPlayerVerticalDelta(attackerPosition, player) {
  return Math.abs(getPlayerFeetY(player) - attackerPosition.y);
}

export function getHorizontalDistance(attackerPosition, player) {
  return Math.hypot(
    player.group.position.x - attackerPosition.x,
    player.group.position.z - attackerPosition.z,
  );
}

export function canReachPlayerFrom(attackerPosition, player, horizontalRange, verticalRange) {
  return getHorizontalDistance(attackerPosition, player) <= horizontalRange
    && getPlayerVerticalDelta(attackerPosition, player) <= verticalRange;
}

export function getBossAttackProfile(state, config = {}) {
  const contactDamage = config.contactDamage ?? 16;
  if (chargeStatePattern.test(state)) {
    return {
      amount: config.chargeDamage ?? contactDamage * 1.45,
      horizontalRange: 2.8,
      verticalRange: 3.7,
      cooldown: 1.05,
      hitKind: "charge",
    };
  }
  if (areaStatePattern.test(state)) {
    return {
      amount: config.areaDamage ?? contactDamage * 1.25,
      horizontalRange: 5.4,
      verticalRange: 4.2,
      cooldown: 1.18,
      hitKind: "area",
    };
  }
  return {
    amount: contactDamage,
    horizontalRange: 2.15,
    verticalRange: 3.25,
    cooldown: 0.95,
    hitKind: "contact",
  };
}

export function tryDamagePlayer({
  attacker,
  player,
  amount,
  horizontalRange,
  verticalRange,
  cooldown = SETTINGS.enemies.playerDamageCooldown,
  sourcePosition = null,
  feedback = null,
  hitKind = "contact",
}) {
  if (!attacker || !player?.takeDamage || player.defeated || player.inSafeZone || (attacker.attackCooldown ?? 0) > 0) {
    return false;
  }

  const position = sourcePosition ?? attacker.group?.position ?? attacker.position;
  if (!position || !canReachPlayerFrom(position, player, horizontalRange, verticalRange)) {
    return false;
  }

  const damaged = player.takeDamage(amount, position, { cooldown, hitKind });
  if (!damaged) {
    return false;
  }

  attacker.attackCooldown = cooldown;
  feedback?.spawnImpact?.(
    player.group.position.clone().add(new THREE.Vector3(0, -0.16, 0)),
    hitKind === "area" ? 0xffb15f : 0xff6f4d,
    hitKind === "charge" ? 1.45 : 1,
  );
  feedback?.shake?.(hitKind === "charge" ? 0.14 : 0.08);
  return true;
}
