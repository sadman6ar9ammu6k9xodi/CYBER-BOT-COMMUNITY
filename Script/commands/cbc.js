const fs = require("fs");
module.exports.config = {
	name: "🙈",
    version: "1.0.1",
	hasPermssion: 0,
	credits: "Ullash", 
	description: "CYBER BOT COMMUNITY noprefix",
	commandCategory: "no prefix",
	usages: "emoji",
    cooldowns: 5, 
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
	var { threadID, messageID } = event;
	if (event.body.indexOf("🫣🙈")==0 || event.body.indexOf("😘🙈")==0 || event.body.indexOf("sorom kore")==0 || 
event.body.indexOf("🙈")==0 ||  event.body.indexOf("🙈🫣")==0 ||  event.body.indexOf("lojja kore")==0 ||  
event.body.indexOf("🫣")==0) {
		var msg = {
				body: "╭──────•◈•───────╮\n    BOT OWNER Ullash ッ   \n╰──────•◈•───────╯",
				attachment: fs.createReadStream(__dirname + `/ULLASH/Shaon12.mp3`)
			}
			api.sendMessage( msg, threadID, messageID);
    api.setMessageReaction("😋", event.messageID, (err) => {}, true)
		}
	}
	module.exports.run = function({ api, event, client, __GLOBAL }) {

    }
