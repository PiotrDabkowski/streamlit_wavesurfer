import {
    Streamlit,
    StreamlitComponentBase,
    withStreamlitConnection,
} from "streamlit-component-lib"
import React, {ReactNode, useEffect} from "react"
import {WavesurferViewer, Region, Graph} from "./vc/Viewer.js"
import "./vc/Styles.css"

interface State {
    ready: Boolean
}


/**
 * This is a React-based component template. The `render()` function is called
 * automatically when your component should be re-rendered.
 */
class MyComponent extends StreamlitComponentBase<State> {
    public state = {ready: false}

    public componentDidMount() {
        super.componentDidMount();
        // setTimeout(()=>Streamlit.setComponentValue(1), 100)
    }
    public componentDidUpdate() {
        super.componentDidUpdate();
        Streamlit.setFrameHeight()
    }

    public render = (): ReactNode => {
        const regions = this.props.args["regions"].map((e: any) => new Region(e.start, e.end, e.content, e.color, e.drag, e.resize));
        const graphs = this.props.args["graphs"] ? this.props.args["graphs"].map((e: any) => new Graph(e.name, e.points, e.color)) : null;
        const audioSrc = this.props.args["audio_src"];

        const demo = <WavesurferViewer audioSrc={audioSrc}
                             regions={regions} graphs={graphs}
                             onReady={() => {
                                 if (!this.state.ready) {
                                     console.log("Ready!!!!")
                                     this.setState({ready: true})
                                     setTimeout(() => Streamlit.setComponentValue(1), 300)
                                 }
                             }}
        />;

        return (
            // @ts-ignore
            <center>{demo}</center>
        )
    }

}

// "withStreamlitConnection" is a wrapper function. It bootstraps the
// connection between your component and the Streamlit app, and handles
// passing arguments from Python -> Component.
//
// You don't need to edit withStreamlitConnection (but you're welcome to!).
export default withStreamlitConnection(MyComponent)
