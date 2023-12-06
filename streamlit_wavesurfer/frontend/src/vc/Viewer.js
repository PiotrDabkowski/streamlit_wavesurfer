import React from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js"
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.js"
import {Slider} from "@material-ui/core"
import PlayCircleFilled from "@material-ui/icons/PlayCircleFilled";
import PauseCircleFilled from "@material-ui/icons/PauseCircleFilled";
import IconButton from "@material-ui/core/IconButton";
import Checkbox from "@material-ui/core/Checkbox";
import {Line} from 'react-chartjs-2';
import 'chart.js/auto';

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


export class Graph {
    constructor(name, points, color) {
        this.name = name
        this.points = points
        this.color = color
    }
}

const random = (min, max) => Math.random() * (max - min) + min
const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`


class LineChart extends React.Component {
    constructor(props) {
        super(props);

        // Calculate initial x-axis range based on the datasets
        const allXValues = props.datasets.flatMap(dataset => dataset.data.map(point => point.x));
        const minX = Math.min(...allXValues);
        const maxX = Math.max(...allXValues);

        this.state = {
            xAxisRange: {min: minX, max: maxX}, // Initial range for the x-axis
            datasets: props.datasets
        };
    }

    componentWillReceiveProps(nextProps) {
        console.log("Updated LineChart props:", nextProps.datasets)
        if (JSON.stringify(nextProps.datasets) !== JSON.stringify(this.state.datasets)) {
            this.setState({datasets: nextProps.datasets})
        }
    }

    // Method to set the range of the x-axis
    setXAxisRange = (min, max) => {
        this.setState({xAxisRange: {min, max}});
    };

    render() {
        const {xAxisRange} = this.state;

        const data = {
            datasets: this.props.datasets, // Use datasets from props
        };
        const allYValues = this.state.datasets.flatMap(dataset => dataset.data.map(point => point.y));
        const minY = Math.min(...allYValues);
        const maxY = Math.max(...allYValues);

        const options = {
            maintainAspectRatio: false,
            responsive: true,
             animation: false,
            layout: {
                padding: {
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0
                }
            },
            plugins: {
                legend: {
                    display: false // This will hide the legend
                },
            },
            scales: {
                x: {
                    type: 'linear', // Specify the scale type as linear
                    min: xAxisRange.min, // Minimum value for X-axis from state
                    max: xAxisRange.max, // Maximum value for X-axis from state
                    grid: {
                        drawBorder: false, // Optional: hide the x-axis border
                    },
                    ticks: {
                        display: false, // Hide y-axis ticks
                    },
                },
                y: {
                    min: minY,
                    max: maxY + 0.05*Math.abs(maxY),
                    display: true,
                    ticks: {
                        display: false, // Hide y-axis ticks
                    },
                    grid: {
                        drawBorder: false, // Hide the y-axis border
                        drawTicks: false, // Hide the y-axis grid ticks
                        drawOnChartArea: false, // Hide the y-axis grid lines
                    }
                },
            },
        };
        const chartStyles = {
            width: '100%',
            height: '110px',
        };

        return (
            <div style={chartStyles}>
                <Line data={data} options={options}/>
                {/* You can add buttons or other controls to adjust the range */}
            </div>
        );
    }
}

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
            autoCenter: true,
            graphs: props.graphs,
        }
        this.waveform = null;
        console.log("in init??")

        this.waveformRef = React.createRef();
        this.wsRegions = null;

        this.lineChartRef = React.createRef();

    }

    getWsOptions(autoCenter) {
        return {
            container: this.waveformRef.current,
            waveColor: 'violet',
            progressColor: 'purple',
            responsive: true,
            xhr: {cache: 'default', mode: 'no-cors'},
            autoCenter: autoCenter,
            autoScroll: autoCenter,
        }
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
        if (JSON.stringify(nextProps.graphs) !== JSON.stringify(this.state.graphs)) {
            this.setState({graphs: nextProps.graphs})
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

    setAutoCenter(on) {
        this.waveform.setOptions(this.getWsOptions(on))
    }

    updateChart() {
        if (!this.waveform) {
            return
        }
        if (!this.lineChartRef.current) {
            return
        }
        const { scrollLeft, scrollWidth, clientWidth } = this.waveform.renderer.scrollContainer
          const startFrac = scrollLeft / scrollWidth
          const endFrac = (scrollLeft + clientWidth) / scrollWidth

        let duration = this.waveform.getDuration();
        this.lineChartRef.current.setXAxisRange(startFrac*duration, endFrac*duration);
    }

    initWaveform() {
        if (this.waveform) {
            return
        }

        this.waveform = WaveSurfer.create(this.getWsOptions(this.state.autoCenter));
        this.wsRegions = this.waveform.registerPlugin(RegionsPlugin.create())


        this.wsTimeline = this.waveform.registerPlugin(TimelinePlugin.create({
            height: 10,
            timeInterval: 0.1,
            primaryLabelInterval: 1,
            style: {
                fontSize: '10px',
                color: '#6A3274',
            },
        }))


        console.log("LOADING", this.waveform.load(this.state.audioSrc))


        this.onReady()

        // this.waveform.on('click', () => {
        //     console.log("click")
        //   this.waveform.play()
        // })
        console.log("ready!!!")
        this.waveform.renderer.on(
            "scroll",
            () => {
                this.updateChart()
            }
        )
        this.waveform.on(
            "ready", () => {
                this.waveform.zoom(this.state.zoomMinPxPerS)
                setTimeout(() => {
                    this.updateRegions(this.state.regions)

                }, 500)

            }
        )
        this.waveform.on(
            "zoom", () => {
                this.updateChart()
            }
        )
        this.waveform.on(
            "redraw", () => {
                this.updateChart()
            }
        )


        // this.wsRegions.on('region-in', (region) => {
        //     console.log("region inn!!!")
        //   this.activeRegion = region
        // })
        this.wsRegions.on('region-out', (region) => {
            console.log("region out!!!")
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

        this.waveform.on()
        // this.setAutoCenter(false)
    }

    render() {

        const datasets = [
            {
                label: 'Dataset 1',
                data: [{x: 1, y: 10}, {x: 3, y: 15}, {x: 5, y: 8}],
                borderColor: 'blue',
                backgroundColor: 'rgba(0, 0, 255, 0.5)',
            },
            {
                label: 'Dataset 2',
                data: [{x: 2, y: 5}, {x: 4, y: 12}, {x: 6, y: 7}],
                borderColor: 'red',
                backgroundColor: 'rgba(255, 0, 0, 0.5)',
            },
            // ...more datasets
        ];

        // Usage


        console.log("rende?", this.wsRegions && this.wsRegions.getRegions())
        return <div>
            <div ref={this.waveformRef} style={{width: "100%"}}/>
            {this.state.graphs ? <LineChart ref={this.lineChartRef} datasets={this.state.graphs.map((graph) => {return {label: graph.name, data: graph.points, borderColor: graph.color}})}/> : null}

            <center style={{width: "50%"}}>
                Zoom
                <Slider min={1} max={350} aria-label="Zoom" value={this.state.zoomMinPxPerS} onChange={(e, value) => {
                    this.setState({zoomMinPxPerS: value});
                    this.waveform.zoom(value)
                }}/>
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
            Auto-Center?
            <Checkbox checked={this.state.autoCenter} onChange={(e, v) => {
                console.log(v);
                this.setState({autoCenter: v});
                this.setAutoCenter(v)
            }}/>
        </div>
    }
}