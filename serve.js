var binaryServer = require('binaryjs').BinaryServer;
var wav = require('wav');
var fs = require('fs');
var strm = require('stream');
const cs = require('convert-stream');

var lame = require('lame');
var header = require('waveheader');

ROOT_APP_PATH = fs.realpathSync('.'); 
console.log(ROOT_APP_PATH);

var obj = {
  table: []
};

var Transcription=[];
var Word=[];
var Confidence=[];
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

var int16ToFloat32= function (inputArray) {
  var output = new Float32Array(inputArray.length);
  for (var i = 0; i < inputArray.length; i++) {
      var int = inputArray[i];
      // If the high bit is on, then it is a negative number, and actually counts backwards.
      var float = (int >= 0x8000) ? -(0x10000 - int) / 0x8000 : int / 0x7FFF;
      output[i] = float;
  }
  return output;
}


function startGoogleSpeechStream(ws,activeStreamID) {      
  console.log("new instance recognizeStream");
  var recognizeStream = gsclient
  .streamingRecognize(request)
  .on('error', (err) => {
    console.log('ERROR: On Streaming recognize stream:',err);
    return ws.terminate(); 
  })
  .on('end', () => {
    console.log('end recognize stream:');
    fs.readFile(ROOT_APP_PATH+'/transcript/script.json', 'utf8', function readFileCallback(err, data){
      if (err){
          console.log(err);
      } else {
        if(data)
        {
          console.log("Data Exists");
      obj = JSON.parse(data); //now it an object
        }
      obj.table.push({id: activeStreamID, text:Transcription,words:Word,confidence:Confidence,currentTime:Date.now()}); //add some data
      json = JSON.stringify(obj); //convert it back to json
      fs.writeFile(ROOT_APP_PATH+'/transcript/script.json', json, 'utf8', function () {
        console.log("Transcription written successfully");
      }); // write it back 
    }});
    })
  .on('data', (data) => {            
   
    console.log("Transcription",data.results[0].alternatives[0].transcript);
    Transcription.push(data.results[0].alternatives[0].transcript);
    Word.push(data.results[0].alternatives[0].words);
    Confidence.push(data.results[0].alternatives[0].confidence);

  
  });
  return recognizeStream;
}



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
      gstreams.push(startGoogleSpeechStream(ws,activeStreamID+1));
      activeStreamID = activeStreamID + 1;           
    }
    else { // client requested a new speech stream (client-side logic allows for triggering on a lull in input volume)
      console.log('Start another stream');
      gstreams[activeStreamID].end();
      console.log('end stream',activeStreamID);
      gstreams.push(startGoogleSpeechStream(ws,activeStreamID+1));
      activeStreamID = activeStreamID + 1;                              
    }    
         //stream to speech client
  
    }
    else{
      console.log("piping the stream started!!");
             
      stream.pipe(gstreams[activeStreamID]);
 
       var file =fs.createWriteStream(ROOT_APP_PATH+'/clips/'+'audio'+activeStreamID+'.wav')   
      
      // file.write(header(48000 * 2, {
      //   bitDepth: 16
      // }))
     
   var fileWriter = new wav.FileWriter(ROOT_APP_PATH+'/clips/'+'demo'+activeStreamID+'.wav', {
  audioFormat: 1,
  endianness: 'LE',
  channels: 1,
  sampleRate: 16000,
  byteRate: 32000,
  blockAlign: 2,
  bitDepth: 16,
  signed: true 
  });
  
   // create the Encoder instance
   var encoder = new lame.Encoder({
    // input
    channels: 1,        // 2 channels (left and right)
    bitDepth: 16,       // 16-bit samples
    sampleRate: 48000,  // 44,100 Hz sample rate
  
    // output
    bitRate: 256,
    outSampleRate: 16000,
    mode: lame.MONO // STEREO (default), JOINTSTEREO, DUALCHANNEL or MONO
  });


  // cs.toBuffer(stream)
  //   .then((returnedBuffer) => { //doSomething 
  //     console.log("CONVERT stream buffer")
    // // Initiate the source
    // var bufferStream = new strm.PassThrough();


    //     // Write your buffer
    // bufferStream.end(returnedBuffer);

    // Pipe it to something else  (i.e. stdout)
    // bufferStream.pipe(fileWriter)
    
    // })
    

   
   
    
    // raw PCM data from stdin gets piped into the encoder
    stream.pipe(encoder);
    
//
    encoder.pipe(file);

    // the generated  file gets piped to stdout
    encoder.pipe(fileWriter);

  // stream.pipe(fileWriter);
  
  stream.on('end', function() {
    console.log("stream stopped");
           fileWriter.end();
          //file.end()
  });
}

});


client.on('close', function() {
  console.log("Connection closed!!");
  console.log("END speech stream closed!!");
  gstreams[activeStreamID].end();
 

  if (fileWriter != null) {
    console.log("end file writer")
    fileWriter.end();
  }

});


});