const _ = require('lodash');
const fieldTypeMap = require('./config.json').eventModelDescription;

const sign = { 'INC': 1, 'DEC': -1 };

const typeAggregatorMap = {
    'String': (prev, next) => next,
    'Int': (prev, next) => {
        const { type: prevType, value: prevVal } = prev;
        const { type: nextType, value: nextVal } = next;
        return {
            type: 'INC',
            value: sign[prevType] * prevVal + sign[nextType] * nextVal,
        };
    },
    // What about case when added and removed arrays have intersections? - assuming that this case is impossible
    // Also the case of dublicates - assuming it's correct case
    '[String]': (prev, next) => {
        const { added: prevAdded = [], removed: prevRemoved = [] } = prev;
        const { added: nextAdded = [], removed: nextRemoved = [] } = next;
        const removed = _.difference(prevRemoved, nextAdded);
        const added = _.difference(prevAdded.concat(nextAdded), nextRemoved);
        return { added, removed };
    }
};

const userToEventMap = {
    'String': (value) => ({ old: null, new: value }),
    'Int': (value) => ({ type: 'INC', value }),
    '[String]': (value) => ({ added: value, removed: [] }),
}

const eventToUserMap = {
    'String': (prevVal, { new: newVal }) => newVal,
    'Int': (prevVal = 0, { type, value }) => prevVal + sign[type] * value,
    '[String]': (prevVal = [], { added = [], removed = [] }) => prevVal.filter((el) => !removed.includes(el)).concat(added),
};

function safeAggregator(prev, next, aggregator) {
    if (!prev || !next) return prev || next;
    return aggregator(prev, next);
}

function eventsAggregator(events) {
    return events.reduce((aggregatedEvent, event) => {
        if (!aggregatedEvent) return event;

        const { fields } = event;
        const { fields: aggregatedFields } = aggregatedEvent;

        Object.entries(fields).forEach(([fieldName, changeConfig]) => {
            const fieldType = fieldTypeMap[fieldName];
            aggregatedFields[fieldName] = safeAggregator(aggregatedFields[fieldName], changeConfig, typeAggregatorMap[fieldType]);
        });

        return {
            ...aggregatedEvent,
            fields: aggregatedFields,
        };
    }, null);
}

function userToEvent({ id, ...user }, type) {
    return Object.entries(user).reduce(({ fields, ...event }, [fieldName, value]) => {
        const fieldType = fieldTypeMap[fieldName];
        return {
            fields: {
                [fieldName]: userToEventMap[fieldType](value),
                ...fields,
            },
            ...event,
        };
    }, { id, type, fields: {} });
}

function eventsToUser(events) {
    return events.reduce((user, { id, fields }) => {
        Object.entries(fields).forEach(([fieldName, changeConfig]) => {
            const fieldType = fieldTypeMap[fieldName];
            const newVal = eventToUserMap[fieldType](user[fieldName], changeConfig);

            user[fieldName] = newVal;
        });

        return { id, ...user };
    }, {});
}

function getUserFromEvents(createEvent, updateEvents = []) {
    const { id: userId, fields: user } = createEvent;
    const basicEvent = userToEvent({ id: userId, ...user }, 'UPDATE');
    const finalEvent = eventsAggregator([basicEvent, ...updateEvents]);

    return eventsToUser([finalEvent]);
}

module.exports = {
    fieldTypeMap,
    typeAggregatorMap,
    userToEventMap,
    eventToUserMap,
    safeAggregator,
    eventsAggregator,
    userToEvent,
    eventsToUser,
    getUserFromEvents,
}
