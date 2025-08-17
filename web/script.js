window.addEventListener('load', function() {
    setCanvasDimensions();

    // init with values from url or default values
    const controlGroupValuesListFromUrl = getControlGroupValuesListFromUrl();
    if (controlGroupValuesListFromUrl.length === 0) {
        addControlGroup();
    } else {
        controlGroupValuesListFromUrl.forEach(controlGroupValues => addControlGroupWithValues(controlGroupValues));
    }
});

window.addEventListener('resize', function() {
    setCanvasDimensions();
    render();
});

/**
 * Adjust the canvas dimensions to fit the most space possible.
 */
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

/**
 * Callback that executes, when the sensor size selection of a control group changed.
 * We check, if any HTML elements need adjusting based on the settings, and render the canvas.
 *
 * @param {Element} element
 */
function sensorSizeSelectionChanged(element) {

    refreshControlGroup(element.parentElement);
    render();
}

/**
 * Refresh HTML elements of the given control group, depending on the current settings.
 *
 * @param {Element} controlGroup
 */
function refreshControlGroup(controlGroup) {

    // hide or show inputs for custom sensor size, depending on drop down menu selection
    let customSensorElements = controlGroup.querySelectorAll('[for^="custom-sensor"], [name^="custom-sensor"]');
    if (controlGroup.querySelector('select[name=sensor-size]').value === 'custom') {
        customSensorElements.forEach(element => element.classList.remove('hidden'));
    } else {
        customSensorElements.forEach(element => element.classList.add('hidden'));
    }
}

/**
 * Reset all the control groups and add a default control group.
 */
function resetControlGroups() {
    let controlGroups = document.querySelector('#control-groups');
    controlGroups.replaceChildren();
    addControlGroup();
}

/**
 * Create a new control group that has the same values as the last control group or the template.
 */
function addControlGroup() {

    let controlGroupToCopy = document.querySelector(':nth-last-child(1 of .control-group:not(#control-group-template)')
    if (controlGroupToCopy == null) {
        controlGroupToCopy = document.querySelector('#control-group-template');
    }

    const defaultValues = getValuesForControlGroup(controlGroupToCopy);
    addControlGroupWithValues(defaultValues);
}

/**
 * Create a new control group with the given values.
 *
 * @param {*} controlGroupValues
 */
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

/**
 * Pack the settings of a given control group in an object. Note: return.sensorSize is always a string.
 *
 * @param {Element} controlGroup
 * @returns object that contains the settings
 */
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

/**
 * Render the current control group settings on the canvas.
 */
function render() {

    const canvas = document.getElementById('canvas');
    const canvasCenter = { x: canvas.width / 2, y: canvas.height / 2 };
    const context2d = canvas.getContext('2d');

    context2d.clearRect(0, 0, canvas.width, canvas.height);
    context2d.lineWidth = 1.5;

    // gather focal length and sensor size information from the elements
    document.querySelectorAll('.control-group:not(#control-group-template)').values().map(controlGroup => {

        const inputValues = getValuesForControlGroup(controlGroup);

        let renderData = {
            color: inputValues.color,
            focalLength: inputValues.focalLength,
            isRotated: inputValues.orientation === 'portrait'
        };

        // get sensor size from drop-down or custom values
        Object.assign(
            renderData,
            inputValues.sensorSize === 'custom'
                ? {sensorWidth: inputValues.customSensorWidth, sensorHeight: inputValues.customSensorHeight}
                : JSON.parse(inputValues.sensorSize));

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

/**
 * Create an URL to the current control group settings and copy it to the clipboard.
 */
function createAndCopySettingsUrl() {

    let url = new URL(document.URL);
    url.search = '';

    Array.from(document.querySelectorAll('.control-group:not(#control-group-template)'))
        .reverse()
        .map(controlGroup => getValuesForControlGroup(controlGroup))
        .forEach(values => {
            const {sensorWidth, sensorHeight} = values.sensorSize === 'custom'
                ? {sensorWidth: values.customSensorWidth, sensorHeight: values.customSensorHeight}
                : JSON.parse(values.sensorSize);
            url.searchParams.append('f', values.focalLength);
            url.searchParams.append('o', values.orientation.substring(0, 1));
            url.searchParams.append('sw', sensorWidth);
            url.searchParams.append('sh', sensorHeight);
        });

    navigator.clipboard.writeText(url.href);
    alert('Copied the URL to these settings!');
}

/**
 * Look at the URL parameters and determine the initial control group settings.
 *
 * @returns array of control group values
 */
function getControlGroupValuesListFromUrl() {

    const url = new URL(document.URL);
    if (url.search === '') {
        return []; // we have nothing to do, if there are no URL parameters
    }

    const focalLengths = url.searchParams.getAll('f');
    const orientations = url.searchParams.getAll('o');
    const sensorWidths = url.searchParams.getAll('sw');
    const sensorHeights = url.searchParams.getAll('sh');
    if (new Set([focalLengths.length, orientations.length, sensorWidths.length, sensorHeights.length]).size !== 1) {
        return []; // something is wrong with the parameters, return nothing
    }

    const defaultCustomSensorWidth = Number(document.querySelector('#control-group-template input[name=custom-sensor-width').value);
    const defaultCustomSensorHeight = Number(document.querySelector('#control-group-template input[name=custom-sensor-height').value);

    // extract control group values from the url parameters
    let controlGroupValuesList = [];
    for (let i = 0; i < focalLengths.length; i++) {

        const sensorSizeOptionValue = `{"sensorWidth": ${sensorWidths[i]}, "sensorHeight": ${sensorHeights[i]}}`;
        const isCustomSensorSize = document.querySelector(`#control-group-template option[value='${sensorSizeOptionValue}']`) === null;

        controlGroupValuesList.push({
            focalLength: Number(focalLengths[i]),
            orientation: orientations[i] === 'p' ? 'portrait' : 'landscape',
            sensorSize: isCustomSensorSize ? 'custom' : sensorSizeOptionValue,
            customSensorWidth: isCustomSensorSize ? Number(sensorWidths[i]) : defaultCustomSensorWidth,
            customSensorHeight: isCustomSensorSize ? Number(sensorHeights[i]) : defaultCustomSensorHeight
        });
    }
    return controlGroupValuesList;
}
