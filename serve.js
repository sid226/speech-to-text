var binaryServer = require('binaryjs').BinaryServer;
var wav = require('wav');


// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');


// Your Google Cloud Platform project ID
const projectId = 'meetingassist-195320';

// Creates a client
const client = new speech.SpeechClient({
  projectId: projectId,
});

const encoding = 'LINEAR16';
const sampleRateHertz = 48000;
const languageCode = 'en-IN';


const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
  },
  interimResults: true, // If you want interim results, set this to true
};


// Create a recognize stream
const recognizeStream = client
  .streamingRecognize(request)
  .on('error', console.error)
  .on('data', data =>
    process.stdout.write(
      data.results[0] && data.results[0].alternatives[0]
        ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
        : `\n\nReached transcription time limit, press Ctrl+C\n`
    )
  );


var server = binaryServer({port: 9001});
console.log("Started server at port: ",9001);
server.on('connection', function(client) {
  console.log("Connection started!!");
  var fileWriter = null;

client.on('stream', function(stream, meta) {
  console.log("piping the stream started!!");
 
  //stream to speech client
  stream.pipe(recognizeStream);


  /* 
  //Should possibly done on a saparate process thread

   var fileWriter = new wav.FileWriter('demo.wav', {
    channels: 1,
    sampleRate: 48000,
    bitDepth: 16
  });
  
  stream.pipe(fileWriter); */
  
  stream.on('end', function() {
    console.log("stream stopped");
    //write audio file
       // fileWriter.end();
  });
});

client.on('close', function() {
  console.log("Connection closed!!");
  if (fileWriter != null) {
    fileWriter.end();
  }
});


});