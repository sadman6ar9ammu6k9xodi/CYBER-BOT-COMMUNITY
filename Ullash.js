const { spawn } = require("child_process");
const axios = require("axios");
const logger = require("./utils/log");

///////////////////////////////////////////////////////////
//========= Create website for dashboard/uptime =========//
///////////////////////////////////////////////////////////

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Serve the index.html file
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

// Start the server and add error handling
app.listen(port, () => {
    logger(`Server is running on port ${port}...`, "[ Starting ]");
}).on('error', (err) => {
    if (err.code === 'EACCES') {
        logger(`Permission denied. Cannot bind to port ${port}.`, "[ Error ]");
    } else {
        logger(`Server error: ${err.message}`, "[ Error ]");
    }
});

/////////////////////////////////////////////////////////
//========= Create start bot and make it loop =========//
/////////////////////////////////////////////////////////

// Initialize global restart counter
global.countRestart = global.countRestart || 0;

function startBot(message) {
    if (message) logger(message, "[ Starting ]");

    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "Cyber.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (codeExit) => {
        if (codeExit !== 0 && global.countRestart < 5) {
            global.countRestart += 1;
            logger(`Bot exited with code ${codeExit}. Restarting... (${global.countRestart}/5)`, "[ Restarting ]");
            startBot();
        } else {
            logger(`Bot stopped after ${global.countRestart} restarts.`, "[ Stopped ]");
        }
    });

    child.on("error", (error) => {
        logger(`An error occurred: ${JSON.stringify(error)}`, "[ Error ]");
    });
};

////////////////////////////////////////////////
//========= Check update from Github =========//
////////////////////////////////////////////////

axios.get("https://raw.githubusercontent.com/cyber-ullash/cyber-bot/main/data.json")
    .then((res) => {
        logger(res.data.name, "[ NAME ]");
        logger(`Version: ${res.data.version}`, "[ VERSION ]");
        logger(res.data.description, "[ DESCRIPTION ]");
    })
    .catch((err) => {
        logger(`Failed to fetch update info: ${err.message}`, "[ Update Error ]");
    });

/////////////////////////////////////////////////////////
//========= Handle reaction events from modules =======//
/////////////////////////////////////////////////////////

const fs = require("fs");
const login = require("fb-chat-api");
const configPath = "./config.json";
const config = require(configPath);
const getText = (moduleName, lang = "en", ...args) => {
    try {
        const langFile = require(`./modules/commands/${moduleName}`).languages?.[lang];
        if (!langFile) return "";
        return langFile?.[args[0]] || "";
    } catch {
        return "";
    }
};

login({ appState: JSON.parse(fs.readFileSync(config.appStatePath, "utf-8")) }, (err, api) => {
    if (err) return logger(`Login failed: ${err}`, "[ Login Error ]");

    global.api = api;

    api.setOptions({
        listenEvents: true,
        selfListen: false,
        logLevel: "silent",
        updatePresence: false
    });

    const commandsDir = './modules/commands';
    const commands = new Map();

    fs.readdirSync(commandsDir).forEach(file => {
        if (file.endsWith('.js')) {
            const command = require(`${commandsDir}/${file}`);
            commands.set(command.config.name, command);
        }
    });

    global.client = {
        commands
    };

    api.listenMqtt((error, event) => {
        if (error) return logger(`Listen error: ${error.message}`, "[ Listen Error ]");

        switch (event.type) {
            case "message_reaction":
                for (const command of commands.values()) {
                    if (typeof command.handleReaction === "function") {
                        try {
                            command.handleReaction({
                                api,
                                event,
                                getText: (lang, ...args) => getText(command.config.name, lang, ...args)
                            });
                        } catch (e) {
                            logger(`Error in handleReaction of ${command.config.name}: ${e.message}`, "[ Reaction Error ]");
                        }
                    }
                }
                break;

            // এখানে অন্য event handlers যোগ করা যাবে যেমন message, event, etc.
        }
    });
});

// Start the bot process
startBot();
