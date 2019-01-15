// Device - actual device
// * emits data over http via http/event-stream

const log = require('./logger')
const through = require('through')
const es = require('event-stream')
const net = require('net')
const LineByLine = require('line-by-line')
const InfStream = require('../utils/infstream')
const elasticsearch = require('elasticsearch');


const ping = new RegExp(/^\* PING/, 'i')

function device(elasticSource, accelleration, port) {

  net.createServer((socket) => {
    socket.setNoDelay(true);

    socket.name = socket.remoteaddress + ':' + socket.remotePort

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

    const getNext = lastTimestamp => {

    };




    // Create a line reader.
    const reader = new LineByLine(file);
    reader.on('error', err => {
      log.error(err);
    });

    // TODO: Should restart reader at the beginning.
    reader.on('end', () => {
      socket.close();
      log.info('End of file');
    });

    // Send each line with the current timestamp.
    // TODO: need to honor timestamps delta to simulate real interval.
    reader.on('line', line => {
      reader.pause();

      // [timestamp, val1, val2]
      const fields = line.split('|'); // [timestamp,val1,val2]
      const ts = fields.shift();      // ts = timestamp, fields = [val1, val2];
      fields.unshift((new Date()).toISOString());  // fields = [now,val1,val2]

      socket.write(`${fields.join('|')}\n`);
      setTimeout(() => {
        reader.resume();
      }, 1000);
    })

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
      reader.close();
    })

    socket.on('error', (err, ctx) => {
      log.warn(`Socket error: ${err}`);
      reader.close();
    })

  }).listen(port);
}

module.exports = device;
