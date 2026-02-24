const { TextGeometry } = require('three/addons/geometries/TextGeometry.js')

/**
 * @author Emma (epolitze) Politzer
 * @description Utility functions for creating 3D Text geometries in Three.js
 * @param {number} depth - The depth of the text geometry
 * @param {string} text - The text to create
 * @param {number} size - The size of the text
 * @returns {TextGeometry} - The created TextGeometry object
 */
function createTextGeometry(depth, text, size) {
    const textGeometry = new TextGeometry(
        text, {
            font: window.font,
            size: size,
            depth: depth,
            curveSegments: 2,
        })
    textGeometry.center()
    return textGeometry
}

module.exports.createTextGeometry = createTextGeometry