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
import express from "express";

/* ================= WEB SERVER (CHO RENDER) ================= */
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, () => {
  console.log("🌐 Web server listening on port " + PORT);
});

/* ================= CONFIG ================= */
const TOKEN = process.env.TOKEN;
const PREFIX_TTS = "!tts";
const PREFIX_DC = "!disconnect";
const COOLDOWN = 3000;

/* ================= DISCORD CLIENT ================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const player = createAudioPlayer();
let connection = null;
const cooldown = new Map();

/* ================= READY ================= */
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

/* ================= MESSAGE HANDLER ================= */
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  /* ===== DISCONNECT ===== */
  if (msg.content === PREFIX_DC) {
    if (connection) {
      connection.destroy();
      connection = null;
      return msg.reply("👋 Đã rời voice");
    } else {
      return msg.reply("❌ Bot chưa ở trong voice");
    }
  }

  /* ===== TTS ===== */
  if (!msg.content.startsWith(PREFIX_TTS)) return;

  // anti-spam
  const last = cooldown.get(msg.author.id) || 0;
  if (Date.now() - last < COOLDOWN) {
    return msg.reply("⏳ chậm lại chút nha");
  }
  cooldown.set(msg.author.id, Date.now());

  const text = msg.content.slice(PREFIX_TTS.length).trim();
  if (!text) return msg.reply("❌ nhập nội dung đi");

  const voiceChannel = msg.member.voice.channel;
  if (!voiceChannel) return msg.reply("❌ vào voice trước");

  // join voice (không tự out)
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: msg.guild.id,
      adapterCreator: msg.guild.voiceAdapterCreator
    });
    connection.subscribe(player);
  }

  // TTS
  const gtts = new gTTS(text, "vi");
  gtts.save("tts.mp3", () => {
    exec(
      `"${ffmpegPath}" -nostdin -y -i tts.mp3 -ar 48000 -ac 1 -af "volume=6.0" out.wav`,
      (err) => {
        if (err) {
          console.error("FFmpeg error:", err);
          return msg.reply("❌ lỗi xử lý âm thanh");
        }

        const resource = createAudioResource("out.wav");
        player.play(resource);
      }
    );
  });
});

/* ================= PLAYER ================= */
player.on(AudioPlayerStatus.Idle, () => {
  // không tự disconnect
});

/* ================= LOGIN ================= */
client.login(TOKEN);
