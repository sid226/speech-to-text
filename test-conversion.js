
var fs = require('fs');
var wav = require('wav');

ROOT_APP_PATH = fs.realpathSync('.');
console.log(ROOT_APP_PATH);


//ROOT_APP_PATH+'/node-speaker-recognition/training/kameswari_voice.wav'
//ROOT_APP_PATH+'/clips/audio0.wav
var file = fs.createReadStream(ROOT_APP_PATH+'/node-speaker-recognition/training/kameswari_voice.wav');
var reader = new wav.Reader();

// the "format" event gets emitted at the end of the WAVE header
reader.on('format', function (format) {
    console.error('format:', format);
   
  });
  


file.pipe(reader);

// the "readable" event will always come *after* the "format" event, but by now
// a few final properties will have been parsed like "subchunk2Size" that we want
// to print out to simulate the wavinfo(1) command
reader.once('readable', function () {
  console.log('WaveHeader Size:\t%d', 12);
  console.log('ChunkHeader Size:\t%d', 8);
  console.log('FormatChunk Size:\t%d', reader.subchunk1Size);
  console.log('RIFF ID:\t%s', reader.riffId);
  console.log('Total Size:\t%d', reader.chunkSize);
  console.log('Wave ID:\t%s', reader.waveId);
  console.log('Chunk ID:\t%s', reader.chunkId);
  console.log('Chunk Size:\t%d', reader.subchunk1Size);
  console.log('Compression format is of type: %d', reader.audioFormat);
  console.log('Channels:\t%d', reader.channels);
  console.log('Sample Rate:\t%d', reader.sampleRate);
  console.log('Bytes / Sec:\t%d', reader.byteRate);
  console.log('wBlockAlign:\t%d', reader.blockAlign);
  console.log('Bits Per Sample Point:\t%d', reader.bitDepth);
  // TODO: this should end up being "44" or whatever the total length of the WAV
  //       header is. maybe emit "format" at this point rather than earlier???
  console.log('wavDataPtr: %d', 0);
  console.log('wavDataSize: %d', reader.subchunk2Size);
  console.log();
});