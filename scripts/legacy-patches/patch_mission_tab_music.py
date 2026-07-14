import re

with open("src/components/views/MissionTabView.tsx", "r") as f:
    content = f.read()

# Replace constructor call
content = re.sub(
    r'musicSynthRef\.current = new PreviewMusicSynth\(music\);',
    r'musicSynthRef.current = new PreviewMusicSynth(music, preferences?.musicVolume || 50);',
    content
)

# Add useEffect for volume update
use_effect_block = r'''  const [previewVoiceError, setPreviewVoiceError] = useState<string | null>(null);

  useEffect(() => {
    if (musicSynthRef.current && previewPlayingMusic) {
      musicSynthRef.current.setVolume(preferences?.musicVolume || 50);
    }
  }, [preferences?.musicVolume, previewPlayingMusic]);'''

content = content.replace('  const [previewVoiceError, setPreviewVoiceError] = useState<string | null>(null);', use_effect_block)

with open("src/components/views/MissionTabView.tsx", "w") as f:
    f.write(content)
