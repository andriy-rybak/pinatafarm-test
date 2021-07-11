# PIT User Data Reconstruction CLI Tool

## Description:
The CLI tool allows to read user's data from the events log based on PIT value, where `0` - is the object as it was created by the CREATE event and `N-1` (where N is the number of events that were applied to that object) - is the object after all events have been applied to it.

## Prerequesites:
* `nodejs` and `npm` CLI tools are required to run the app.

## How To:
0. Install all the dependencies: `npm install`
1. Start the tool in the command line: `npm start`
2. Use the CLI tool:
    * `get <userID> <PIT>`. Example:
        ```
        a.rybak@dynamic-005-005-005-030 pinatafarm % npm start

        > pinatafarm-test-task@1.0.0 start /Users/a.rybak/pinatafarm
        > node index.js

        local@dynamic-005-005-005-030~$ get 1ebe7809-b708-46b0-b0b6-7d8f608ff08e 1

        User 1ebe7809-b708-46b0-b0b6-7d8f608ff08e at 1 PIT:
        {
        id: '1ebe7809-b708-46b0-b0b6-7d8f608ff08e',
        bio: 'User #1!',
        bookmarks: [
            'da1028ad-43da-42ec-b549-dbb17963b54f',
            '6ccb2eae-cb7c-445d-96e4-0af13f04fed2',
            '28787d49-dd06-4118-8cca-444eb0cee3cc'
        ],
        phoneNumber: '+19095550101',
        username: 'the-first-user',
        updatedAt: '2020-10-28T03:20:02Z',
        createdAt: '2020-10-28T03:20:02Z'
        } 

        local@dynamic-005-005-005-030~$ 
        ```

## Assumptions and limitations:
* Dublicates in bookmarks field are possible and allowed.
* Removed and added collections inside the bookmarks field never intersect.
* Event data model is always correct. Validations of models are not implemented due to this assumption.
* Tests are covering successful scenarious only. In fact, only `userEventsMng.js` module is covered with tests.
* `eventsRepository.js` is temporary module to fake the events storage/DB communication. It queries(reads) events data from the local `json` file. However, in real world, it would connect to some remote DB to read events.
* Scalability concerns are not implemented and should be covered with the extended design described below. 
* Despite the fact that in order to support scalability, the tool should be updated, `userEventsMng.js` module can easely be reused since it was written with scalability in mind: it enables aggregation and squashing of UPDATE events within any time range independently. E.g. 0-1000 or 2000-100500. It enables us to perform the reconstruction by chunks of events without preloading all the events into the process memory.
* Sample events log is taken from the `events.json` file.
* Event model is described within `config.json` file.

## System Design for Scalability Concerns:
Since we are designing the PIT user data reconsrtruction sub-system, the rest of the system is out of scope.

### Traffic estimates:
*It was made to enable at least some kind of design for scale.*
* Assuming, we have **5B users** and **1B daily active users**.
* Assuming the user **profile is updated by each 10th user per day** which means that we have **1B/10 = 100M daily profile updates**(assuming that new users are always in balance with the inactive users). It gives us **100M/1440min = 1170 profile updates per second**
* Assuming we have up to **10K new users per month**. It gives us **340 new users per day**
* Assuming the PIT user reconstruction operation is performed by the support team (or any other actor) on daily bases to handle suport tickets with demand **20 user profile support tickets per single support member per day** with the support team size of **100 active daily members**. To resolve a single profile ticket, support worker should **reconstruct user's profile up to 10 times**. --> **20 * 100 * 10 / 24 * 60 = 14 user profile reconstructions per minute**. 
* Avarage reconstruction takes into account period of time of **10K events** which is **14 * 10K / 60 = 2.5K events per second**
* Avarage reconstruction is made for the PIT within the current year (a good point for the case usage).
* Assuming that the expected reconstruction time is measured in seconds and should be reasonably fast. Let's say - **up to a 10sec per query**.
* Taking this math into account we get read-heavy system with write:read rate **1.2K:2.5K**.

### Storage estimates:
We must support durable storage for the events for 100 years adn enable fast access to the data for suport/audit purposes. Based on the next data model of the user profile event we ca assume we need **290bytes per event**. 
So, 290 bytes per event * 100M events per day * 360 days in year * 50 years = 522TB + 1.8Gb of new user events = **523TB of data per 50 years**.
```
“id”: String # UUID (RFC 4122) ~16bytes
“username”: String # Users username ~20*2=40bytes
“bio”: String # Users bio ~160*2=320bytes
“createdAt”: String # ISO 8601 Timestamp ~14bytes
“updatedAt”: String # ISO 8601 Timestamp ~14bytes
“lastLogin”: String # ISO 8601 Timestamp ~14bytes
“followerCount”: Int # Number of people following user ~4bytes
“followingCount”: Int # Number of people user is following ~4bytes
“remainingInvites”: Int # Number of invites user can send out ~4bytes
“bookmarks”: String List # UUID (RFC 4122) list of bookmarked items ~10*16=160bytes
“phoneNumber”: String # E.164 formatted phone number ~15bytes
"type": Type of event ~6bytes
```

### System Use-Cases to be supported:
A single use cases should be implemented to support user profile data reconstruct based in point in time.

### System Components:
* **Events Consumer** that will handle each event from the queue and store it into the distributed DB. It's a scalable stateless backend service.
* **Distributed DB** that will support high volume data ingestion and heavy read operations. Sharding can be introduced to distribute read/write load between different DB servers.
* **Cache Servers** can be introduced to store some of the most problematic user PIT data which can be used as a starting point for all the greater PIT generations. *Least recently used* policy to evict data. Taking into account the fact that most of the support is made for PIT within the current year, 20% of users PIT for the current year can be cached.
* **CLI Tool** should be adjusted to support 10K events per aggregation (on avarage) so **pagination** can be introduced - we will aggregate event by chunks. Also, we can aggregate each chunk in parallel. Also, cache can be taken into account.

### Sharding:
* Reconstruction is performed on ~10k events of a single user.
* We have 523TB of data in total to be stored for 50 years.
#### Solution: **Shard data based on userId hash**:
* All the user data is available within a single shard which means we can access it pretty fast using only single DB server.
* What about hot users? - It's unlikely that there would be such hot users that update its profile much more often then others. So all the DB servers would be equal on avarage by size and load.
