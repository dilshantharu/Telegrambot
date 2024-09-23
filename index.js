const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Replace with your Telegram Bot Token
const TELEGRAM_BOT_TOKEN = process.env['TG_BOT_KEY']; // Use your actual bot token
const OPENWEATHERMAP_API_KEY = process.env['OWM_KEY'] ;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Starter Command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    // Path to the local photo file
    const photoPath = path.join(__dirname, 'https://replit.com/@dilshantharu/boT#test1.jpg');
    const starterMessage = `Welcome to Zara! 🌟\n\nI'm your versatile assistant here to help you with various tasks. Whether you need to download videos, songs, wallpapers, or more, just let me know!\n\nHere are some commands you can use to get started:\n- /download [type] [link] – Download videos, songs, and more.\n- /wallpaper – Get stunning wallpapers.\n- /help – See a list of all commands.\n\nFeel free to ask me anything!`;

    // Send the photo with the caption
    bot.sendPhoto(chatId, photoPath, { caption: starterMessage, reply_to_message_id: msg.message_id })
        .then((/) => {
            console.log('Photo sent with caption.');
        })
        .catch((error) => {
            console.error('Error sending photo:', error.message);
        });
});

// Get random Quotes
function random(from, min = 0) {
    return Math.floor(Math.random() * from) + min;
}

async function randomQuote() {
    const pageId = random(10);
    const fileId = pageId * 50 + random(50, 1);
    const file = (fileId < 10 ? "00" : fileId < 100 ? "0" : "") + fileId;

    const url = `https://raw.githubusercontent.com/ravindu01manoj/Quotes-500k/master/page${pageId}/quotes-${file}-manoj.json`;

    try {
        const res = await axios.get(url);
        const quotes = res.data.data;
        return quotes[random(quotes.length)];
    } catch (error) {
        console.error('Error fetching quotes:', error.message);
        return null;
    }
}

// Quote command handler
bot.onText(/\/quote/, async (msg) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const quote = await randomQuote();

    if (quote) {
        bot.sendMessage(chatId, `▫️ ${quote.quote}\n\n- ${quote.author} -`, {
            reply_to_message_id: messageId,
            parse_mode: 'Markdown'
        });
    } else {
        bot.sendMessage(chatId, 'Sorry, I could not fetch a quote at the moment.', {
            reply_to_message_id: messageId
        });
    }
});

// YT info command handler
bot.onText(/\/ytinfo (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const videoUrl = match[1];

    try {
        // Get video info from YouTube
        const info = await ytdl.getInfo(videoUrl);

        // Extract video details
        const videoDetails = info.videoDetails;
        const durationInMinutes = Math.floor(videoDetails.lengthSeconds / 60);
        const durationInSeconds = videoDetails.lengthSeconds % 60;

        // Prepare the caption text with video details
        const caption = `🎬 *Title*: ${videoDetails.title}\n` +
                        `📺 *Channel*: ${videoDetails.author.name}\n` +
                        `📅 *Publish Date*: ${videoDetails.publishDate}\n` +
                        `👁️ *View Count*: ${videoDetails.viewCount}\n` +
                        `⏳ *Duration*: ${durationInMinutes}:${durationInSeconds.toString().padStart(2, '0')}`;

        // Download the thumbnail
        const thumbnailUrl = videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url;
        const thumbnailPath = path.join(__dirname, `${videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_')}_thumbnail.jpg`);

        const response = await axios({
            url: thumbnailUrl,
            responseType: 'stream',
        });

        response.data.pipe(fs.createWriteStream(thumbnailPath))
            .on('finish', async () => {
                // Send the downloaded thumbnail with the caption
                try {
                    await bot.sendPhoto(chatId, thumbnailPath, {
                        caption: caption,
                        parse_mode: 'Markdown',
                        reply_to_message_id: messageId
                    });
                } catch (err) {
                    console.error('Error sending photo:', err.message);
                    bot.sendMessage(chatId, 'Failed to send the thumbnail.', {
                        reply_to_message_id: messageId
                    });
                } finally {
                    // Clean up the file
                    fs.unlink(thumbnailPath, (err) => {
                        if (err) console.error('Error deleting file:', err.message);
                    });
                }
            })
            .on('error', (err) => {
                console.error('Error downloading thumbnail:', err.message);
                bot.sendMessage(chatId, 'Failed to download the thumbnail.', {
                    reply_to_message_id: messageId
                });
            });

    } catch (error) {
        console.error('Error fetching video info:', error.message);
        bot.sendMessage(chatId, 'Sorry, I could not fetch the video information. Please check the URL and try again.', {
            reply_to_message_id: messageId
        });
    }
});

