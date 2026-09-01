import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialisation sécurisée du client Gemini
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Clé API GEMINI_API_KEY manquante.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper pour parser le JSON de Gemini
function safeJsonParse(rawText: string | undefined | null, fallback: any = {}) {
  if (!rawText) return fallback;
  const clean = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      } catch (err) {
        return fallback;
      }
    }
    return fallback;
  }
}

// Préparation des images pour l'IA
function processImageDataForGemini(imageData: string | null | undefined) {
  if (!imageData) return null;
  if (imageData.startsWith("data:")) {
    const matches = imageData.match(/^data:([^;]+);(base64,)?(.*)$/);
    if (matches) {
      return {
        inlineData: {
          mimeType: matches[1].includes("svg") ? "image/svg+xml" : (matches[1] || "image/jpeg"),
          data: matches[3]
        }
      };
    }
  }
  return { inlineData: { mimeType: "image/jpeg", data: imageData } };
}

// ---------------------------------------------------------
// ENDPOINTS API (Tous propulsés par gemini-3.7-flash)
// ---------------------------------------------------------

// 1. Appréciations Bulletins
app.post("/api/ai/appreciation", async (req, res) => {
  try {
    const { studentName, classLevel, subject, mark, classAverage } = req.body;
    const ai = getGeminiClient();
    const prompt = `Tu es un professeur chevronné. Rédige une appréciation scolaire constructive, encourageante et concise (2 phrases max) pour l'élève ${studentName || 'l\'élève'} en ${subject || 'cette matière'}. Note obtenue: ${mark}/20 (Moyenne de la classe: ${classAverage || '10'}/20). Réponds directement avec l'appréciation en français.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });
    res.json({ appreciation: response.text ? response.text.trim() : "Travail satisfaisant, poursuivez vos efforts." });
  } catch (error: any) {
    res.status(500).json({ error: error.message, appreciation: "Résultats réguliers, continuez ainsi." });
  }
});

// 2. Assistant Plateforme / Superviseur (Le cerveau de l'app)
app.post("/api/ai/platform-assistant", async (req, res) => {
  try {
    const { prompt: userPrompt, students, classes, currentSchool } = req.body;
    const ai = getGeminiClient();
    const prompt = `Tu es l'assistant IA intelligent de gestion d'établissement scolaire (${currentSchool?.name || 'Gestionnaire Scolaire'}).
Analyse et réponds de manière experte à la demande suivante de l'administrateur ou de l'enseignant :
Demande : ${userPrompt}
Données contextuelles disponibles :
- Élèves : ${JSON.stringify(students ? students.slice(0, 30) : [])}
- Classes : ${JSON.stringify(classes || [])}

Formatte ta réponse en JSON valide avec { "response": "Texte clair et structuré", "suggestedActions": ["Action 1", "Action 2"] }.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    res.json(safeJsonParse(response.text, { response: response.text || "Demande traitée avec succès.", suggestedActions: [] }));
  } catch (error: any) {
    res.status(500).json({ error: error.message, response: "Le service d'assistance est momentanément indisponible." });
  }
});

// 3. Scan de Liste de Classe (OCR Roster)
app.post("/api/ai/scan-roster", async (req, res) => {
  try {
    const { imageData, images, textContent, targetClassName } = req.body;
    const ai = getGeminiClient();
    const promptText = `Tu es un expert en numérisation de listes d'élèves scolaires.
Extrais chaque élève détecté avec exactitude et formate la réponse sous format JSON strict avec la structure suivante :
{
  "className": "${targetClassName || 'Classe détectée'}",
  "students": [
    {
      "lastName": "NOM",
      "firstName": "Prénom(s)",
      "gender": "M" ou "F",
      "dateOfBirth": "AAAA-MM-JJ" ou "JJ/MM/AAAA" (si disponible),
      "parentPhone": "Numéro téléphone parent" (si disponible),
      "matricule": "Numéro matricule" (si mentionné)
    }
  ]
}
Trie la liste alphabétiquement par NOM puis Prénom. Corrige les fautes de frappe évidentes.`;
    
    let contents: any[] = [];
    const allImages = images && Array.isArray(images) && images.length > 0 ? images : (imageData ? [imageData] : []);
    for (const img of allImages) {
      const part = processImageDataForGemini(img);
      if (part) contents.push(part);
    }
    contents.push(promptText);
    if (textContent) contents.push(`Texte source collé :\n${textContent}`);

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contents,
      config: { responseMimeType: "application/json" }
    });
    res.json(safeJsonParse(response.text, { className: targetClassName || 'Classe', students: [] }));
  } catch (error: any) {
    res.status(500).json({ error: "Erreur scan", details: error.message });
  }
});

