const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require("@discordjs/voice");
const gTTS = require("gtts");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("messageCreate", async msg => {
  if (!msg.content.startsWith("!say")) return;

  const text = msg.content.slice(5);
  const vc = msg.member.voice.channel;
  if (!vc) return msg.reply("vào voice trước đi 😭");

  const tts = new gTTS(text, "vi");
  tts.save("tts.mp3", () => {
    const conn = joinVoiceChannel({
      channelId: vc.id,
      guildId: msg.guild.id,
      adapterCreator: msg.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer();
    const resource = createAudioResource("tts.mp3");
    conn.subscribe(player);
    player.play(resource);
  });
});

client.login(process.env.TOKEN);

