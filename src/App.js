import React, { useEffect } from 'react';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function App() {
  function processMicrophoneBuffer(event) {
    console.log('event: ', event);
  }

  function noteFromPitch(frequency) {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
  }

  function showSomeData(givenArr, numRows, label) {
    const sizeBuffer = givenArr.length;
    let maxIdx = numRows;

    let sum = 0;
    let count = 0;

    for (let i = 0; i < maxIdx && i < sizeBuffer; i++) {
      const freq = givenArr[i];
      sum += freq;
      count += 1;
    }
    const avgFreq = sum / count;
    const note = noteFromPitch(avgFreq);
    const humanNote = NOTES[note % 12];
    if (humanNote) return humanNote;
    return false;
  }

  function handleAudio(stream) {
    const audioContext = new AudioContext();
    console.log('audio is starting up');

    const BUFF_SIZE = 16384;

    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    const microphoneStream = audioContext.createMediaStreamSource(stream);
    microphoneStream.connect(gainNode);

    const scriptProcessorNode = audioContext.createScriptProcessor(
      BUFF_SIZE,
      1,
      1,
    );
    scriptProcessorNode.onaudioprocess = processMicrophoneBuffer;

    const scriptProcessorFFTNode = audioContext.createScriptProcessor(
      2048,
      1,
      1,
    );
    scriptProcessorFFTNode.connect(gainNode);

    const analyzerNode = audioContext.createAnalyser();
    analyzerNode.smoothingTimeConstant = 0;
    analyzerNode.fftSize = 2048;
    const currentMinDecibles = analyzerNode.minDecibels;
    analyzerNode.minDecibels = -70;
    microphoneStream.connect(analyzerNode);

    analyzerNode.connect(scriptProcessorFFTNode);

    scriptProcessorFFTNode.onaudioprocess = () => {
      const arr = new Uint8Array(analyzerNode.frequencyBinCount);
      analyzerNode.getByteFrequencyData(arr);

      const note = showSomeData(arr, 5, 'from fft');
      console.log('note: ', note);
    };
  }

  function handleAudioFail(err) {
    console.log('err: ', err);
  }

  useEffect(() => {
    navigator.getUserMedia({ audio: true }, handleAudio, handleAudioFail);
  }, []);

  return (
    <div>
      <h1>Guitar Tuner</h1>
    </div>
  );
}

export default App;
