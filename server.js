const express = require("express");
const bodyParser = require("body-parser");
const { Expo } = require("expo-server-sdk");
const schedule = require("node-schedule");

const app = express();
const expo = new Expo();
app.use(bodyParser.json());

// Stockage en mémoire (à remplacer par une DB plus tard)
let savedPushTokens = [];

// ➡️ Enregistrer un token depuis l’app
app.post("/register-token", (req, res) => {
  const { token } = req.body;

  if (!Expo.isExpoPushToken(token)) {
    console.log("❌ Token invalide :", token);
    return res.status(400).send("Token invalide");
  }

  if (!savedPushTokens.includes(token)) {
    savedPushTokens.push(token);
    console.log("📲 Token enregistré :", token);
  }

  res.send("Token enregistré 👍");
});

// ➡️ Fonction d’envoi de notifications
async function sendNotifications(title, body) {
  if (savedPushTokens.length === 0) {
    console.log("⚠️ Aucun token enregistré, pas d'envoi.");
    return;
  }

  let messages = savedPushTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
  }));

  let chunks = expo.chunkPushNotifications(messages);

  for (let chunk of chunks) {
    try {
      let receipts = await expo.sendPushNotificationsAsync(chunk);
      console.log("📬 Réponse Expo :", receipts);
    } catch (error) {
      console.error("❌ Erreur envoi notif :", error);
    }
  }
}

// ➡️ Test : envoi dans 1 min
const testTime = new Date();
testTime.setMinutes(testTime.getMinutes() + 1);
testTime.setSeconds(0);

schedule.scheduleJob(testTime, () => {
  console.log("⏰ Envoi test notification...");
  sendNotifications("Test notification 📝", "Ceci est un test !");
});

// ➡️ Notification quotidienne à 23h07
schedule.scheduleJob({ hour: 17, minute: 29 }, () => {
  console.log("⏰ Envoi notification quotidienne...");
  sendNotifications("Mots du jour 📝", "5 nouveaux mots t’attendent !");
});

// ➡️ Lancement serveur
const LOCAL_IP = "192.168.1.134";
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend démarré sur le port ${PORT}`);
});
