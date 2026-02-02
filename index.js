import { Client, GatewayIntentBits } from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import gTTS from "gtts";
import { exec } from "child_process";
import express from "express";
import fs from "fs";

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const PREFIX = "!";

// ===== KEEP RENDER ALIVE =====
const app = express();
app.get("/", (_, res) => res.send("Bot alive"));
app.listen(3000);

// ===== DISCORD CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

let connection = null;
const player = createAudioPlayer();
const cooldown = new Set();

// ===== DEBUG PLAYER =====
player.on("stateChange", (o, n) => {
  console.log("PLAYER:", o.status, "->", n.status);
});

// ===== READY =====
client.once("ready", () => {
  console.log("✅ Bot online:", client.user.tag);
});

// ===== MESSAGE =====
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(1).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  // ===== !tts =====
  if (cmd === "tts") {
    if (cooldown.has(msg.author.id))
      return msg.reply("⏳ chờ 3 giây nha");

    const text = args.join(" ");
    if (!text) return msg.reply("❌ nhập chữ đi");

    const channel = msg.member.voice.channel;
    if (!channel) return msg.reply("❌ vào voice trước");

    cooldown.add(msg.author.id);
    setTimeout(() => cooldown.delete(msg.author.id), 3000);

    // join voice
    if (!connection) {
      connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: msg.guild.id,
        adapterCreator: msg.guild.voiceAdapterCreator,
      });
      connection.subscribe(player);
    }

    // TTS
    const tts = new gTTS(text, "vi");
    tts.save("tts.mp3", () => {
      // FFmpeg convert + boost volume
      exec(
        `ffmpeg -nostdin -y -i tts.mp3 -af "volume=3.5" -ar 48000 -ac 1 out.wav`,
        (err) => {
          if (err) {
            console.error("FFmpeg error:", err);
            return;
          }

          const resource = createAudioResource("out.wav");
          player.play(resource);
        }
      );
    });
  }

  // ===== !disconnect =====
  if (cmd === "disconnect") {
    if (connection) {
      connection.destroy();
      connection = null;
      msg.reply("👋 đã thoát voice");
    }
  }
});

client.login(TOKEN);
