export const sensors = {
    full_frame: {
        width: 35,
        height: 24
    },
    aps_c: {
        width: 23.5,
        height: 15.6
    },
    aps_c_canon: {
        width: 22.3,
        height: 14.9
    },
    medium_format_fujifilm_gfx: {
        width: 43.8,
        height: 32.9
    },
    mirco_four_thirds: {
        width: 17,
        height: 13
    },
    one_inch: {
        width: 13.2,
        height: 8.8
    }
}

export function calculateFov(sensor, focalLength) {
    return {
        horizontal: 2 * Math.atan(sensor.width / (2 * focalLength)) * 180 / Math.PI,
        vertical: 2 * Math.atan(sensor.height / (2 * focalLength)) * 180 / Math.PI
    };
}