// Help command
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `Here are the commands you can use:\n\n` +
        `/start - Start the bot and get a welcome message.\n` +
        `/ytinfo [YouTube Video URL] - Get information about a YouTube video.\n` +`/weather [city] - Fetches and displays the current weather information for the specified city.\n`+
        `/test - Check if the bot is online and working.\n` +
        `/help - Get a list of available commands.\n\n` + '- developed By Tharusha Dilshan -';

    bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id
    });
});

// Test command
bot.onText(/\/test/, (msg) => {
    const chatId = msg.chat.id;
    const photoPath = path.join(__dirname, 'https://replit.com/@dilshantharu/boT#test1.jpg'); // Update this path to your photo
    const caption = `👋 Hello! I'm here and ready to assist you.\n\nI am your multi-functional bot, capable of:\n- Downloading videos and songs\n- Fetching information from YouTube\n- And much more!\n\nFeel free to explore my commands:\n- /start: Get started with the bot\n- /ytinfo [YouTube URL]: Get information about a YouTube video\n- /test: Check if I'm online and functioning\n\nIf you have any questions or need help, just ask!`;

    bot.sendPhoto(chatId, photoPath, {
        caption: caption,
        reply_to_message_id: msg.message_id
    }).catch(error => {
        console.error('Error sending photo:', error.message);
    });
});

// Weather command
bot.onText(/\/weather (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;
  const city = match[1].trim();
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;

  try {
    const response = await axios.get(apiUrl);
    const weatherData = response.data;

    const weatherDescription = weatherData.weather[0].description;
    const temperature = weatherData.main.temp;
    const feelsLike = weatherData.main.feels_like;
    const humidity = weatherData.main.humidity;
    const windSpeed = weatherData.wind.speed;

    const weatherMessage = `🌤️ *Weather in ${weatherData.name}:*\n` +
      `- Description: ${weatherDescription}\n` +
      `- Temperature: ${temperature}°C\n` +
      `- Feels like: ${feelsLike}°C\n` +
      `- Humidity: ${humidity}%\n` +
      `- Wind speed: ${windSpeed} m/s\n\n` + `- Zara -`;

    bot.sendMessage(chatId, weatherMessage, {
      parse_mode: 'Markdown',
      reply_to_message_id: messageId
    });

  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    bot.sendMessage(chatId, 'Sorry, I couldn\'t fetch the weather information. Please check the city name and try again.', {
      reply_to_message_id: messageId
    });
  }
});

// Screenshot command handler
bot.onText(/\/ss (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const link = match[1].trim();

    try {
        // Launch Puppeteer browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        // Set the page viewport for screenshot size
        await page.setViewport({ width: 1280, height: 720 });
        await page.goto(link, { waitUntil: 'networkidle2' });
        
        // Take a screenshot and save it
        const screenshotPath = `screenshot_${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath });
        
        await browser.close();
        
        // Send the screenshot to the user
        await bot.sendPhoto(chatId, screenshotPath, { reply_to_message_id: msg.message_id });
        
        // Delete the screenshot file after sending
        fs.unlink(screenshotPath, (err) => {
            if (err) console.error('Error deleting screenshot file:', err.message);
        });
    } catch (error) {
        console.error('Error taking screenshot:', error.message);
        bot.sendMessage(chatId, 'Sorry, I couldn\'t take a screenshot of the website. Please make sure the link is correct.');
    }
});

console.log('Bot started...');
console.log('- Created By Tharusha Dilshan -');