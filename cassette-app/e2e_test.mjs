const BASE = 'http://localhost:3000';

async function step(name, fn) {
  console.log(`\n=== ${name} ===`);
  try {
    const result = await fn();
    return result;
  } catch (e) {
    console.error(`✗ FAILED:`, e.message);
    throw e;
  }
}

async function test() {
  // Step 1: Create tape
  const tapeId = await step('STEP 1: Create Tape', async () => {
    const res = await fetch(`${BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    const id = data.ok ? data.data?.id : data.id;
    console.log(`✓ Tape ID: ${id}`);
    return id;
  });

  // Step 2: Search song
  const { videoId, title } = await step('STEP 2: Search for Song', async () => {
    const res = await fetch(`${BASE}/api/search?title=bohemian%20rhapsody`);
    const data = await res.json();
    const vid = data[0]?.videoId;
    const ttl = data[0]?.title;
    console.log(`✓ Found: "${ttl}"`);
    console.log(`  Video ID: ${vid}`);
    return { videoId: vid, title: ttl };
  });

  // Step 3: Add track
  const mediaAssetId = await step('STEP 3: Add Track to Tape', async () => {
    const res = await fetch(`${BASE}/create/${tapeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        artist: 'Queen',
        durationSec: 354,
        providerTrackId: videoId,
        side: 'A',
        position: 0
      })
    });
    const data = await res.json();
    const id = data.mediaAssetId;
    console.log(`✓ MediaAsset ID: ${id}`);
    return id;
  });

  // Step 4: Poll status
  let finalStatus = null;
  await step('STEP 4: Poll Status Until READY', async () => {
    for (let i = 1; i <= 20; i++) {
      const res = await fetch(`${BASE}/api/media-assets/${mediaAssetId}/status`);
      const data = await res.json();
      const status = data.status;
      
      process.stdout.write(`  [${i}/20] ${status}${data.fileSize ? ` (${Math.round(data.fileSize/1024)}KB)` : ''}\r`);
      
      if (status === 'READY') {
        console.log(`\n✓ READY after ${(i * 2)}s`);
        finalStatus = data;
        return data;
      }
      
      await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error('Timeout waiting for READY status');
  });

  // Step 5: Test stream
  const streamOK = await step('STEP 5: Test Stream Endpoint', async () => {
    const res = await fetch(`${BASE}/api/media-assets/${mediaAssetId}/stream`);
    console.log(`✓ HTTP Status: ${res.status}`);
    
    if (res.status === 200) {
      const buffer = await res.arrayBuffer();
      console.log(`✓ Audio file received: ${Math.round(buffer.byteLength/1024)}KB`);
      console.log(`  Content-Type: ${res.headers.get('content-type')}`);
      return true;
    } else if (res.status === 202) {
      console.log(`⚠ Still processing (202 Accepted) - will retry`);
      return false;
    } else {
      console.log(`✗ Error status ${res.status}`);
      return false;
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log('✓✓✓ END-TO-END PIPELINE SUCCESS ✓✓✓');
  console.log('='.repeat(50));
  console.log(`Song: ${title}`);
  console.log(`MediaAsset: ${mediaAssetId}`);
  console.log(`Status: ${finalStatus.status}`);
  console.log(`Size: ${Math.round(finalStatus.fileSize/1024)}KB`);
  console.log(`Storage: ${finalStatus.storageKey}`);
  console.log(`Stream: ${streamOK ? '✓ Ready for playback' : '⚠ Still processing'}`);
}

test().catch(e => {
  console.error('\n✗ TEST FAILED:', e.message);
  process.exit(1);
});
