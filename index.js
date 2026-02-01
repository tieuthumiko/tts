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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // 👉 !tts
  if (command === "tts") {
    const text = args.join(" ");
    if (!text) return msg.reply("ghi nội dung đi 😭");

    const vc = msg.member.voice.channel;
    if (!vc) return msg.reply("vào voice trước đã 😤");

    const tts = new gTTS(text, "vi");
    tts.save("tts.mp3", () => {
      const connection = joinVoiceChannel({
        channelId: vc.id,
        guildId: msg.guild.id,
        adapterCreator: msg.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      const resource = createAudioResource("tts.mp3");

      connection.subscribe(player);
      player.play(resource);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
        fs.unlinkSync("tts.mp3");
      });
    });
  }
});

client.login(process.env.TOKEN);
