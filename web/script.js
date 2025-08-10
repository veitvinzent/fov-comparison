window.addEventListener('load', function() {
    setCanvasDimensions();
    addControlGroup();
});

window.addEventListener('resize', function() {
    setCanvasDimensions();
    render();
});

function setCanvasDimensions() {

    const canvasContainer = document.querySelector('#canvas-container');
    let canvas = document.querySelector('#canvas');

    if (window.matchMedia('(max-width: 1000px)').matches) {
        // mobile case, easy: canvas takes up max width and has 4:3 aspect ratio
        canvas.width = canvasContainer.clientWidth;
        canvas.height = canvas.clientWidth * 3 / 4;
    } else {
        // fit the maximum 4:3 aspect ratio canvas in the container
        canvas.width = Math.min(canvasContainer.clientWidth, canvasContainer.clientHeight * 4 / 3);
        canvas.height = Math.min(canvasContainer.clientHeight, canvasContainer.clientWidth * 3 / 4);
    }
}

function sensorSizeSelectionChanged(element) {

    refreshControlGroup(element.parentElement);
    render();
}

function refreshControlGroup(element) {

    // hide or show inputs for custom sensor size, depending on drop down menu selection
    let customSensorElements = element.querySelectorAll('[for^="custom-sensor"], [name^="custom-sensor"]');
    if (element.querySelector('select[name=sensor-size]').value === 'custom') {
        customSensorElements.forEach(element => element.classList.remove('hidden'));
    } else {
        customSensorElements.forEach(element => element.classList.add('hidden'));
    }
}

function resetControlGroups() {
    let controlGroups = document.querySelector('#control-groups');
    controlGroups.replaceChildren();
    addControlGroup();
}

function addControlGroup() {

    let controlGroupToCopy = document.querySelector(':nth-last-child(1 of .control-group:not(#control-group-template)')
    if (controlGroupToCopy == null) {
        controlGroupToCopy = document.querySelector('#control-group-template');
    }

    const defaultValues = getValuesForControlGroup(controlGroupToCopy);
    addControlGroupWithValues(defaultValues);
}

function addControlGroupWithValues(controlGroupValues) {

    const colors = ['red', 'yellow', 'olive', 'lime', 'green', 'aqua', 'teal', 'blue', 'navy', 'fuchsia', 'purple'];
    const controlGroupTemplate = document.querySelector('#control-group-template');
    let controlGroups = document.querySelector('#control-groups');

    // clone control group template and set values
    let newControlGroup = controlGroupTemplate.cloneNode(true);
    newControlGroup.removeAttribute('id');
    newControlGroup.style.borderColor = colors[controlGroups.childElementCount % colors.length];
    newControlGroup.querySelector('input[name=focal-length]').value = controlGroupValues.focalLength;
    newControlGroup.querySelector('select[name=orientation]').value = controlGroupValues.orientation;
    newControlGroup.querySelector('select[name=sensor-size]').value = controlGroupValues.sensorSize;
    newControlGroup.querySelector('input[name=custom-sensor-width]').value = controlGroupValues.customSensorWidth;
    newControlGroup.querySelector('input[name=custom-sensor-height]').value = controlGroupValues.customSensorHeight;
    refreshControlGroup(newControlGroup);

    controlGroups.insertBefore(newControlGroup, controlGroups.firstChild);

    render();
}

function getValuesForControlGroup(controlGroup) {
    return {
        color: controlGroup.style.borderColor,
        focalLength: Number(controlGroup.querySelector('input[name=focal-length]').value),
        orientation: controlGroup.querySelector('select[name=orientation]').value,
        sensorSize: controlGroup.querySelector('select[name=sensor-size]').value,
        customSensorWidth: Number(controlGroup.querySelector('input[name=custom-sensor-width]').value),
        customSensorHeight: Number(controlGroup.querySelector('input[name=custom-sensor-height]').value)
    };
}

function render() {

    const canvas = document.getElementById('canvas');
    const canvasCenter = { x: canvas.width / 2, y: canvas.height / 2 };
    const context2d = canvas.getContext('2d');

    context2d.clearRect(0, 0, canvas.width, canvas.height);

    // gather focal length and sensor size information from the elements
    document.querySelectorAll('.control-group:not(#control-group-template)').values().map(controlGroup => {

        const inputValues = getValuesForControlGroup(controlGroup);

        let renderData = {
            focalLength: inputValues.focalLength,
            color: inputValues.color,
            isRotated: inputValues.orientation === 'portrait'
        };

        // get sensor size from drop-down or custom values
        if (inputValues.sensorSize !== 'custom') {
            Object.assign(renderData, JSON.parse(inputValues.sensorSize));
        } else {
            renderData.sensorWidth = inputValues.customSensorWidth;
            renderData.sensorHeight = inputValues.customSensorHeight;
        }

        return renderData;

    }).forEach(renderData => {

        // calculate the view area
        const rect = {
            width: canvas.width * (renderData.sensorWidth * 6.5) / (17.3 * renderData.focalLength),
            height: canvas.height * (renderData.sensorHeight * 6.5) / (13 * renderData.focalLength)
        };
        if (renderData.isRotated) {
            [rect.width, rect.height] = [rect.height, rect.width];
        }

        // draw the rectangle
        context2d.strokeStyle = renderData.color;
        context2d.beginPath();
        context2d.rect(
            canvasCenter.x - rect.width / 2,
            canvasCenter.y - rect.height / 2,
            rect.width,
            rect.height);
        context2d.stroke();
    });
}
