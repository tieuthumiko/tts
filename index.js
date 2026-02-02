import sodium from "libsodium-wrappers";
await sodium.ready;

import { Client, GatewayIntentBits } from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior
} from "@discordjs/voice";
import { spawn } from "child_process";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

let connection;

client.on("messageCreate", async (msg) => {
  if (msg.content === "!join") {
    if (!msg.member.voice.channel) return;

    connection = joinVoiceChannel({
      channelId: msg.member.voice.channel.id,
      guildId: msg.guild.id,
      adapterCreator: msg.guild.voiceAdapterCreator
    });

    msg.reply("✅ Joined voice");
  }

  if (msg.content === "!tts") {
    if (!connection) return msg.reply("❌ Chưa join voice");

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
      }
    });

    const ffmpeg = spawn("ffmpeg", [
      "-nostdin",
      "-f", "lavfi",
      "-i", "sine=frequency=440",
      "-ac", "2",
      "-ar", "48000",
      "-f", "s16le",
      "pipe:1"
    ]);

    const resource = createAudioResource(ffmpeg.stdout, {
      inlineVolume: true
    });

    resource.volume.setVolume(1.0);

    connection.subscribe(player);
    player.play(resource);

    msg.reply("🔊 Playing sound");
  }

  if (msg.content === "!disconnect") {
    connection?.destroy();
    connection = null;
    msg.reply("👋 Disconnected");
  }
});

client.login(process.env.TOKEN);
