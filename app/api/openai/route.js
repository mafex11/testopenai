import axios from 'axios';
import { db, collection, getDocs } from '../../lib/firebase';  // Firebase Firestore import

export async function POST(req) {
  const { prompt } = await req.json();  // Get the user's query (prompt)

  try {
    // Fetch data from Firebase Firestore
    const querySnapshot = await getDocs(collection(db, 'crop'));  // Replace 'crop' with your actual collection name
    const firebaseData = [];

    querySnapshot.forEach((doc) => {
      firebaseData.push(doc.data());
    });

    // Log Firebase data to debug it
    console.log('Fetched Firebase data:', firebaseData);

    if (firebaseData.length === 0) {
      return new Response(JSON.stringify({ completion: 'No relevant data found in the database.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Combine user's input (prompt) with Firebase data
    const firebaseInfo = firebaseData.map(item => JSON.stringify(item)).join('\n');
    const combinedPrompt = `User query: ${prompt}\n\nRelevant Firebase data:\n${firebaseInfo}`;

    // Make the OpenAI API call with the combined prompt
    const openAiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an assistant who helps answer queries based on Firebase data.' },
          { role: 'user', content: combinedPrompt }  // combinedPrompt includes Firebase data + user input
        ],
        max_tokens: 150,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const completionText = openAiResponse.data.choices[0].message.content;

    return new Response(JSON.stringify({ completion: completionText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching Firebase or OpenAI response:', error);
    return new Response(
      JSON.stringify({ error: 'Error interacting with Firebase or OpenAI' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
