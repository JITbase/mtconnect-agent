// Device - actual device
// * emits data over http via http/event-stream

const log = require('./logger')
const through = require('through')
const es = require('event-stream')
const net = require('net')
const LineByLine = require('line-by-line')
const InfStream = require('../utils/infstream')
const elasticsearch = require('elasticsearch');
const moment = require('moment');
const ArrayReader = require('./arrayReader');
const workstationEventCodes = require('./workstationEventCodes')

log.info = log.info.bind(log);


const ping = new RegExp(/^\* PING/, 'i')

function device(elasticSource, accelleration, port) {

  net.createServer((socket) => {
    socket.setNoDelay(true);

    socket.name = socket.remoteaddress + ':' + socket.remotePort
    let socketActive = true;

    // create connection object
    const elasticClient = new elasticsearch.Client({
      host: [
        {
          host: elasticSource.elasticUri,
          auth: `${elasticSource.elasticUser}:${elasticSource.elasticPassword}`,
          protocol: elasticSource.elasticProtocol,
          port: elasticSource.elasticPort,
        },
      ],
    });

    const updateEventTimestamp = (event, previousEvent, nextEvent)=>{
      event.originalTimestamp = event.timestamp;

      if(previousEvent){
        let previousOriginalMoment = moment(previousEvent.originalTimestamp);
        let previousMoment = moment(previousEvent.timestamp);
        let currentMoment = moment(event.timestamp);

        // time between events
        let diff = currentMoment.diff(previousOriginalMoment, 'milliseconds');

        // time between events accelerated
        let diffWithAccellerator = Math.ceil((diff || 0)/accelleration);

        // current event timestamp = previous timestamp + accelerated difference
        let newTimestamp = previousMoment.add(diffWithAccellerator, 'milliseconds');
        event.timestamp = newTimestamp.toISOString();
      }else{
        event.timestamp = (new Date).toISOString();
      }

      if(nextEvent){
        let nextEventMoment = moment(nextEvent.timestamp)
        let currentEventOriginalMoment = moment(event.originalTimestamp);
        let timeToNextEvent = nextEventMoment.diff(currentEventOriginalMoment, 'millisecond');
        let timeToNextEventWithAccellerator = Math.ceil((timeToNextEvent || 0)/accelleration);
        event.timeToNextEvent = timeToNextEventWithAccellerator || 1000;
      }
      return event;
    }

    const transformEventsToCurrentDateTime = (data, lastBroadcastEvent) =>{
      if(!(data && Array.isArray(data) && data.length)) return [];

      let dataToSend = data.map((event, i, array)=>{
        let nextEvent = i+1<data.length ? data[i+1] : null;

        // map event timestap to current date/with with acceleration
        event = updateEventTimestamp(event, lastBroadcastEvent || array[i-1], nextEvent);

        // Map the name, value and rawName data to workstation data
        event = workstationEventCodes.fetch(event);
        return event;
      });
      return dataToSend;
    }

    const getNext = lastTimestamp => {
      console.log('getting next');
      let body = {
        query: {
          bool:{
            filter: [
              {match: {"workstation.code": "LSTTS3_NL300013_009"}},
              {range:{timestamp:{
                gt: lastTimestamp || elasticSource.date.from,
                lte:elasticSource.date.to
              }}}
            ]
          }
        },
        sort: [{timestamp: { order: "asc" }}],
        size:elasticSource.pageSize,
      };
      if(elasticSource.date.format) body.query.bool.filter[1].range.timestamp.format = elasticSource.date.format;

      return elasticClient.search({
        index: elasticSource.index,
        type: '_doc',
        body: body
      });
    };

    const endBroadcast = ()=>{
      socket.end();
      log.info('End of data');
      socketActive = false;
    };

    const broadcastEvents = (elasticResults, lastBroadcastEvent) => {
      if(!socketActive) return endBroadcast();
      if(!elasticResults.hits.total) return endBroadcast();

      // get the source
      let elasticHits = elasticResults.hits.hits.map(hit => hit._source);
      let events = transformEventsToCurrentDateTime(elasticHits, lastBroadcastEvent);

      // last event
      const newLastBroadcastEvent = events[events.length-1];
      const resultsLastTimestamp  = newLastBroadcastEvent.originalTimestamp;

      const reader = new ArrayReader(events);

      reader.on('end', ()=>{
        console.log('reader end');
        return getNext(resultsLastTimestamp)
        .then(results => broadcastEvents(results, newLastBroadcastEvent));
      });

      reader.on('element', event=>{
        reader.pause();
        const dataToWrite = `${event.timestamp}|${event.raw.name}|${event.value}\n`;
        console.log(dataToWrite);
        socket.write(dataToWrite);
        setTimeout(()=>{
          reader.resume();
        }, 1000);
        //}, event.timeToNextEvent);
      });
    };


    // start get first values
    getNext()
    .then(broadcastEvents)
    .catch(log.error.bind(log));

    // Implement Ping/Pong protocol for heartbeats.
    socket.on('data', data => {
      log.info(`Received: '${data}'`);
      console.log(`------- Received: '${data}'`)
      if (data.toString().match(ping)) {
        socket.write("* PONG 10000\n");
      }
    })

    // if the socket closes or errors, stop the reader.
    socket.on('end', () => {
      log.info('Socket closed')
      //reader.close();
      socketActive = false;
    })

  }).listen(port, ()=>{
    console.log(`device bound to port ${port}`)
  });
}

module.exports = device;
