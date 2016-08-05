var nlp = require('nlp_compromise');
var _ = require('lodash');


function Attack(attackName, nick, targetNick, stats) {
  function initMessage() {
    var pastTense = nlp.verb(attackName).conjugate().past;
    return nick + ' ' + pastTense + ' ' + targetNick;
  }
  this.attackName = attackName;
  this.attack = stats.attacks[attackName];
  this.attacks = stats.attacks;
  this.nick = stats.nicks[nick];
  this.targetNick = stats.nicks[targetNick];
  this.multiplier = 1;
  this.response = initMessage();
}

Attack.prototype.addAttack = function (nickname) {
  var attackHistory = nickname.attackHistory;
  if (attackHistory[this.attackName]) attackHistory[this.attackName]++;
  else {
    attackHistory[this.attackName] = 1;
  }
};

Attack.prototype.ratioAttacksPlayer = function (attackHistory) {
  var attacks = _.keys(attackHistory);
  var items = attacks.length;
  var i;
  var total = 0;
  for (i = 0; i < items; i++) {
    total += attackHistory[i];
  }
  return 1 + (attackHistory[this.attackName] / (total / items));
};

Attack.prototype.calculateAttackResistance = function () {
  var playerRatio = this.ratioAttacksPlayer(this.nick.attackHistory);
  var targetRatio = this.ratioAttacksPlayer(this.targetNick.attackHistory);
  return (playerRatio / targetRatio);
};

Attack.prototype.lvlUp = function (player) {
  this.refreshHp(player);
  player.xp -= 100;
  player.lvl += 1;
  this.response += ' Gained a lvl.';
};

Attack.prototype.refreshHp = function (player) {
  player.hp = 100;
  player.mp = 100;
};

Attack.prototype.resolveDamageDealt = function () {
  var baseDamage = this.attack.damage + (Math.random() * 5);
  var damage = Math.floor(baseDamage * this.multiplier);
  var xp = 10;
  this.targetNick.hp = this.targetNick.hp -= damage;
  this.response += (' Deals ' + damage + ' damage.');
  if (this.targetNick.hp < 1) {
    xp += Math.floor(this.targetNick.lvl / (this.nick.lvl * 100));
    this.refreshHp(this.targetNick);
    this.response += ' KO!';
  }
  this.nick.xp += xp;
  if (this.nick.xp >= 100) {
    this.lvlUp(this.nick);
  }
  if (this.targetNick.xp >= 100) {
    this.lvlUp(this.targetNick);
  }
};

Attack.prototype.resolveMp = function () {
  var newMp = this.mp - this.attack.damage;
  if (newMp > 0) this.mp = newMp;
  else {
    this.mp = 0;
  }
};

Attack.prototype.resolveAttackEffects = function () {
  var critical;
  var resistance;
  var lvlRatio;
  critical = Math.random() > 0.8;
  resistance = this.calculateAttackResistance();
  lvlRatio = this.nick.lvl / this.targetNick.lvl;
  if (resistance > 1.1) {
    this.response += ' and it\'s super effective!';
    this.multiplier = 2;
  } else if (resistance < 0.9) {
    this.response += ', but it\'s not very effective.';
    this.multiplier = 0.5;
  } else {
    this.response += '.';
  }

  if (critical) {
    this.multiplier *= 2;
    this.response += ' Critical hit!';
  }
  this.multiplier *= lvlRatio;
};

Attack.prototype.resolveAttack = function () {
  var Miss = (Math.random() * 100) > this.nick.mp;
  this.resolveMp();
  if (Miss) {
    this.response += ', but missed.';
  } else {
    this.resolveAttackEffects();
    this.resolveDamageDealt();
  }
};
Attack.prototype.attackPlayer = function () {
  this.addAttack(this.nick);
  this.addAttack(this.targetNick);
  this.resolveAttack();
  return this.response;
};

module.exports = function (attackName, nick, targetNick, stats) {
  return new Attack(attackName, nick, targetNick, stats);
};
