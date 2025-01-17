import { SlashCommandBuilder } from '@discordjs/builders';
import config from '../../config.json';

export default {
  data: new SlashCommandBuilder()
    .setName('getpepo')
    .setDescription('Want Pepo for your own server? Get my join url!'),
  async execute(ctx: any) {
    await ctx.interaction.reply({
      content: `<https://discord.com/oauth2/authorize?client_id=${config.clientId}&scope=bot&permissions=274877942784>`,
      ephemeral: true,
    });
  },
};