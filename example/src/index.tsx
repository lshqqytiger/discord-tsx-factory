import { React, Discord } from "discord-tsx";

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

client.on("ready", () => {
  console.log("ready");
  const channel = client.guilds.cache
    .get("guild id")
    ?.channels.cache.get("channel id") as Discord.TextChannel;
  channel.send({
    embeds: [
      <embed title="title" color="ORANGE">
        <field name="field name">
          field text
          <emoji name="smiling_imp"></emoji>
        </field>
      </embed>,
    ],
  });
});

client.login("your token");
