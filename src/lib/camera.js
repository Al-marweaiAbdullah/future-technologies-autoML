// Camera openen (achtercamera op gsm) en een vierkant uit het midden knippen.
// Alle beelden blijven in het geheugen van de browser: niets wordt opgeslagen of verstuurd.

export async function startCamera(video) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Deze browser geeft geen toegang tot de camera. Open de app via HTTPS.')
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  })
  video.srcObject = stream
  video.setAttribute('playsinline', '') // nodig voor iOS Safari
  video.muted = true
  await video.play()
  return stream
}

export function stopCamera(stream) {
  stream?.getTracks().forEach((t) => t.stop())
}

/**
 * Knipt een vierkant uit het midden van de video en tekent het op het canvas (224x224).
 * `fractie` = grootte van het vierkant t.o.v. de kortste zijde van het beeld (0.1 tot 1).
 * Met een kleine fractie "zoomt" de app in, zoals bij het waardemodel nodig is.
 */
export function knipMidden(video, canvas, fractie = 1) {
  const z = Math.min(video.videoWidth, video.videoHeight) * fractie
  const x = (video.videoWidth - z) / 2
  const y = (video.videoHeight - z) / 2
  canvas.getContext('2d').drawImage(video, x, y, z, z, 0, 0, canvas.width, canvas.height)
}
