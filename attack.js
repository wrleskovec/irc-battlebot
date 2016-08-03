var nlp = require('nlp_compromise');

function Attack(attackName, player, target, stats) {
  function initMessage() {
    var pastTense = nlp.verb(attackName).conjugate().past;
    return player + " " + pastTense + " " + target;
  }
  this.attackName = attackName;
  this.attack = stats.attacks[attackName]
  this.attacks = stats.attacks;
  this.nick = stats.nicks[player];
  this.targetNick = stats.nicks[target];
  this.multiplier = 1;
  this.response = initMessage();
}

Attack.prototype.addAttack = function(nickname) {
  var attackHistory = nickname.attackHistory;
  if (attackHistory[this.attackName]) attackHistory[this.attackName]++;
  else {
    attackHistory[this.attackName] = 1;
  }
}

Attack.prototype.ratioAttacksPlayer = function(attackHistory) {
  var total = 0;
  var items = 0;
  for (var prop in attackHistory) {
    total += attackHistory[prop];
    items += 1;
  }
  return 1 + attackHistory[this.attackName] / (total / items);
}

Attack.prototype.calculateAttackResistance = function() {

  var playerRatio = this.ratioAttacksPlayer(this.nick.attackHistory);
  var targetRatio = this.ratioAttacksPlayer(this.targetNick.attackHistory);
  // var total = 0;
  // var items = 0;
  // for (var prop in this.attacks) {
  //   total += this.attacks[prop].times;
  //   items += 1;
  // }
  // var totalRatio = 1 + this.attack.times / (total / items);
  return (playerRatio / targetRatio );
}
Attack.prototype.lvlUp = function(player) {
  this.refreshHp(player);
  player.xp -= 100;
  player.lvl += 1;
  this.response += ' Gained a lvl.';
}
Attack.prototype.refreshHp = function(player) {
  player.hp = 100;
  player.mp = 100;
}

Attack.prototype.resolveDamageDealt = function() {
  var baseDamage = this.attack.damage + Math.random() * 5;
  var damage = Math.floor(baseDamage * this.multiplier);
  var xp = 10;
  this.targetNick.hp = this.targetNick.hp -= damage;
  this.response += (' Deals ' + damage + ' damage.');
  if(this.targetNick.hp < 1) {
    xp += Math.floor(this.targetNick.lvl / this.nick.lvl * 100);
    this.refreshHp(this.targetNick);
    this.response += ' KO!';
  }
  this.nick.xp += xp;
  if(this.nick.xp >= 100) {
    this.lvlUp(this.nick);
  }
  if(this.targetNick.xp >= 100) {
    this.lvlUp(this.targetNick);
  }

}
Attack.prototype.resolveMp = function() {
  this.nick.mp = this.nick.mp -= this.attack.damage;
  (this.nick.mp >= 0) ? this.nick.mp = this.nick.mp : this.nick.mp = 0;
}
Attack.prototype.resolveAttack = function() {
  var Miss = (Math.random() * 100) > this.nick.mp;
  this.resolveMp();
  if(Miss){
    this.response += ', but missed.';
  } else {
    var critical = .8 < Math.random();
    var resistance = this.calculateAttackResistance();
    var lvlRatio = this.nick.lvl / this.targetNick.lvl;
    if (resistance > 1.1) {
      this.response += ' and it\'s super effective!';
      this.multiplier = 2;
    }
    else if (resistance < .9) {
      this.response += ', but it\'s not very effective.';
      this.multiplier = .5;
    }
    else {
      this.response += '.';
    }
    if (critical){
      this.multiplier *= 2;
      this.response += ' Critical hit!';
    }
    this.multiplier *= lvlRatio;
    this.resolveDamageDealt();
  }

}
Attack.prototype.attackPlayer = function() {
  this.addAttack(this.nick);
  this.addAttack(this.targetNick);
  this.resolveAttack();
  return this.response;
}

module.exports = function(attackName, player, target, stats) {
  return new Attack(attackName, player, target, stats);
};
