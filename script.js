
var mediaStream = null;
var streamStartTime;
var breakTime = 45000; // how long to wait before starting a new speech stream on lull in input volume
var volume = 0; // volume meter initial value 
var recording = false; 


 var client = new BinaryClient('ws://localhost:9001');

client.on('open', function() {
  // for the sake of this example let's put the stream in the window
  console.log("ws connected!!");
  client.send("","new user info");

}
);

client.on('close',function() {           
   
    console.log('closed socket');     
    if (recording) {
      stopRecording();
    }    
  }); 

// HELPER FUNCTIONS*************************************************
function convertFloat32ToInt16(buffer) {
  l = buffer.length;
  buf = new Int16Array(l);
  while (l--) {
    buf[l] = Math.min(1, buffer[l])*0x7FFF;
  }
  return buf.buffer;
}


function detectVolume(buf, recorder_context) {
    var bufLength = buf.length;
    var sum = 0;
    var x;
    for (var i=0; i<bufLength; i++) {
        x = buf[i];
        if (Math.abs(x)>=recorder_context.clipLevel) {
            recorder_context.clipping = true;
            recorder_context.lastClip = window.performance.now();
        }
        sum += x * x;
    }
    var rms =  Math.sqrt(sum / bufLength);  
    return Math.max(rms, volume*.85); // smoothing 
  }

//*************************************************************** */


function initializeRecorder(stream) {
  
  var audioContext = window.AudioContext;
  context = new audioContext();
  setRecordingTrue(1000); // give socket 1 sec to open
   audioInput = context.createMediaStreamSource(stream);
  var bufferSize = 2048;
  // create a javascript node
  var recorder = context.createScriptProcessor(2048, 1, 1);
  // specify the processing function
  recorder.onaudioprocess = recorderProcess;
  // connect stream to our recorder
  audioInput.connect(recorder);
  // connect our recorder to the previous destination
  recorder.connect(context.destination);
}

function recorderProcess(e) {
    if(!recording) return;
    
    var left = e.inputBuffer.getChannelData(0);
    volume = detectVolume(left, this);               
     
  if (volume < 0.01 && (Date.now() > (streamStartTime + breakTime))) {    
  //  ws.send("restarting Google Stream");  
  client.send("","restarting Google Stream");
  window.Stream = client.createStream();

    console.log("restarting Google Stream");
    streamStartTime = Date.now();
 
    }   
  else {
console.log("sending stream.....")
  window.Stream.write(convertFloat32ToInt16(left));
 
  }     

}

function onError(err) {
  console.log("onError: ",err);

}

function setRecordingTrue(delay) {
    setTimeout(function() { // web socket needs time to connect before accepting audio
    console.log("Start recording");
        recording = true;
      streamStartTime = Date.now() 
      
    }, delay);
  }
  

function stopRecording() {
    console.log("stop recording")
      recording = false;
    try {
       
      audioInput.mediaStream.getTracks()[0].stop()        
    }
    catch (err) {
      console.log('ERROR unable to close media stream:',err) // triggers on Firefox
    }
    context.close();
    //close ws connection
    client.close()  
  }
  

var recordAndStream=function () {
  
    window.Stream = client.createStream();

  var session = {
  audio: true,
  video: false
};
var recordRTC = null;
navigator.getUserMedia(session, initializeRecorder, onError);


};



