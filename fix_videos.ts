import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import fs from "fs";

const configPath = "./firebase-applet-config.json";
if (!fs.existsSync(configPath)) {
  console.log("No config found");
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const ref = doc(db, "settings", "general");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    if (data.promotionalVideos) {
      const updated = data.promotionalVideos.map((v: any) => {
        if (v.url && v.url.includes("storage.googleapis.com/gtv-videos-bucket")) {
          return { ...v, url: "https://www.youtube.com/watch?v=LXb3EKWsInQ" };
        }
        return v;
      });
      await updateDoc(ref, { promotionalVideos: updated });
      console.log("Updated promotional videos in Firestore");
    }
  }
  process.exit(0);
}

run();
