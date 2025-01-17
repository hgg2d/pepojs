import { MessageAttachment } from 'discord.js';
import config from '../config.json';
import globalImagePool from '../helpers/imagepool';
import rateLimitControl from '../helpers/ratelimts';

export default {
  name: 'messageCreate',
  async execute(message: any, ctxLogger: any) {
    // no bots
    if (message.author.bot) return;

    // no everyone, mentions.has() includes @everyone/@here
    if (message.mentions.everyone) return;

    // no reply to a reply
    if (message.type === 'REPLY') return;

    // set legacyCommands in config.json with commands to redirect
    if (config.legacyCommands.some(cmd => message.content.startsWith(cmd)) || message.mentions.has(message.client.user)) {
      // mock the context object we use around objects
      const ctx = {
        interaction: message,
        logger: ctxLogger,
      };

      ctx.logger.info('[LEGACY COMMAND] invoked');

      // ratelimit check
      const isLimited = await rateLimitControl.getRatelimitStatus(ctx);

      // workaround until message commands go away for muted channels
      if (isLimited === undefined) {
        return;
      }

      if (isLimited) {
        await ctx.interaction.reply('Slow down! Ratelimit exceeded. Mods, you can adjust with `/froglimit set`');
        return;
      }

      const randomFrog = await globalImagePool.get();
      const attachment = new MessageAttachment(`frogs/${randomFrog}`);

      // dont send warning on modern message
      if (ctx.interaction.mentions.has(ctx.interaction.client.user)) {
        await ctx.interaction.reply({ files: [attachment] });
      }
      else {
        await ctx.interaction.reply(
          {
            content: `After April 30, 2022 the way pepo can reply changes. Tag me in a message with <@${message.client.user.id}> or use \`/pepo\``,
            files: [attachment],
          });
      }

      // ratelimit update
      await rateLimitControl.setChannelLastUsed(ctx);
    }
  },
};