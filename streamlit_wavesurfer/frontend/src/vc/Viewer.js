import React from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js"
import {Slider} from "@material-ui/core"
import PlayCircleFilled from "@material-ui/icons/PlayCircleFilled";
import PauseCircleFilled from "@material-ui/icons/PauseCircleFilled";
import IconButton from "@material-ui/core/IconButton";

export class Region {
    constructor(start, end, content, color, drag, resize) {
        this.start = start
        this.end = end
        this.content = content
        this.color = color
        this.drag = drag
        this.resize = resize
    }
}

const random = (min, max) => Math.random() * (max - min) + min
const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`


export class WavesurferViewer extends React.Component {
    constructor(props) {
        super(props);
        this.onReady = props.onReady;
        this.activeRegion = null


        this.selectedTrack = 0;
        console.log("GOT REGIONS", props.regions)

        this.state = {
            regions: props.regions,
            r: Math.random(),
            zoomMinPxPerS: 100,
            isPlaying: false,
            loopRegion: false,
            audioSrc: props.audioSrc,
        }
        this.waveform = null;
        console.log("in init??")

        this.waveformRef = React.createRef();
        this.wsRegions = null;

    }

    componentDidMount() {
        this.initWaveform()
    }

    componentWillReceiveProps(nextProps) {
        console.log("Updated props:", nextProps.regions)
        if (JSON.stringify(nextProps.regions) !== JSON.stringify(this.state.regions)) {
            this.setState({regions: nextProps.regions})
            this.updateRegions(nextProps.regions)
        }
        if (nextProps.audioSrc !== this.state.audioSrc) {
            this.setState({audioSrc: nextProps.audioSrc, isPlaying: false})
            this.waveform.load(nextProps.audioSrc)
        }
    }

    updateRegions(regions) {
        console.log("Updating regions")
        if (!this.wsRegions) {
            return;
        }
        this.wsRegions.clearRegions()
        for (let region of regions) {
            console.log("Added region", region)
            this.wsRegions.addRegion({
            start: region.start,
            end: region.end,
            content: region.content,
            color: region.color || randomColor(),
            drag: region.drag,
            resize: region.resize,
          })
        }
        console.log("Regions just after update", this.wsRegions.getRegions())
    }

    initWaveform() {
        if (this.waveform) {
            return
        }
        let xhr = { cache: 'default', mode: 'no-cors'};
        this.waveform = WaveSurfer.create({
            container: this.waveformRef.current,
            waveColor: 'violet',
            progressColor: 'purple',
            responsive: true,
            xhr: xhr,
        });
        this.wsRegions = this.waveform.registerPlugin(RegionsPlugin.create())

        this.waveform.on('decode', () => {
            this.updateRegions(this.state.regions)
        })


        console.log("LOADING", this.waveform.load(this.state.audioSrc))


        this.onReady()

        // this.waveform.on('click', () => {
        //     console.log("click")
        //   this.waveform.play()
        // })
        console.log("ready!!!")
        this.waveform.on(
            "ready", () => {
                this.waveform.zoom(this.state.zoomMinPxPerS)
            }
        )

          this.wsRegions.on('region-in', (region) => {
            this.activeRegion = region
          })
          this.wsRegions.on('region-out', (region) => {
            if (this.activeRegion === region) {
              if (this.state.loopRegion) {
                region.play()
              } else {
                this.activeRegion = null
              }
            }
          })
          this.wsRegions.on('region-clicked', (region, e) => {
              this.setState({isPlaying: true, loopRegion: true})
            e.stopPropagation() // prevent triggering a click on the waveform
            this.activeRegion = region
            region.play()
          })
          // Reset the active region when the user clicks anywhere in the waveform
          this.waveform.on('interaction', () => {
            this.activeRegion = null

          })
    }

    render() {

        console.log("rende?", this.wsRegions && this.wsRegions.getRegions())
        return <div>
            <div ref={this.waveformRef} style={{width: "100%"}}/>
            <center style={{width: "50%"}}>
                Zoom
              <Slider min={1} max={200} aria-label="Zoom"  value={this.state.zoomMinPxPerS} onChange={(e, value) => {this.setState({zoomMinPxPerS: value});this.waveform.zoom(value)}}/>
            </center>

            <IconButton onClick={() => {
                        if (this.state.isPlaying) {
                            this.waveform.pause()
                            this.setState({isPlaying: false, loopRegion: false})
                        } else {
                            this.waveform.play()
                            this.setState({isPlaying: true})
                        }
                    }}> {!this.state.isPlaying ? <PlayCircleFilled className="player-button"/> :
                        <PauseCircleFilled className="player-button"/>} </IconButton>

            </div>
    }
}