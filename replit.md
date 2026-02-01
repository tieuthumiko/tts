# Discord TTS Bot (Vietnamese)

## Overview
A Discord bot that converts text to speech using Google TTS with Vietnamese language support. Users can type `!say <message>` in a text channel, and the bot will join their voice channel and speak the message.

## Project Structure
- `index.js` - Main bot entry point
- `package.json` - Node.js dependencies

## Dependencies
- discord.js v14 - Discord API wrapper
- @discordjs/voice - Voice channel support
- gtts - Google Text-to-Speech

## System Dependencies
- ffmpeg - Audio processing
- libopus - Audio codec

## Environment Variables
- `TOKEN` - Discord bot token (required)

## Usage
1. Start the bot with `node index.js`
2. In Discord, join a voice channel
3. Type `!say <your message>` in a text channel
4. The bot will join your voice channel and speak the message in Vietnamese
