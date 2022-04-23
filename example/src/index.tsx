import { createElement, Fragment, Client } from "discord-tsx";
import * as Discord from "discord.js";

const client = new Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

client.on("ready", () => {
  console.log("ready");
  const channel = client.guilds.cache
    .get("guild id")
    ?.channels.cache.get("channel id") as Discord.TextChannel;

  // send MessageEmbed with Fields
  channel.send({
    embeds: [
      <embed title="title" color="ORANGE">
        <field name="field 1">
          field text 1<emoji name="smiling_imp" />
        </field>
        <field name="field 2">
          field text 2<emoji name="pig" />
        </field>
      </embed>,
    ],
  });
  // send Message with Button
  channel.send({
    content: "message",
    components: [
      <row>
        <button
          customId="button1"
          onClick={(event: Discord.ButtonInteraction) => {
            event.reply("button1 clicked");
          }}
        >
          primary button
        </button>
        <linkbutton url="https://github.com">link button</linkbutton>
      </row>,
    ],
  });
  // send Message with Select-Options
  channel.send({
    content: "message",
    components: [
      <row>
        <select
          customId="select1"
          onChange={(event: Discord.SelectMenuInteraction) => {
            event.reply(`${event.values[0]} selected`);
          }}
        >
          <option label="option1" description="description1" value="1" />
          <option label="option2" description="description2" value="2" />
        </select>
      </row>,
    ],
  });
});

client.login("your token");
