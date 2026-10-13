export function pauseOtherProfileAudio(currentAudio) {
  if (!currentAudio || typeof document === 'undefined') return;

  document.querySelectorAll('audio[data-profile-audio], video[data-profile-audio]').forEach((media) => {
    if (media !== currentAudio) media.pause();
  });
}
