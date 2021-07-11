const Vorpal = require('vorpal');
const { getUserFromEvents } = require('./userEventsMng');
const { getEvents, getLatestEvent } = require('./eventsRepository');

function parseArgs({
  userId,
  pointInTime,
}) {
  return {
    userId,
    pointInTime: parseInt(pointInTime),
  }
}

const vorpal = Vorpal().show();

vorpal
  .command('get <userId> <pointInTime>')
  .description('Get user data by userId for particular point in time.')
  .alias('user')
  .action(function (args, callback) {
    const { userId, pointInTime } = parseArgs(args);

    const createEvent = getLatestEvent(userId, 'CREATE');

    if (!createEvent) {
      this.log(`No user with ID ${userId} was found.`);
      callback();
      return;
    }

    const updateEvents = pointInTime > 0
      ? getEvents(userId, 'UPDATE', 0, pointInTime)
      : [];

    const user = getUserFromEvents(createEvent, updateEvents);

    this.log(`\nUser ${userId} at ${pointInTime} PIT:`);
    this.log(user, '\n');
    callback();
  });
