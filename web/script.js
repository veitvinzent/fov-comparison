import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

const viewer = new Viewer({
    container: document.querySelector('#viewer'),
    panorama: 'img/mountains.jpg',
    navbar: [
        'zoom',
        'move',
        {
            id: 'add-camera',
            content: 'Add camera 🎥',
            title: 'Add camera',
            onClick: (viewer) => addCamera()
        },
        'fullscreen'
    ],
    plugins: [ MarkersPlugin ]
});

const markersPlugin = viewer.getPlugin(MarkersPlugin);

function addCamera() {
    const position = viewer.getPosition();

    markersPlugin.addMarker({
        id: `rectangle-${Date.now()}`,

        position: {
            yaw: position.yaw,
            pitch: position.pitch
        },

        // TODO select rect size based on camera sensor and focal length
        rect: {
            width: 300,
            height: 150
        },

        // TODO alternating colors for multiple cameras
        svgStyle: {
            fill: 'rgba(255, 0, 0, 0.20)',
            stroke: 'red',
            strokeWidth: '3px'
        }
    });
}
