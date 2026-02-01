// =====================
// Fake HTTP server cho Render (BẮT BUỘC)
// =====================
const http = require("http");

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Discord TTS bot is running");
  })
  .listen(process.env.PORT || 3000);

// =====================
// Discord TTS Bot
// =====================
const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const gTTS = require("gtts");
const fs = require("fs");

const PREFIX = "!";
const COOLDOWN = 10000; // 10 giây / user

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// lưu connection + player theo server
const connections = new Map();
// lưu cooldown theo user
const cooldowns = new Map();

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // =====================
  // !tts
  // =====================
  if (command === "tts") {
    const text = args.join(" ");
    if (!text) return msg.reply("ghi nội dung đi 😭");

    const vc = msg.member.voice.channel;
    if (!vc) return msg.reply("vào voice trước đã 😤");

    // chống spam
    const last = cooldowns.get(msg.author.id) || 0;
    if (Date.now() - last < COOLDOWN) {
      return msg.reply("từ từ thôi 😅 đợi chút");
    }
    cooldowns.set(msg.author.id, Date.now());

    let data = connections.get(msg.guild.id);

    // nếu bot chưa join voice
    if (!data) {
      const connection = joinVoiceChannel({
        channelId: vc.id,
        guildId: msg.guild.id,
        adapterCreator: msg.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      connection.subscribe(player);

      data = { connection, player };
      connections.set(msg.guild.id, data);
    }

    // TTS tiếng Việt
    const tts = new gTTS(text, "vi");
    tts.save("tts.mp3", () => {
      const resource = createAudioResource("tts.mp3");
      data.player.play(resource);

      data.player.once(AudioPlayerStatus.Idle, () => {
        if (fs.existsSync("tts.mp3")) fs.unlinkSync("tts.mp3");
        // ❌ KHÔNG thoát voice
      });
    });
  }

  // =====================
  // !disconnect
  // =====================
  if (command === "disconnect") {
    const data = connections.get(msg.guild.id);
    if (!data) return msg.reply("bot chưa vào voice 🤨");

    data.connection.destroy();
    connections.delete(msg.guild.id);
    msg.reply("đã thoát voice 👋");
  }
});

client.login(process.env.TOKEN);
