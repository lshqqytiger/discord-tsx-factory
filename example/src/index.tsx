import { createElement, Fragment, Client } from "discord-tsx-factory";
import * as Discord from "discord.js";

const client = new Client({ intents: [Discord.IntentsBitField.Flags.Guilds] });

client.on("ready", () => {
  console.log("ready");

  client.initializeSlashCommand(
    <command
      onSubmit={(event) => {
        event.reply("reply!");
      }}
      name="command"
      description="description"
    >
      <subcommandgroup name="group" description="group description">
        <subcommand name="subcommand" description="subcommand description">
          <string
            name="param1"
            description="param1 description"
            required={true}
          >
            <choice name="choice1" value="1" />
            <choice name="choice2" value="2" />
          </string>
        </subcommand>
      </subcommandgroup>
    </command>
  );
});

client.on("messageCreate", (message) => {
  if (message.content === "!embed")
    message.channel.send({
      embeds: (
        <>
          <embed title="title" color="Orange">
            <field name="field 1">field text 1</field>
            <field name="field 2">field text 2</field>
          </embed>
        </>
      ),
    });
  else if (message.content === "!button")
    message.channel.send({
      content: "message",
      components: (
        <>
          <row>
            <button
              customId="button1"
              onClick={(event) => {
                event.reply("button1 clicked");
              }}
            >
              primary button
            </button>
            <linkbutton url="https://github.com">link button</linkbutton>
          </row>
        </>
      ),
    });
  else if (message.content === "!select")
    message.channel.send({
      content: "message",
      components: (
        <>
          <row>
            <select
              customId="select1"
              onChange={(event) => {
                event.reply(`${event.values[0]} selected`);
              }}
            >
              <option label="option1" description="description1" value="1" />
              <option label="option2" description="description2" value="2" />
            </select>
          </row>
        </>
      ),
    });
});

client.login("your token");
