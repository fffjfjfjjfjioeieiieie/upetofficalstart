# user.pet Discord bot (retired)

The former visitor and analytics commands have been removed. This bot no longer calls user.pet or receives visitor data. Deploy the updated bot process to stop handling the old commands, then run `npm run deploy-commands` once to remove the registered `/visitor` and `/analytics` commands from the configured server.

Configure only `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and `DISCORD_GUILD_ID` in the bot host. The old visitor API secrets, administrator allowlist, and visitor notification settings are no longer used. Rotate the Discord bot token because an earlier token was shared in chat.
