const assert = require('assert');
const pit = require('../src/userEventsMng');

describe('userEventsMng', function () {
    describe('#safeAggregator()', function () {
        it('should return next if prev is null', function () {
            const prev = null;
            const next = {};
            const aggregator = (v) => v;

            assert.equal(pit.safeAggregator(prev, next, aggregator), next);
        });

        it('should return prev if next is null', function () {
            const prev = {};
            const next = null;
            const aggregator = (v) => v;

            assert.equal(pit.safeAggregator(prev, next, aggregator), prev);
        });

        it('should return value by aggregator', function () {
            const prev = {};
            const next = {};
            const fake = {};
            const aggregator = (prev, next) => fake; // TODO test if it recieves prev and next value

            assert.equal(pit.safeAggregator(prev, next, aggregator), fake);
        });

    });

    describe('#eventsToUser()', function () {
        it('should return user\'s object from an array of UPDATE events', function () {
            const events = [
                {
                    "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                    "type": "UPDATE",
                    "fields": {
                        "lastLogin": {
                            "new": "2020-10-28T03:20:30Z"
                        },
                        "updatedAt": {
                            "old": "2020-10-28T03:20:02Z",
                            "new": "2020-10-28T03:20:30Z"
                        },
                        "bio": {
                            "old": "User #1!",
                            "new": "No really, I'm user #1"
                        },
                        "bookmarks": {
                            "added": [
                                "342af9e7-e32a-4706-b9e2-9a0d11f8e229"
                            ],
                            "removed": [
                                "28787d49-dd06-4118-8cca-444eb0cee3cc"
                            ]
                        }
                    }
                },
                {
                    "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                    "type": "UPDATE",
                    "fields": {
                        "bookmarks": {
                            "added": [
                            ],
                            "removed": [
                                "342af9e7-e32a-4706-b9e2-9a0d11f8e229"
                            ]
                        }
                    }
                },
            ];

            const user = {
                "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                "lastLogin": "2020-10-28T03:20:30Z",
                "updatedAt": "2020-10-28T03:20:30Z",
                "bio": "No really, I'm user #1",
                "bookmarks": [],
            }

            assert.deepEqual(pit.eventsToUser(events), user);
        });
    });

    describe('#userToEvent()', function () {
        it('should return event object from user object', function () {
            const user = {
                "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                "lastLogin": "2020-10-28T03:20:30Z",
                "updatedAt": "2020-10-28T03:20:30Z",
                "bio": "No really, I'm user #1",
                "bookmarks": [
                    "342af9e7-e32a-4706-b9e2-9a0d11f8e229",
                    "28787d49-dd06-4118-8cca-444eb0cee3cc",
                ],
            }

            const event = {
                "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                "type": "UPDATE",
                "fields": {
                    "lastLogin": {
                        "old": null,
                        "new": "2020-10-28T03:20:30Z"
                    },
                    "updatedAt": {
                        "old": null,
                        "new": "2020-10-28T03:20:30Z"
                    },
                    "bio": {
                        "old": null,
                        "new": "No really, I'm user #1"
                    },
                    "bookmarks": {
                        "added": [
                            "342af9e7-e32a-4706-b9e2-9a0d11f8e229",
                            "28787d49-dd06-4118-8cca-444eb0cee3cc",
                        ],
                        "removed": []
                    }
                }
            };

            assert.deepEqual(pit.userToEvent(user, 'UPDATE'), event);
        });
    });

    describe('#getUserFromEvents()', function () {
        it('should return user object based on CREATE and single UPDATE events #1', function () {
            const user = {
                "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                "createdAt": "2020-10-28T03:20:02Z",
                "lastLogin": "2020-10-28T03:20:30Z",
                "updatedAt": "2020-10-28T03:20:30Z",
                "phoneNumber": "+19095550101",
                "username": "the-first-user",
                "bio": "No really, I'm user #1",
                "bookmarks": [
                    "da1028ad-43da-42ec-b549-dbb17963b54f",
                    "6ccb2eae-cb7c-445d-96e4-0af13f04fed2",
                    "28787d49-dd06-4118-8cca-444eb0cee3cc",
                    "342af9e7-e32a-4706-b9e2-9a0d11f8e229",
                    "28787d49-dd06-4118-8cca-444eb0cee3cc", // It's possible to ahve dublicates. TODO test this case
                ],
            }

            const createEvent = {
                "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                "type": "CREATE",
                "fields": {
                    "createdAt": "2020-10-28T03:20:02Z",
                    "updatedAt": "2020-10-28T03:20:02Z",
                    "username": "the-first-user",
                    "phoneNumber": "+19095550101",
                    "bookmarks": [
                        "da1028ad-43da-42ec-b549-dbb17963b54f",
                        "6ccb2eae-cb7c-445d-96e4-0af13f04fed2",
                        "28787d49-dd06-4118-8cca-444eb0cee3cc"
                    ],
                    "bio": "User #1!"
                }
            };

            const updateEvents = [
                {
                    "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                    "type": "UPDATE",
                    "fields": {
                        "lastLogin": {
                            "old": null,
                            "new": "2020-10-28T03:20:30Z"
                        },
                        "updatedAt": {
                            "old": null,
                            "new": "2020-10-28T03:20:30Z"
                        },
                        "bio": {
                            "old": null,
                            "new": "No really, I'm user #1"
                        },
                        "bookmarks": {
                            "added": [
                                "342af9e7-e32a-4706-b9e2-9a0d11f8e229",
                                "28787d49-dd06-4118-8cca-444eb0cee3cc",
                            ],
                            "removed": []
                        }
                    }
                }
            ];

            assert.deepEqual(pit.getUserFromEvents(createEvent, updateEvents), user);
        });

        it('should return user object based on CREATE and single UPDATE events #2', function () {
            const user = {
                "id": "770375c4-8273-4c6f-9c68-7e55f7174c21",
                "createdAt": "2020-10-28T03:22:02Z",
                "lastLogin": "2020-10-28T03:23:02Z",
                "updatedAt": "2020-10-28T03:23:02Z",
                "followerCount": 20,
                "followingCount": 15,
                "username": "the-second-user",
                "phoneNumber": "+19095550102",
                "bio": "User #2!?",
            }

            const createEvent = {
                "id": "770375c4-8273-4c6f-9c68-7e55f7174c21",
                "type": "CREATE",
                "fields": {
                    "createdAt": "2020-10-28T03:22:02Z",
                    "updatedAt": "2020-10-28T03:22:02Z",
                    "username": "the-second-user",
                    "phoneNumber": "+19095550102",
                    "followerCount": 10,
                    "followingCount": 20,
                    "bio": "User #2!?"
                }
            };

            const updateEvents = [
                {
                    "id": "770375c4-8273-4c6f-9c68-7e55f7174c21",
                    "type": "UPDATE",
                    "fields": {
                        "lastLogin": {
                            "new": "2020-10-28T03:23:02Z"
                        },
                        "updatedAt": {
                            "old": "2020-10-28T03:22:02Z",
                            "new": "2020-10-28T03:23:02Z"
                        },
                        "followerCount": {
                            "type": "INC",
                            "value": 10
                        },
                        "followingCount": {
                            "type": "DEC",
                            "value": 5
                        }
                    }
                }
            ];

            assert.deepEqual(pit.getUserFromEvents(createEvent, updateEvents), user);
        });

        it('should return user object based on CREATE event only', function () {
            const user = {
                "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                "createdAt": "2020-10-28T03:20:02Z",
                "lastLogin": "2020-10-28T03:20:30Z",
                "updatedAt": "2020-10-28T03:20:02Z",
                "phoneNumber": "+19095550101",
                "username": "the-first-user",
                "bio": "User #1!",
                "bookmarks": [
                    "da1028ad-43da-42ec-b549-dbb17963b54f",
                    "6ccb2eae-cb7c-445d-96e4-0af13f04fed2",
                    "28787d49-dd06-4118-8cca-444eb0cee3cc",
                ],
            }

            const createEvent = {
                "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                "type": "CREATE",
                "fields": {
                    "createdAt": "2020-10-28T03:20:02Z",
                    "updatedAt": "2020-10-28T03:20:02Z",
                    "lastLogin": "2020-10-28T03:20:30Z",
                    "username": "the-first-user",
                    "phoneNumber": "+19095550101",
                    "bookmarks": [
                        "da1028ad-43da-42ec-b549-dbb17963b54f",
                        "6ccb2eae-cb7c-445d-96e4-0af13f04fed2",
                        "28787d49-dd06-4118-8cca-444eb0cee3cc"
                    ],
                    "bio": "User #1!"
                }
            };

            assert.deepEqual(pit.getUserFromEvents(createEvent, []), user);
        });

        it('should return user object based on CREATE and multiple UPDATE events', function () {
            const user = {
                "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                "createdAt": "2020-10-28T03:20:02Z",
                "lastLogin": "2020-10-28T03:24:02Z",
                "updatedAt": "2020-10-28T03:24:02Z",
                "phoneNumber": "+19095550101",
                "username": "the-first-user",
                "bio": "No really, I'm user #1",
                "bookmarks": [
                    "6ccb2eae-cb7c-445d-96e4-0af13f04fed2",
                ],
                "remainingInvites": 5
            }

            const createEvent = {
                "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                "type": "CREATE",
                "fields": {
                    "createdAt": "2020-10-28T03:20:02Z",
                    "updatedAt": "2020-10-28T03:20:02Z",
                    "username": "the-first-user",
                    "phoneNumber": "+19095550101",
                    "bookmarks": [
                        "da1028ad-43da-42ec-b549-dbb17963b54f",
                        "6ccb2eae-cb7c-445d-96e4-0af13f04fed2",
                        "28787d49-dd06-4118-8cca-444eb0cee3cc"
                    ],
                    "bio": "User #1!"
                }
            };

            const updateEvents = [
                {
                    "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                    "type": "UPDATE",
                    "fields": {
                        "lastLogin": {
                            "new": "2020-10-28T03:20:30Z"
                        },
                        "updatedAt": {
                            "old": "2020-10-28T03:20:02Z",
                            "new": "2020-10-28T03:20:30Z"
                        },
                        "bio": {
                            "old": "User #1!",
                            "new": "No really, I'm user #1"
                        },
                        "bookmarks": {
                            "added": [
                                "342af9e7-e32a-4706-b9e2-9a0d11f8e229"
                            ],
                            "removed": [
                                "28787d49-dd06-4118-8cca-444eb0cee3cc"
                            ]
                        }
                    }
                },
                {
                    "id": "1ebe7809-b708-46b0-b0b6-7d8f608ff08e",
                    "type": "UPDATE",
                    "fields": {
                        "lastLogin": {
                            "old": "2020-10-28T03:20:30Z",
                            "new": "2020-10-28T03:24:02Z"
                        },
                        "updatedAt": {
                            "old": "2020-10-28T03:20:30Z",
                            "new": "2020-10-28T03:24:02Z"
                        },
                        "bookmarks": {
                            "added": [],
                            "removed": [
                                "342af9e7-e32a-4706-b9e2-9a0d11f8e229",
                                "da1028ad-43da-42ec-b549-dbb17963b54f"
                            ]
                        },
                        "remainingInvites": {
                            "type": "INC",
                            "value": 5
                        }
                    }
                },
            ];

            assert.deepEqual(pit.getUserFromEvents(createEvent, updateEvents), user);
        });
    });
});
