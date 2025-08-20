window.addEventListener('load', function() {
    setCanvasDimensions();

    // init with settings from url or default settings
    const controlGroupSettingsListFromUrl = getControlGroupSettingsListFromUrl();
    if (controlGroupSettingsListFromUrl.length === 0) {
        addControlGroup();
    } else {
        controlGroupSettingsListFromUrl.forEach(controlGroupSettings => addControlGroupWithSettings(controlGroupSettings));
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
    let customSensorElements = controlGroup.querySelectorAll('[for^=custom-sensor], [name^=custom-sensor]');
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
 * Create a new control group that has the same settings as the most recent control group or the default.
 */
function addControlGroup() {
    const mostRecentControlGroup = document.querySelector('#control-groups .control-group');
    const controlGroupSettings = mostRecentControlGroup === null
        ? ControlGroupSettings.defaultSettings
        : ControlGroupSettings.fromControlGroup(mostRecentControlGroup);
    addControlGroupWithSettings(controlGroupSettings);
}

/**
 * Create a new control group with the given settings.
 *
 * @param {ControlGroupSettings} controlGroupSettings
 */
function addControlGroupWithSettings(controlGroupSettings) {

    const colors = ['red', 'yellow', 'olive', 'lime', 'green', 'aqua', 'teal', 'blue', 'navy', 'fuchsia', 'purple'];
    const controlGroupTemplate = document.querySelector('#control-group-template');
    let controlGroups = document.querySelector('#control-groups');

    // clone control group template and set values
    let newControlGroup = controlGroupTemplate.cloneNode(true);
    newControlGroup.removeAttribute('id');
    newControlGroup.style.borderColor = colors[controlGroups.childElementCount % colors.length];
    newControlGroup.querySelector('input[name=focal-length]').value = controlGroupSettings.focalLength;
    newControlGroup.querySelector('select[name=portrait]').value = controlGroupSettings.portrait;
    newControlGroup.querySelector('select[name=sensor-size]').value = controlGroupSettings.sensorSizeSelection;
    newControlGroup.querySelector('input[name=custom-sensor-width]').value = controlGroupSettings.customSensorWidth;
    newControlGroup.querySelector('input[name=custom-sensor-height]').value = controlGroupSettings.customSensorHeight;
    refreshControlGroup(newControlGroup);

    controlGroups.insertBefore(newControlGroup, controlGroups.firstChild);
    render();
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
    document.querySelectorAll('#control-groups .control-group').values()
        .map(controlGroup => ControlGroupSettings.fromControlGroup(controlGroup))
        .forEach(controlGroupSettings => {

            // calculate the view area
            const rect = {
                width: canvas.width * (controlGroupSettings.sensorOriented.width * 6.5) / (17.3 * controlGroupSettings.focalLength),
                height: canvas.height * (controlGroupSettings.sensorOriented.height * 6.5) / (13 * controlGroupSettings.focalLength)
            };

            // draw the rectangle
            context2d.strokeStyle = controlGroupSettings.color;
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

    Array.from(document.querySelectorAll('#control-groups .control-group'))
        .reverse()
        .map(controlGroup => ControlGroupSettings.fromControlGroup(controlGroup))
        .forEach(controlGroupSettings => {
            url.searchParams.append('f', controlGroupSettings.focalLength);
            url.searchParams.append('p', controlGroupSettings.portrait);
            url.searchParams.append('sw', controlGroupSettings.sensor.width);
            url.searchParams.append('sh', controlGroupSettings.sensor.height);
        });

    navigator.clipboard.writeText(url.href);
    alert('Copied the URL to these settings!');
}

/**
 * Look at the URL parameters and determine the initial control group settings.
 *
 * @returns array of control group settings
 */
function getControlGroupSettingsListFromUrl() {

    const url = new URL(document.URL);
    if (url.search === '') {
        return []; // we have nothing to do, if there are no URL parameters
    }

    const focalLengths = url.searchParams.getAll('f').map(focalLength => Number(focalLength));
    const portraits = url.searchParams.getAll('p').map(portrait => portrait === 'true');
    const sensorWidths = url.searchParams.getAll('sw').map(sensorWidth => Number(sensorWidth));
    const sensorHeights = url.searchParams.getAll('sh').map(sensorHeight => Number(sensorHeight));
    if (new Set([focalLengths.length, portraits.length, sensorWidths.length, sensorHeights.length]).size !== 1) {
        return []; // something is wrong with the parameters, return nothing
    }

    // extract control group settings from the url parameters
    let controlGroupSettingsList = [];
    for (let i = 0; i < focalLengths.length; i++) {
        const settings = ControlGroupSettings.fromBasic(focalLengths[i], portraits[i], sensorWidths[i], sensorHeights[i]);
        controlGroupSettingsList.push(settings);
    }
    return controlGroupSettingsList;
}

class ControlGroupSettings {
    /**
     * Create control group settings from the given values.
     *
     * @param {Number} focalLength the focal length in mm
     * @param {Boolean} portrait true, if portrait orientation
     * @param {String} sensorSizeSelection value of the sensor size drop down manu
     * @param {Number} customSensorWidth width of the custom sensor in mm
     * @param {Number} customSensorHeight height of the custom sensor in mm
     * @param {String} color border and rendering color
     */
    constructor(focalLength, portrait, sensorSizeSelection, customSensorWidth, customSensorHeight, color) {
        this.focalLength = focalLength;
        this.portrait = portrait;
        this.sensorSizeSelection = sensorSizeSelection;
        this.customSensorWidth = customSensorWidth;
        this.customSensorHeight = customSensorHeight;
        this.color = color;
    }

    /**
     * Get the control group settings from the given control group.
     *
     * @param {Element} controlGroup HTML element of the control group
     * @returns control group settings of the given control group
     */
    static fromControlGroup(controlGroup) {
        return new ControlGroupSettings(
            Number(controlGroup.querySelector('input[name=focal-length]').value),
            controlGroup.querySelector('select[name=portrait]').value === 'true',
            controlGroup.querySelector('select[name=sensor-size]').value,
            Number(controlGroup.querySelector('input[name=custom-sensor-width]').value),
            Number(controlGroup.querySelector('input[name=custom-sensor-height]').value),
            controlGroup.style.borderColor);
    }

    /**
     * Create control group settings from the given basic parameters. If the sensor dimensions can be selected in the drop down menu,
     * this value will be chosen. Otherwise the sensor dimensions will be set via the custom fields.
     *
     * @param {Number} focalLength the focal length in mm
     * @param {Boolean} portrait true, if portrait orientation
     * @param {Number} sensorWidth width of the sensor in mm
     * @param {Number} sensorHeight height of the sensor in mm
     * @returns control group settings that represent the given values
     */
    static fromBasic(focalLength, portrait, sensorWidth, sensorHeight) {
        const sensorSizeOptionValue = `{"width": ${sensorWidth}, "height": ${sensorHeight}}`;
        const isCustomSensor = document.querySelector(`#control-group-template option[value='${sensorSizeOptionValue}']`) === null;
        return new ControlGroupSettings(
            focalLength, portrait,
            isCustomSensor ? 'custom' : sensorSizeOptionValue,
            isCustomSensor ? sensorWidth : this.defaultSettings.customSensorWidth,
            isCustomSensor ? sensorHeight : this.defaultSettings.customSensorHeight,
            null);
    }

    static get defaultSettings() {
        if (this.defaultSettingsCache === undefined) {
            this.defaultSettingsCache = this.fromControlGroup(document.querySelector('#control-group-template'));
        }
        return this.defaultSettingsCache;
    }

    get sensorOriented() {
        let sensor = this.sensor;
        if (this.portrait) {
            [sensor.width, sensor.height] = [sensor.height, sensor.width];
        }
        return sensor;
    }

    get sensor() {
        return this.sensorSizeSelection === 'custom'
            ? { width: this.customSensorWidth, height: this.customSensorHeight }
            : JSON.parse(this.sensorSizeSelection);
    }
}
