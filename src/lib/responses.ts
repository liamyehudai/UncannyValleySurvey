import fs from 'fs/promises';
import path from 'path';

// Define the path to the responses.json file in the data folder
const RESPONSES_FILE = path.join(process.cwd(), 'data', 'responses.json');

export interface SessionResponse {
  sessionId: string;
  age: number | null;
  survey1: Array<{
    image: string;
    rating: number;
    timestamp: number;
  }>;
  survey2: Array<{
    question: string;
    ranking: string[];
    timestamp: number;
  }>;
}

export async function getResponses(): Promise<SessionResponse[]> {
  try {
    const rawData = await fs.readFile(RESPONSES_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function saveResponses(responses: SessionResponse[]): Promise<void> {
  await fs.writeFile(RESPONSES_FILE, JSON.stringify(responses, null, 2), 'utf-8');
}

export async function addSurvey1Rating(
  sessionId: string,
  age: number | null,
  image: string,
  rating: number
): Promise<void> {
  const responses = await getResponses();
  let session = responses.find((r) => r.sessionId === sessionId);
  if (!session) {
    session = {
      sessionId,
      age,
      survey1: [],
      survey2: [],
    };
    responses.push(session);
  }
  
  // Update age if provided/different
  if (age !== null && age !== undefined) {
    session.age = age;
  }

  session.survey1.push({
    image,
    rating,
    timestamp: Date.now(),
  });

  await saveResponses(responses);
}

export async function addSurvey2Ranking(
  sessionId: string,
  age: number | null,
  question: string,
  ranking: string[]
): Promise<void> {
  const responses = await getResponses();
  let session = responses.find((r) => r.sessionId === sessionId);
  if (!session) {
    session = {
      sessionId,
      age,
      survey1: [],
      survey2: [],
    };
    responses.push(session);
  }

  // Update age if provided/different
  if (age !== null && age !== undefined) {
    session.age = age;
  }

  session.survey2.push({
    question,
    ranking,
    timestamp: Date.now(),
  });

  await saveResponses(responses);
}
