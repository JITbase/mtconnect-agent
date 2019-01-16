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

    const broadcastData = (events, index) => new Promise((resolve, reject) => {
      // if the socket is closed, stop processing
      if(!socketActive)  return resolve();

      // if the index is outside the range, stop processing
      index = index || 0;
      let event = events[index];
      if(!event) return resolve();

      const dataToWrite = `${event.timestamp}|${event.raw.name}|${event.value}\n`;
      console.log(dataToWrite);
      socket.write(dataToWrite);
      console.log(`next event in ${moment.duration(event.timeToNextEvent || 0, 'ms').humanize()}`)
      setTimeout(() => {
        resolve(broadcastData(events, index += 1));
        //broadcastData(events, index+=1).then(resolve);
      }, 1000);
      //}, event.timeToNextEvent || 0);
    });

    const processElasticResultsResults = data =>{
      if(!(data && Array.isArray(data) && data.length)) return [];
      // update the timestamps of the resutls
      let dataToSend = data.map((event, i, array)=>{
        event.originalTimestamp = event.timestamp;
        if(!i)
          event.timestamp = (new Date()).toISOString();
        else{
          let previousOriginalMoment = moment(array[i-1].originalTimestamp);
          let previousMoment = moment(array[i-1].timestamp);
          let currentMoment = moment(event.timestamp);
          let diff = currentMoment.diff(previousOriginalMoment, 'milliseconds');
          let diffWithAccellerator = Math.ceil((diff || 0)/accelleration);
          let newTimestamp = previousMoment.add(diffWithAccellerator, 'milliseconds');
          event.timestamp = newTimestamp.toISOString();
          event.diff;
        }

        if(i+1 < data.length){
          let nextEvent = data[i+1];
          let nextEventMoment = moment(nextEvent.timestamp)
          let currentEventOriginalMoment = moment(event.originalTimestamp);
          let timeToNextEvent = nextEventMoment.diff(currentEventOriginalMoment, 'millisecond');
          let timeToNextEventWithAccellerator = Math.ceil((timeToNextEvent || 0)/accelleration);
          event.timeToNextEvent = timeToNextEventWithAccellerator;
        }
        return event;
      });
      return dataToSend;
    }

    const getNext = lastTimestamp => new Promise((resolve, reject) =>{
      if(!socketActive) resolve();
      console.log('getting next 10');
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
        size:10
      };
      if(elasticSource.date.format) body.query.bool.filter[1].range.timestamp.format = elasticSource.date.format;

      elasticClient.search({
        index: elasticSource.index,
        type: '_doc',
        body: body
      })
      .then(results => {

        if(!results.hits.total) {
          socket.end();
          log.info('End of file');
          socketActive = false;
          return resolve();
        }

        // get the source
        let data = results.hits.hits.map(hit => hit._source);
        // get the last timestamp of the results
        const resultsLastTimestamp  = data[data.length - 1].timestamp;
        let dataToSend = processElasticResultsResults(data);

        broadcastData(dataToSend)
        .then(results => {
          if(!socketActive) resolve();
          resolve(getNext(resultsLastTimestamp))
        });
      })
      .catch(log.error.bind(log));
    });



    // start get first values
    getNext()
    .then(results => {
      socketActive = false;
      //let isSocketActive = socketActive;
      socket.end();
    });

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
