var irc = require('irc');
var nlp = require('nlp_compromise');
var _ = require('lodash');
var createAttack = require('./attack.js');
var fs = require('fs');

// Bot Settings
var channel = '##mencius';
// Because freenode is a little bitch and randomly capitalizes channels in messages
var chanRegex = new RegExp(channel, 'i');
var botName = 'wp-battlebot';
var server = 'freenode.net';
var statsFile = './' + channel + '-statistics.json';
var stats;
var client = new irc.Client(server, botName, {
  channels: [channel]
});

function openStats() {
  try {
    stats = JSON.parse(fs.readFileSync(statsFile));
  } catch (e) {
    stats = {
      nicks: {},
      attacks: {}
    };
  }
}

function isChannel(args) {
  var i;
  for (i = 0; i < args.length; i++) {
    if (chanRegex.test(args[i])) {
      return true;
    }
  }
  return false;
}

function isPM(args) {
  var i;
  for (i = 0; i < args.length; i++) {
    if (args[i] === botName) {
      return true;
    }
  }
  return false;
}

function getActionArg(args) {
  var i;
  for (i = 0; i < args.length; i++) {
    if (/ACTION/g.test(args[i])) {
      return args[i];
    }
  }
  return false;
}

function saveStats() {
  fs.writeFileSync(statsFile, JSON.stringify(stats));
}

function newPlayer() {
  return {
    hp: 100,
    mp: 100,
    lvl: 1,
    xp: 0,
    attackHistory: {}
  };
}

function getNewPlayers() {
  var chanNicks = client.chans[channel].users;
  _.forEach(chanNicks, function (val, key) {
    if (!_.has(stats.nicks, key)) {
      stats.nicks[key] = newPlayer();
    }
  });
}

function initAttack() {
  return {
    damage: Math.floor((Math.random() * 50) + 10),
    times: 1
  };
}

function rechargeMp() {
  stats.nicks = _.mapValues(stats.nicks, function (nick) {
    if (nick.mp <= 90) return nick.mp + 10;
    return nick;
  });
}

function attackPlayer(message, words) {
  var nick = message.nick;
  var attack = nlp.verb(words[0]).conjugate().infinitive;
  var targetNick;
  var newAttack;
  _.some(stats.nicks, function (val, key) {
    if (words.indexOf(key) > -1) {
      targetNick = key;
      return true;
    }
    return false;
  });
  targetNick = targetNick || nick;

  if (!stats.attacks[attack]) {
    stats.attacks[attack] = initAttack();
  } else {
    stats.attacks[attack].times++;
  }
  newAttack = createAttack(attack, nick, targetNick, stats);
  client.say(channel, newAttack.attackPlayer());
  saveStats();
}

function chatHandler(message) {
  var actionMessage;
  var text;
  var words;
  switch (message.command) {
    case 'rpl_namreply':
      getNewPlayers();
      break;
    case 'NICK':
      if (!stats.nicks[message.args[0]]) {
        stats.nicks[message.args[0]] = newPlayer();
      }
      break;
    case 'JOIN':
      if (!stats.nicks[message.nick]) {
        stats.nicks[message.nick] = newPlayer();
      }
      break;
    case 'PRIVMSG':
      actionMessage = getActionArg(message.args);
      if (isChannel(message.args) && actionMessage) {
        text = /.ACTION ([\w\s-]+)./.exec(actionMessage)[1];
        words = text.split(' ');
        attackPlayer(message, words);
      } else if (isPM(message.args)) {
        client.say(message.nick, JSON.stringify(stats.nicks[message.nick]));
      }
      break;
    default:
      break;
  }
}

function initBot() {
  client.once('join', function () {
    console.log('Joined!');
    setInterval(rechargeMp, 30000);
    client.addListener('raw', chatHandler);
  });
}

openStats();
initBot(server, botName, channel);
