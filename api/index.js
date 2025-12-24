const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc } = require('firebase/firestore');

const app = express();
app.use(express.json());

// --- ដាក់ Firebase Config របស់អ្នកនៅទីនេះ ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ផ្លូវ (Route) នេះត្រូវតែមានពាក្យ /api/ នៅពីមុខ
app.post('/api/aba-webhook', async (req, res) => {
    const notiText = req.body.text || ""; 
    console.log("ទទួលបានសារ៖", notiText);

    let durationMonths = 0;
    let priceString = "";

    if (notiText.includes("9.99")) {
        durationMonths = 1;
        priceString = "$9.99";
    } else if (notiText.includes("109.99")) {
        durationMonths = 12;
        priceString = "$109.99";
    }

    if (durationMonths > 0) {
        try {
            const userQuery = query(collection(db, "users"), 
                              where("status", "==", "pending"), 
                              where("pendingAmount", "==", priceString));

            const querySnapshot = await getDocs(userQuery);
            
            if (querySnapshot.empty) return res.status(404).send("រកមិនឃើញ User");

            for (const userDoc of querySnapshot.docs) {
                const expiryDate = new Date();
                expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
                await updateDoc(userDoc.ref, { 
                    status: "paid",
                    expiryDate: expiryDate
                });
            }
            return res.status(200).send("Success");
        } catch (error) {
            return res.status(500).send("Firebase Error");
        }
    }
    res.status(422).send("Invalid Amount");
});

module.exports = app;
