# User.pet Discord bot

This separate Node app creates the project server layout and gives new members a low-noise welcome. It does not add bot packages to the Vite website.

## Server layout

- **START HERE:** `#welcome`, `#rules`
- **COMMUNITY:** `#general`, `#introductions`, `#ideas-and-feedback`, `#showcase`, `#support`
- **PROJECT UPDATES:** `#announcements`, `#project-updates`, `#changelog`
- **VOICE:** `Community Lounge`
- **STAFF:** private `#staff-chat` and `#mod-logs`
- **Roles:** Admin, Moderator, Artist, Member, New Member

`/setup` is administrator-only and can be run again to repair the layout. It reuses channels and roles with matching names. `/about` and `/guide` privately explain the project and server channels.

New members are assigned the non-mentionable `New Member` role. The bot does not ping members or roles. It groups joins that happen close together into one welcome message, and says clearly that User.pet is in development and the website is not live yet.

`Admin` is created with full server permissions but is never assigned automatically. Choose carefully who receives it in Server Settings. Roles created by the setup command are not mentionable. If the bot cannot assign `New Member`, move the bot's role above `New Member` in the server role list.

## Create and run the bot

1. In the [Discord Developer Portal](https://discord.com/developers/applications), create an application, add a bot, and copy its bot token. Keep the token private.
2. Enable the **Server Members Intent** under the bot's privileged gateway intents. The bot uses it to welcome new joins and assign `New Member`.
3. Invite the bot to your server with the `bot` and `applications.commands` scopes. Grant **Manage Channels**, **Manage Roles**, **View Channels**, **Send Messages**, **Read Message History**, and **Embed Links**. Keep the bot's highest role above `New Member`.
4. Copy `.env.example` to `.env` in this folder and fill in the bot token, application ID, and server ID. These values stay local.
5. From this folder, run `npm install`, `npm run deploy-commands`, then `npm start`.
6. In the server, run `/setup` as an administrator.

The bot must stay running in a Node process to greet members. Firebase Hosting only serves the website; run this bot locally or on a Node host.
