var binaryServer = require('binaryjs').BinaryServer;
var wav = require('wav');

var server = binaryServer({port: 9001});
console.log("Started server at port: ",9001);
server.on('connection', function(client) {
  console.log("Connection started!!");
  var fileWriter = null;

client.on('stream', function(stream, meta) {
  var fileWriter = new wav.FileWriter('demo.wav', {
    channels: 1,
    sampleRate: 48000,
    bitDepth: 16
  });
  stream.pipe(fileWriter);
  stream.on('end', function() {
    //write audio file
        fileWriter.end();
  });
});

client.on('close', function() {
  console.log("Connection closed!!");
  if (fileWriter != null) {
    fileWriter.end();
  }
});


});