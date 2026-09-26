import { Viewer } from '@photo-sphere-viewer/core';

const viewer = new Viewer({
    container: document.querySelector('#viewer'),
    panorama: 'img/mountains.jpg',
});
