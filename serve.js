var binaryServer = require('binaryjs').BinaryServer;
var wav = require('wav');
var fs = require('fs');
//var Worker = require('webworker-threads').Worker;


ROOT_APP_PATH = fs.realpathSync('.'); 
console.log(ROOT_APP_PATH);

var obj = {
  table: []
};

var Transcription=[];

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');


// Your Google Cloud Platform project ID
const projectId = 'meetingassist-195320';

// Creates a client
const gsclient = new speech.SpeechClient({
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
  interimResults: false, // set to true to receive in-progress guesses
  singleUtterance: false // set to true to close stream after a finished utterance
};


function startGoogleSpeechStream(ws) {      
  console.log("new instance recognizeStream");
  var recognizeStream = gsclient
  .streamingRecognize(request)
  .on('error', (err) => {
    console.log('ERROR: On Streaming recognize stream:',err);
    return ws.terminate(); 
  })
  .on('end', () => {
    console.log('end recognize stream:');
    })
  .on('data', (data) => {            
    // var text = data.results[0].alternatives[0].transcript;
    // ws.send(`[Heard]: ${text}`); // send transcript to client  
    // process.stdout.write(
    //       data.results[0] && data.results[0].alternatives[0]
    //         ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
    //         : `\n\nReached transcription time limit, press Ctrl+C\n`
    //     )
    console.log("Transcription",data.results[0].alternatives[0].transcript);
    Transcription.push(data.results[0].alternatives[0].transcript);
  
  });
  return recognizeStream;
}

  
  // .on('error', console.error)
  // .on('data', data =>
  //   process.stdout.write(
  //     data.results[0] && data.results[0].alternatives[0]
  //       ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
  //       : `\n\nReached transcription time limit, press Ctrl+C\n`
  //   )
  // );


var server = binaryServer({port: 9001});
console.log("Started server at port: ",9001);
server.on('connection', function(client) {
  ws=client
  console.log("Connection started!!");
  var gstreams = []; // keeep track of speech streams
  var activeStreamID = -1; // pointer to active speech stream

  var fileWriter = null;

client.on('stream', function(stream, meta) {
 
   console.log("META datas",meta,"streamid:",activeStreamID);
  if(meta)
  {
    if (meta.indexOf("info")>0) { // client sends an info string on connection that triggers server to start a speech stream             
      console.log('Start first stream');
      gstreams.push(startGoogleSpeechStream(ws));
      activeStreamID = activeStreamID + 1;           
    }
    else { // client requested a new speech stream (client-side logic allows for triggering on a lull in input volume)
      console.log('Start another stream');
      gstreams[activeStreamID].end();
      console.log('end stream',activeStreamID);
      gstreams.push(startGoogleSpeechStream(ws));
      activeStreamID = activeStreamID + 1;                              
    }    
         //stream to speech client
  
    }
    else{
      console.log("piping the stream started!!");
             
      stream.pipe(gstreams[activeStreamID]);
 
            
   var fileWriter = new wav.FileWriter(ROOT_APP_PATH+'/clips/'+'demo'+activeStreamID+'.wav', {
    channels: 1,
    sampleRate: 48000,
    bitDepth: 16
  });
  
  stream.pipe(fileWriter);
  
  stream.on('end', function() {
    console.log("stream stopped");
   // write audio file
   


        fileWriter.end();
  });
}

});

client.on('close', function() {
  console.log("Connection closed!!");
  console.log("END speech stream closed!!");
  gstreams[activeStreamID].end();
  fs.readFile(ROOT_APP_PATH+'/transcript/script.json', 'utf8', function readFileCallback(err, data){
    if (err){
        console.log(err);
    } else {
      if(data)
      {
        console.log("Data Exists");
    obj = JSON.parse(data); //now it an object
      }
    obj.table.push({id: activeStreamID, text:Transcription}); //add some data
    json = JSON.stringify(obj); //convert it back to json
    fs.writeFile(ROOT_APP_PATH+'/transcript/script.json', json, 'utf8', function () {
      console.log("Transcription written successfully");
    }); // write it back 
  }});

  // var fibo = new Worker(function() {
  //   function fibo (n) {
  //     return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1;
  //   }
  //   this.onmessage = function (event) {
  //     postMessage(fibo(event.data));
  //   }
  // });
  // fibo.onmessage = function (event) {
  //   res.end('fib(40) = ' + event.data);
  // };
  // fibo.postMessage(40);

  if (fileWriter != null) {
    fileWriter.end();
  }
});


});