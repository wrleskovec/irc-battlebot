###irc-battlebot

Just a simple irc bot that connects to channel and tries to gamify irc actions. It recognizes almost all verbs used in actions and creates random attacks based on what it can parse from input. All players are derived from irc nicks in chatroom and each player has hp, mp, xp as core stats. The bot also stores attack experience which is used to determine per player effectiveness or resistance to attacks. Mp is recharged by 10 every 30s and determines chance of attack success. All stats are saved to JSON.

##example
```
/me hugs wp-battlebot
< wp-battlebot> toughluck hugged wp-battlebot, but missed.
```

##setup
Just set the relevant server, channel and botname settings in index.js.
`$ node index.js`
