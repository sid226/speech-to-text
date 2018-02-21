var recognition = require('./node-speaker-recognition/index.js');

var fs = require('fs');

ROOT_APP_PATH = fs.realpathSync('.');
console.log(ROOT_APP_PATH);

recognition.createAndEnroll(ROOT_APP_PATH + '/node-speaker-recognition/training/kameswari_voice.wav', function (res, err) {
    if (err) { console.log(err); }
    else{

    console.log("result", res);
    UserId = res;

    recognition.checkIfEnroll(UserId, function (res, err) {
        if (err) { console.log(err); }
        else{

        console.log("result", res);
        UserId=res.identificationProfileId;
        
        recognition.Operation(UserId, ROOT_APP_PATH + '/node-speaker-recognition/training/kameswari_voice.wav', function (res, err) {
            if (err) { console.log(err); }
            else{
            console.log("result", res);

            operationID = res;

            recognition.Identify(operationID, function (res, err) {
                if (err) { console.log(err); }

                console.log("result", res);

            });
        }
        });
    }
    });

    }
});

/* 
recognition.Identify(operationID, function (res, err) {
    if (err) { console.log(err); }

    console.log("result", res);

}); */