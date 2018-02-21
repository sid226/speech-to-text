"use strict";

const cognitive = require('./src/index.js');
const config = require('./config.js');
const fs = require('fs');

const client = new cognitive.speakerIdentification({
    apiKey: config.speakerRecognition.apiKey,
    endpoint: config.speakerRecognition.endpoint
});


var createAndEnroll = function (trainingAudio,callback) {
    // Create User Profile
    console.log('Creating identification profile...')
    const body = {
        locale: 'en-US'
    }
    client.createProfile({
        body
    }).then(response => {
        var identificationProfileId = response.identificationProfileId;
        console.log(identificationProfileId);

        
        //Enroll User Voice
        console.log('Enrolling identification profile...')
        
        const parameters = { identificationProfileId: identificationProfileId }
        const body = fs.readFileSync(trainingAudio);
        const headers = { 'Content-type': 'application/octet-stream' }
        
        client.createEnrollment({parameters,headers,body}).then(response => {
            callback(identificationProfileId,null)
        }).catch(err => {
            callback(null,err)
        });
    }).catch(err => {
        callback(null,err)
    });
}


var checkIfEnroll=function (identificationProfileId,callback) {
    const parameters = { identificationProfileId: identificationProfileId }
    client.getProfile({parameters}).then(response => {
        callback(response,null)
    }).catch(err => {
        callback(null,err)
    });
}


var Operation=function Operation(identificationProfileIds,testAudio,callback){
    var parameters = {identificationProfileIds: identificationProfileIds}
    const headers = {'Content-type': 'application/octet-stream'}
    const body = fs.readFileSync(testAudio);
    
    client.identify({parameters,headers,body}).then((response) => {
        callback(response,null);
    }).catch(err => {
        callback(null,err)
    });
}

var Identify= function (operationId,callback){
    var parameters = {operationId: operationId}
    client.getOperationStatus({parameters}).then((response) => {
        callback(response,null)
    }).catch(err => {
        callback(null,err)
    });
}

module.exports = {
     createAndEnroll,
     checkIfEnroll,
     Operation,
     Identify
};

//Tests

// createAndEnroll('./training/kameswari_voice.wav',function(res,err){
//     console.log(res);
// });

// checkIfEnroll("666945eb-dfa3-4789-a761-c6fcd0ac6121", function(res,err){
//     console.log(res);
// });

// Operation("666945eb-dfa3-4789-a761-c6fcd0ac6121",'./training/kameswari_voice.wav', function(res,err){
//     console.log(res);
// });

// Identify("690969ca-158f-43bb-b44b-10ad43474b74", function(res,err){
//     console.log(res);
// });