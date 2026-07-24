require("dotenv").config();

const express = require("express");
const { BotFrameworkAdapter } = require("botbuilder");
const { buildTimeText } = require("./gwtime");
const { buildGwTimeImage } = require("./imageHelper");

const app = express();
app.use(express.json());

const port = process.env.PORT || 3978;
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;

const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword
});

adapter.onTurnError = async (context, error) => {
  console.error(error);
  await context.sendActivity("GWTime hit an error.");
};

function cleanMessage(text) {
  return (text || "")
    .replace(/<at>.*?<\/at>/gi, "")
    .replace(/@\w+/g, "")
    .trim()
    .toLowerCase();
}

app.get("/test/time", (req, res) => {
  res.type("text/plain").send(buildTimeText());
});

app.get("/test/image", async (req, res) => {
  const img = await buildGwTimeImage();
  res.type("png").send(img);
});

app.post("/api/messages", async (req, res) => {
  await adapter.processActivity(req, res, async (context) => {
    if (context.activity.type !== "message") return;

    const text = cleanMessage(context.activity.text);

    if (text === "time" || text === "time?" || text === "beat" || text === "now") {
      await context.sendActivity(buildTimeText());
      return;
    }

    if (text === "time image" || text === "time image?" || text === "beat image") {
      await context.sendActivity({
        text: "GWTime",
        attachments: [
          {
            name: "gwtime.png",
            contentType: "image/png",
            contentUrl: `${publicBaseUrl}/test/image?t=${Date.now()}`
          }
        ]
      });
      return;
    }

    await context.sendActivity("Try `time` or `time image`.");
  });
});

app.listen(port, () => {
  console.log(`GWTime bot running on ${publicBaseUrl}`);
});