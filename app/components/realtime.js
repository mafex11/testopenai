// components/RealtimeConversation.js

import { useEffect, useRef, useCallback, useState } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools';

const LOCAL_RELAY_SERVER_URL = process.env.NEXT_PUBLIC_LOCAL_RELAY_SERVER_URL || '';

export default function RealtimeConversation() {
  const wavRecorderRef = useRef(new WavRecorder({ sampleRate: 24000 }));
  const wavStreamPlayerRef = useRef(new WavStreamPlayer({ sampleRate: 24000 }));
  const clientRef = useRef(new RealtimeClient({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowAPIKeyInBrowser: true,
  }));

  const [isRecording, setIsRecording] = useState(false);

  const connectConversation = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    await wavRecorder.begin();
    await wavStreamPlayer.connect();
    await client.connect();

    // Handle audio input
    await wavRecorder.record((data) => client.appendInputAudio(data.mono));

    // Send initial greeting
    client.sendUserMessageContent([{ type: 'input_text', text: 'Hello! How can I assist you today?' }]);
  }, []);

  const startRecording = async () => {
    setIsRecording(true);
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;

    await wavRecorder.record((data) => client.appendInputAudio(data.mono));
  };

  const stopRecording = async () => {
    setIsRecording(false);
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;

    await wavRecorder.pause();
    client.createResponse();
  };

  useEffect(() => {
    connectConversation();
    
    return () => {
      // Cleanup on unmount
      wavRecorderRef.current.end();
      clientRef.current.disconnect();
    };
  }, [connectConversation]);

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
}
