const { cloneDeep } = require('lodash');
const events = require('../events.json').events;

function getEvents(userId, eventType = null, offset = 0, size = 1000) {
    return cloneDeep(events
        .filter(({ id, type }) => id === userId && (!eventType || type === eventType))
        .slice(offset, offset + size - 1));
}

function getLatestEvent(userId, eventType) {
    const foundEvents = getEvents(userId, eventType);
    if (!foundEvents.length) {
        return null;
    }
    return foundEvents[foundEvents.length - 1];
}

module.exports = { getEvents, getLatestEvent }
