import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, () => {
  console.log("🌐 Web server listening on port " + PORT);
});

import { Client, GatewayIntentBits } from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} from "@discordjs/voice";

import fs from "fs";
import { exec } from "child_process";
import ffmpegPath from "ffmpeg-static";
import gTTS from "gtts";

// ===== CONFIG =====
const PREFIX = "!tts";
const COOLDOWN = 3000; // ms
const TOKEN = process.env.TOKEN;

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const player = createAudioPlayer();
const cooldown = new Map();
let connection = null;

// ===== READY =====
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ===== MESSAGE =====
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  // anti spam
  const last = cooldown.get(msg.author.id) || 0;
  if (Date.now() - last < COOLDOWN) {
    return msg.reply("⏳ từ từ thôi bro");
  }
  cooldown.set(msg.author.id, Date.now());

  const text = msg.content.slice(PREFIX.length).trim();
  if (!text) return msg.reply("❌ nhập nội dung đi");

  const channel = msg.member.voice.channel;
  if (!channel) return msg.reply("❌ vào voice trước");

  // join voice (không tự out)
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: msg.guild.id,
      adapterCreator: msg.guild.voiceAdapterCreator
    });
    connection.subscribe(player);
  }

  // TTS
  const gtts = new gTTS(text, "vi");
  gtts.save("tts.mp3", () => {
    exec(
      `"${ffmpegPath}" -nostdin -y -i tts.mp3 -ar 48000 -ac 1 -af "volume=3.0" out.wav`,
      (err) => {
        if (err) {
          console.error(err);
          return msg.reply("❌ lỗi ffmpeg");
        }

        const resource = createAudioResource("out.wav");
        player.play(resource);
      }
    );
  });
});

// ===== PLAYER =====
player.on(AudioPlayerStatus.Idle, () => {
  // KHÔNG tự disconnect
});

// ===== LOGIN =====
client.login(TOKEN);
