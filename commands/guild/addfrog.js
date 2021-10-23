const { SlashCommandBuilder } = require('@discordjs/builders');
const { pipeline } = require('stream/promises');
const axios = require('axios').default;
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ImagePool = require('../../helpers/imagepool');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('frogmod')
    .setDescription('Add or Remove frogs from bot')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a new frog via URL')
        .addStringOption(option => option.setName('url').setDescription('Discord CDN or Plain Image URL')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a frog')
        .addStringOption(option => option.setName('name').setDescription('Filename (SHA256Sum)'))),

  async execute(interaction) {
    // only let bot admin do this
    if (!interaction.user.id === config.managerId) return;

    const url = interaction.options.getString('url');
    const filename = interaction.options.getString('name');

    if (url) {
      console.log(`attempting to add new frog from ${interaction.user.id} - ${url}`);

      // prepare to download file, get fs location
      const fileNameTemp = path.parse(url).base;
      const tempPath = path.resolve(__dirname, '../../frogs/_temp', fileNameTemp);
      const writer = fs.createWriteStream(tempPath);

      // grab the frog, stream it to disk in a temp folder
      const rsp = await axios.request({ url, method: 'GET', responseType: 'stream' })
        .catch((err) => console.log(err));
      await pipeline(rsp.data, writer);

      // pull the temp file from fs
      const tempFileBuffer = await fs.promises.readFile(tempPath);
      console.log(`attempting to write frog to disk as temp file ${tempPath}`);

      // get sha1 hash
      const hashSum = crypto.createHash('sha1');
      hashSum.update(tempFileBuffer);
      const frogHash = hashSum.digest('hex');
      const frogExtension = path.extname(tempPath);
      const frogFileName = `${frogHash}${frogExtension}`;

      // get the frogs directory
      const existingFrogs = await fs.promises.readdir(path.resolve(__dirname, '../../frogs'));
      console.log(`Checking if ${frogFileName} already exists on disk`);

      if (existingFrogs.includes(frogFileName)) {
        console.log(`${frogFileName} Already exists, will not be added to disk`);
        await interaction.reply(`${frogFileName} Already exists, ignoring`);
      }
      else {
        console.log(`${frogFileName} is new, writing temp buffer to disk`);
        const frogAcceptedPath = path.resolve(__dirname, '../../frogs', frogFileName);
        await fs.promises.writeFile(frogAcceptedPath, tempFileBuffer);
        await interaction.reply(`${frogFileName} Accepted to the PepoDB!`);
      }
    }
  },
};