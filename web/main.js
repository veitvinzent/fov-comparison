import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import * as camera from './modules/camera.js';
import * as render from './modules/render.js';

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
viewer.addEventListener('position-updated', updateMarkerPositions);

function updateMarkerPositions() {
    markersPlugin.getMarkers().forEach(marker => {
        const fov = camera.calculateFov(camera.sensors[marker.data.sensorName], marker.data.focalLength);
        markersPlugin.updateMarker({
            id: marker.id,
            polygon: render.createCameraPolygon(viewer, fov)
        });
    });
}

const markersPlugin = viewer.getPlugin(MarkersPlugin);
markersPlugin.addEventListener('select-marker', ({ marker }) => openCameraEditor(marker));

function openCameraEditor(marker) {
    viewer.panel.show({
        id: 'camera-editor',
        width: '350px', // TODO responsive?
        content: document.querySelector('#camera-editor-template').innerHTML
    });

    const sensorNameInput = document.querySelector('#sensor-name');
    sensorNameInput.value = marker.data.sensorName;
    sensorNameInput.addEventListener('input', () => updateCameraWithEditorData(marker));

    const focalLengthInput = document.querySelector('#focal-length');
    focalLengthInput.value = marker.data.focalLength;
    focalLengthInput.addEventListener('input', () => updateCameraWithEditorData(marker));

    const colorInput = document.querySelector('#color');
    colorInput.value = marker.config.svgStyle.stroke;
    colorInput.addEventListener('input', () => updateCameraWithEditorData(marker));
}

function updateCameraWithEditorData(marker) {
    const sensorName = document.querySelector('#sensor-name').value;
    const focalLength = document.querySelector('#focal-length').value;
    const color = document.querySelector('#color').value;
    const fov = camera.calculateFov(camera.sensors[sensorName], focalLength);

    markersPlugin.updateMarker({
        id: marker.id,
        polygon: render.createCameraPolygon(viewer, fov),
        svgStyle: { stroke: color },
        data: {
            sensorName: sensorName,
            focalLength: focalLength
        }
    });
}

function addCamera() {
    const data = {
        sensorName: 'full_frame',
        focalLength: 50
    };
    markersPlugin.addMarker({
        id: `camera-${Date.now()}`,
        // TODO select rect size based on camera sensor and focal length
        polygon: render.createCameraPolygon(viewer, camera.calculateFov(camera.sensors[data.sensorName], data.focalLength)),
        // TODO alternating colors for multiple cameras
        svgStyle: {
            fill: 'rgba(255, 0, 0, 0.20)',
            stroke: 'red',
            strokeWidth: '3px'
        },
        data: data
    });
}
