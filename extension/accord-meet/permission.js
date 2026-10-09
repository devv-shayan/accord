document.getElementById('enable').addEventListener('click',async () => {
  const button = document.getElementById('enable'); button.disabled = true;
  try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach(track => track.stop()); document.getElementById('message').textContent = 'Microphone access is ready. Return to your Meet call and start recording.'; }
  catch { document.getElementById('message').textContent = 'Microphone access was not granted. Allow it in Chrome, or record the Meet tab with your microphone off.'; button.disabled = false; }
});
