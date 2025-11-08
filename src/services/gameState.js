// src/services/gameState.js
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the JSON file for persistent storage
const TRIVIA_SCORES_PATH = path.join(__dirname, '../../data/triviaScores.json');

// In-memory cache of trivia scores
let triviaScores = {};

// Load scores from JSON file
async function loadScores() {
  try {
    if (existsSync(TRIVIA_SCORES_PATH)) {
      const data = await readFile(TRIVIA_SCORES_PATH, 'utf-8');
      triviaScores = JSON.parse(data);
      console.log('✅ Loaded trivia scores from disk');
    } else {
      console.log('📝 No existing trivia scores file found, starting fresh');
    }
  } catch (error) {
    console.error('⚠️ Error loading trivia scores:', error.message);
    triviaScores = {}; // Start fresh on error
  }
}

// Save scores to JSON file
async function saveScores() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(TRIVIA_SCORES_PATH);
    if (!existsSync(dataDir)) {
      const { mkdir } = await import('fs/promises');
      await mkdir(dataDir, { recursive: true });
    }

    await writeFile(TRIVIA_SCORES_PATH, JSON.stringify(triviaScores, null, 2), 'utf-8');
  } catch (error) {
    console.error('⚠️ Error saving trivia scores:', error.message);
  }
}

// Initialize scores on module load
loadScores();

export function recordTriviaResult(userId, isCorrect) {
  if (!triviaScores[userId]) {
    triviaScores[userId] = { correct: 0, incorrect: 0 };
  }
  if (isCorrect) triviaScores[userId].correct++;
  else triviaScores[userId].incorrect++;

  // Save to disk after updating
  saveScores();
}

export function getTriviaRecord(userId) {
  if (!triviaScores[userId]) {
    triviaScores[userId] = { correct: 0, incorrect: 0 };
  }
  return triviaScores[userId];
}


const games = new Map();

function generateGameId() {
  return Math.random().toString(36).substring(2, 15);
}

export function createGame(userId, data, gameId = generateGameId()) {
  const game = {
    id: gameId,
    userId,
    data,
    createdAt: Date.now(),
  };
  games.set(gameId, game);

  // ←←← PROPER 30-SECOND TIMEOUT — NO SPAM
  setTimeout(() => {
    if (games.has(gameId)) {
      deleteGame(gameId);
    }
  }, 30 * 1000); // 30 seconds

  return gameId;
}

export function getGame(gameId) {
  return games.get(gameId);
}

export function deleteGame(gameId) {
  games.delete(gameId);
}

// OPTIONAL: AUTO-CLEAN OLD GAMES ON STARTUP
setInterval(() => {
  const now = Date.now();
  for (const [id, game] of games.entries()) {
    if (now - game.createdAt > 60 * 1000) { // 1 minute old
      deleteGame(id);
    }
  }
}, 60 * 1000);
