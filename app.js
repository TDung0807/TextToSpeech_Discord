const {Client} = require("discord.js")
const {token} = require("./config.json")

const client = new Client({intents: []});

client.login(token);