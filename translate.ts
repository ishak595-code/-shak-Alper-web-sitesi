import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is missing');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const localesDir = path.join(process.cwd(), 'src', 'locales');
const trData = JSON.parse(fs.readFileSync(path.join(localesDir, 'tr.json'), 'utf8'));

const getFlattenedKeys = (obj: any, prefix = ''): any => {
  return Object.keys(obj).reduce((acc: any, k: string) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, getFlattenedKeys(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};

const unflatten = (data: any) => {
  if (Object(data) !== data || Array.isArray(data)) return data;
  var result: any = {}, cur: any, prop: string, parts: string[], idx: boolean;
  for (var p in data) {
    cur = result, prop = "", parts = p.split(".");
    for (var i = 0; i < parts.length; i++) {
      idx = !isNaN(parseInt(parts[i]));
      cur = cur[prop] || (cur[prop] = (idx ? [] : {}));
      prop = parts[i];
    }
    cur[prop] = data[p];
  }
  return result[""];
};

const trFlat = getFlattenedKeys(trData);

const languages = {
  'en.json': 'English',
  'ku.json': 'Kurdish (Kurmanci)',
  'fr.json': 'French',
  'de.json': 'German',
  'es.json': 'Spanish',
  'ar.json': 'Arabic',
  'ru.json': 'Russian',
  'zh.json': 'Chinese (Simplified)',
  'it.json': 'Italian'
};

async function processLanguage(filename: string, langName: string) {
  console.log(`Processing ${filename}...`);
  const filePath = path.join(localesDir, filename);
  let langData: any = {};
  if (fs.existsSync(filePath)) {
    langData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  
  const langFlat = getFlattenedKeys(langData);
  const missingKeys: any = {};
  
  for (const [key, value] of Object.entries(trFlat)) {
    // Only capture keys that are missing. Don't overwrite existing ones
    // unless they fall back to EN currently
    if (langFlat[key] === undefined) {
      missingKeys[key] = value;
    }
  }
  
  const keysCount = Object.keys(missingKeys).length;
  if (keysCount === 0) {
    console.log(`No missing keys for ${filename}.`);
    return;
  }
  
  console.log(`Found ${keysCount} missing keys for ${filename}. Translating to ${langName}...`);
  
  const prompt = `Translate the following JSON object values from Turkish to ${langName}. Preserve the exact JSON structure and keys. Return valid JSON only.\n\n${JSON.stringify(missingKeys, null, 2)}`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
          responseMimeType: 'application/json'
      }
    });
    
    let resultText = response.text || '';
    const translatedMissing = JSON.parse(resultText);
    
    for (const k of Object.keys(translatedMissing)) {
        langFlat[k] = translatedMissing[k];
    }
    
    // Additional sync to make sure structure exact matches TR
    const finalFlat: any = {};
    for (const key of Object.keys(trFlat)) {
        finalFlat[key] = langFlat[key] !== undefined ? langFlat[key] : trFlat[key];
    }
    
    const unflattenedResult = unflatten(finalFlat);
    
    fs.writeFileSync(filePath, JSON.stringify(unflattenedResult, null, 2), 'utf8');
    console.log(`Updated ${filename} successfully.`);
  } catch (err) {
    console.error(`Error translating ${filename}:`, err);
  }
}

async function run() {
  for (const [filename, langName] of Object.entries(languages)) {
    await processLanguage(filename, langName);
  }
  console.log('All done.');
}

run();
