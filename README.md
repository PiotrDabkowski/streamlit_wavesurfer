## Streamlit Component For Audio Track Selection

You can easily switch between multiple audio tracks, while keeping everything synchronised.


Example usage:

```python
import streamlit_audio_selector
streamlit_audio_selector.audio_selector(
    [audio_1_url, audio_2_url],
    actors=[streamlit_audio_selector.VoiceActor(name="English", img_src=lang_to_flag.get(english_flag_url)),
            streamlit_audio_selector.VoiceActor("Polish", img_src=polish_flag_url)],
    use_wavesurfer_slider=True,
    video_src=vid_url
)
```