// 4. Numérisation d'Épreuves d'Examen & Devoirs (Word IA & OCR)
app.post("/api/ai/scan-exam-paper", async (req, res) => {
  try {
    const { imageData, images, textContent, targetSubject, targetClass, examType, schoolName, includeHeader } = req.body;
    const ai = getGeminiClient();
    
    const promptText = `Tu es un secrétaire pédagogique d'élite et inspecteur académique.
Tu dois transcrire ou formater cette épreuve scolaire (texte brut collé depuis Word/document, ou photo/scan manuscrit/imprimé) en un document d'examen officiel parfait et prêt à imprimer / exporter en Word.

Directives absolues :
1. Titre : Ex: "DEVOIR SURVEILLÉ N°1 DU PREMIER TRIMESTRE" ou "COMPOSITION DU 1ER TRIMESTRE".
2. Matière : ${targetSubject || 'Matière détectée'}.
3. Classe : ${targetClass || 'Classe détectée'}.
4. Durée : Ex: "02 Heures" ou "03 Heures" selon le niveau.
5. Coefficient : Détecte ou suggère un coefficient adapté (ex: 2, 3 ou 4).
6. Consignes : Ex: "Calculatrices non autorisées. La clarté et la rigueur de la rédaction seront valorisées."
7. Contenu complet (Exercices & Problème) :
   - Transcris fidèlement mot à mot tous les exercices, textes, questions, sous-questions (1.a, 1.b, etc.) et barèmes (ex: (6 points)).
   - Pour les mathématiques et sciences : utilise des symboles propres (ex: √(x), (a)/(b), x², x₁, AB², etc.).
   - Si l'épreuve est longue ou comporte un Problème / Exercice 3 ou 4 nécessitant une deuxième page (Verso), insère explicitement la balise : [--- PAGE 2 / VERSO ---] avant le problème ou l'exercice situé au verso.
   - Si une figure géométrique ou un schéma est décrit, décris-le clairement entre crochets (ex: [FIGURE GÉOMÉTRIQUE : Triangle ABC rectangle en A avec AB=6cm, AC=8cm]).

Retourne UNIQUEMENT un JSON avec les clés :
{
  "title": "Titre officiel de l'évaluation",
  "subjectName": "Nom de la matière",
  "className": "Classe ciblée",
  "duration": "Durée",
  "coefficient": 2,
  "instructions": "Consignes officielles",
  "content": "Contenu complet textuel avec exercices, barèmes et sauts de page [--- PAGE 2 / VERSO ---]"
}`;

    let contents: any[] = [];
    const allImages = images && Array.isArray(images) && images.length > 0 ? images : (imageData ? [imageData] : []);
    for (const img of allImages) {
      const part = processImageDataForGemini(img);
      if (part) contents.push(part);
    }
    contents.push(promptText);
    if (textContent) {
      contents.push(`Texte collé de l'épreuve à numériser et structurer :\n${textContent}`);
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contents,
      config: { responseMimeType: "application/json" }
    });

    const parsed = safeJsonParse(response.text, {
      title: `DEVOIR SURVEILLÉ - ${(targetSubject || 'ÉVALUATION').toUpperCase()}`,
      subjectName: targetSubject || 'Matière',
      className: targetClass || 'Classe',
      duration: '02 Heures',
      coefficient: 2,
      instructions: 'La clarté du raisonnement et la propreté de la copie seront prises en compte.',
      content: textContent || "EXERCICE 1 :\n\n..."
    });

    res.json(parsed);
  } catch (error: any) {
    console.error("Erreur /api/ai/scan-exam-paper:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Synchronisation et Réalignement Parfait Image/Scan avec Document Word
app.post("/api/ai/sync-exam-paper", async (req, res) => {
  try {
    const { imageData, images, currentPaper, targetSubject, targetClass } = req.body;
    const ai = getGeminiClient();

    const promptText = `Tu es un réviseur typographique et correcteur d'examen.
Compare minutieusement le document transcrit actuel avec l'image scannée d'origine.
Document actuel :
Titre: ${currentPaper?.title}
Matière: ${currentPaper?.subjectName}
Classe: ${currentPaper?.className}
Contenu actuel :
${currentPaper?.content}

Tâche :
1. Révise et corrige toute omission, mot manquant, faute d'orthographe ou symbole mathématique déformé pour être 100% identique au scan d'origine.
2. Assure-toi que les barèmes sont équilibrés sur 20 points au total.
3. Conserve la balise [--- PAGE 2 / VERSO ---] pour la séparation Recto/Verso si applicable.

Retourne un JSON avec :
{
  "title": "${currentPaper?.title || 'Titre'}",
  "subjectName": "${currentPaper?.subjectName || targetSubject || 'Matière'}",
  "className": "${currentPaper?.className || targetClass || 'Classe'}",
  "duration": "${currentPaper?.duration || '02 Heures'}",
  "coefficient": ${currentPaper?.coefficient || 2},
  "instructions": "${currentPaper?.instructions || 'Rédiger avec soin'}",
  "content": "Contenu parfaitement synchronisé et corrigé",
  "correctionsCount": 1
}`;

    let contents: any[] = [];
    const allImages = images && Array.isArray(images) && images.length > 0 ? images : (imageData ? [imageData] : []);
    for (const img of allImages) {
      const part = processImageDataForGemini(img);
      if (part) contents.push(part);
    }
    contents.push(promptText);

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contents,
      config: { responseMimeType: "application/json" }
    });

    const parsed = safeJsonParse(response.text, currentPaper || {});
    res.json(parsed);
  } catch (error: any) {
    res.status(500).json({ error: error.message, ...req.body.currentPaper });
  }
});

// 6. Copilote / Modification d'Épreuve en direct (Ajout exo, barème, difficulté)
app.post("/api/ai/modify-exam-paper", async (req, res) => {
  try {
    const { currentPaper, userInstruction, chatHistory } = req.body;
    const ai = getGeminiClient();

    const prompt = `Tu es l'assistant pédagogique secrétaire d'examen.
Épreuve actuelle :
- Titre : ${currentPaper?.title}
- Matière : ${currentPaper?.subjectName} (${currentPaper?.className})
- Durée : ${currentPaper?.duration} | Coeff : ${currentPaper?.coefficient}
- Consignes : ${currentPaper?.instructions}
- Contenu :
${currentPaper?.content}

Instruction de modification de l'enseignant : "${userInstruction}"

Applique rigoureusement la modification demandée sur le contenu, le barème ou les consignes tout en maintenant un niveau d'excellence pédagogique.
Retourne un JSON :
{
  "updatedPaper": {
    "title": "${currentPaper?.title}",
    "subjectName": "${currentPaper?.subjectName}",
    "className": "${currentPaper?.className}",
    "duration": "${currentPaper?.duration}",
    "coefficient": ${currentPaper?.coefficient || 2},
    "instructions": "${currentPaper?.instructions}",
    "content": "Nouveau contenu mis à jour"
  },
  "aiMessage": "Explication claire et professionnelle de la modification apportée"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    res.json(safeJsonParse(response.text, {
      updatedPaper: currentPaper,
      aiMessage: "Modification enregistrée avec succès."
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Commande Promoteur (Master Commander)
app.post("/api/ai/promoter-command", async (req, res) => {
  try {
    const { promoterInstruction, schools } = req.body;
    const ai = getGeminiClient();
    const prompt = `Tu es le superviseur général des établissements scolaires pour le promoteur Victor Mahounou.
Analyse l'ordre ou la question du promoteur : "${promoterInstruction}".
Données des écoles du réseau : ${JSON.stringify(schools || [])}

Fournis une réponse stratégique claire et synthétique en JSON :
{
  "analysis": "Synthèse et analyse globale",
  "actionSummary": "Actions recommandées ou exécutées",
  "recommendations": ["Recommandation 1", "Recommandation 2"]
}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    res.json(safeJsonParse(response.text, { analysis: response.text || "Analyse effectuée.", recommendations: [] }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// GESTION DU SERVEUR ET DE VITE
// ---------------------------------------------------------

const APP_VERSION = "3.8.3";
const SERVER_BOOT_TIME = new Date().toISOString();

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur actif sur le port ${PORT} [Version ${APP_VERSION}]`);
  });
}

// LANCEMENT DU SERVEUR
startServer().catch((err) => {
  console.error("Échec du démarrage du serveur:", err);
});