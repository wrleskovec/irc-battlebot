var irc = require('irc');
var nlp = require('nlp_compromise');
var _ = require('lodash');
var Attack = require('./attack.js');
var fs = require('fs');

//Bot Settings
var channel = '##mencius';
var botName = 'wp-battlebot';
var server = 'irc.rizon.net';
var statsFile = './'+ channel + '-statistics.json';
var stats;

function openStats() {
  try {
    stats = require(statsFile);
  }
  catch(e) {
    console.log(e);
    stats = {nicks: {}, attacks: {}};
  }
}


function saveStats(){
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
function getNewPlayers(client, stats) {
  var chanNicks = client.chans[channel].users;
  _.forEach(chanNicks, function(val, key){
    if(!_.has(stats.nicks, key)){
      stats.nicks[key] = newPlayer();
    }
  });
}
function initAttack(attack) {
  return {
    damage : Math.floor(Math.random() * 50 + 10),
    times: 1
  };
}
function rechargeMp(){
  stats.nicks = _.mapValues(stats.nicks, function(nick){
    if(nick.mp <= 90) nick.mp += 10;
    return nick;
  });
  console.log('Mp recharged!');
}
function attackPlayer(client, message, words) {
  var nick = message.nick;
  var targetNick;
  _.some(stats.nicks, function(val, key){
    if(words.indexOf(key) > -1){
      targetNick = key;
      return true;
    }
    return false;
  });
  var attack = nlp.verb(words[0]).conjugate().infinitive;

  if(!stats.attacks[attack]){
    stats.attacks[attack] = initAttack(attack);
  }
  else {
    stats.attacks[attack].times++;
  }
  // addAttack(nick, attack);
  // addAttack(nickTarget, attack);
  // resolveAttack(nick, nickTarget, attack);
  var newAttack = Attack(attack, nick, targetNick, stats);
  client.say(channel, newAttack.attackPlayer());
  saveStats();
}

function initBot(server, botName, channel) {
  openStats();
  var client = new irc.Client(server, botName, {
    channels: [channel]
  });

  client.once('join', function(){
    console.log('joined the channel');
    setInterval(rechargeMp, 30000);
    client.addListener('raw', function(message) {
      //need to do the same for nick changes and joins
      if (message.command === 'rpl_namreply'){
        console.log('USEFUL!!!!!!');
        getNewPlayers(client, stats);
        console.log(util.inspect(stats, false, null));
      }
      else if (message.command === 'NICK') {
        if (!stats.nicks[message.args[0]]) {
          stats.nicks[message.args[0]] = newPlayer();
        }
      }
      else if (message.command === 'JOIN') {
        if (!stats.nicks[message.nick]) {
          stats.nicks[message.nick] = newPlayer();
        }
      }
      //console.log(message);
      if (message.args[0] === channel && message.args[1] && /ACTION/g.test(message.args[1])) {
        var text = /.ACTION ([\w\s-]+)./.exec(message.args[1])[1];
        var words = text.split(" ");
        attackPlayer(client, message, words);
        console.log(stats);
      }
    });
  });

}

initBot(server, botName, channel);
