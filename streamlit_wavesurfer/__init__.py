__all__ = ["wavesurfer", "Region"]
import os
import streamlit.components.v1 as components
from dataclasses import dataclass, asdict
from typing import List, Optional

# When False => run: npm start
# When True => run: npm run build
_RELEASE = True


@dataclass
class Region:
    start: float
    end: float
    content: str = ""
    color: Optional[str] = None
    drag: bool = False
    resize: bool=False

if not _RELEASE:
    _component_func = components.declare_component(
        # We give the component a simple, descriptive name ("my_component"
        # does not fit this bill, so please choose something better for your
        # own component :)
        "wavesurfer",
        # Pass `url` here to tell Streamlit that the component will be served
        # by the local dev server that you run via `npm run start`.
        # (This is useful while your component is in development.)
        url="http://localhost:3001",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("wavesurfer", path=build_dir)



def wavesurfer(audio_src: str, regions: List[Region], key: Optional[str]=None) -> bool:
    """Nice audio/video player with audio track selection support.

    User can select one of many provided audio tracks (one for each actor) and switch between them in real time.
    All audio tracks (and video of provided) are synchronized.


    Returns:
     False when not yet initialized (something is loading), and True when ready.
    """
    from streamlit import _main
    from streamlit.elements.media import marshall_audio, AudioProto
    import urllib.parse
    if _RELEASE:
        session = st.runtime.get_instance()._session_mgr.list_active_sessions()[0]
        st_base_url = urllib.parse.urlunparse(
            [session.client.request.protocol, session.client.request.host, "", "", "", ""])

        p = AudioProto()
        marshall_audio(data=audio_src, coordinates=_main.dg._get_delta_path_str(), proto=p, mimetype="audio/wav",
                       start_time=0, sample_rate=None)

        audio_url = st_base_url + p.url
    else:
        audio_url = audio_src

    component_value = _component_func(
        audio_src=audio_url,
        regions=[asdict(region) for region in regions],
        key=key,
        default=0
    )
    return bool(component_value)



# For development, displays stub audio_selector.
if not _RELEASE:
    import streamlit as st

    st.set_page_config(layout="wide")
    v = st.slider(label="offset", min_value=0, max_value=10)
    st.audio("/Users/piter/PycharmProjects/streamlit_wavesurfer/streamlit_wavesurfer/frontend/public/SoundHelix-Song-2.mp3")
    num_clicks = wavesurfer("/Users/piter/PycharmProjects/streamlit_wavesurfer/streamlit_wavesurfer/frontend/public/SoundHelix-Song-2.mp3" , [Region(start=1.0+v, end=5.0+v, content="hello")], key="11")


