/**
 *
 * critira:
 *      no support dynamic connection string and protocol changed
 *
 */
 
util = require('util');
 
module.exports = function (RED) {

    var EventHubClient = require('azure-event-hubs').Client;

    /**
     * Gloabl Variable
     */
    
    var statusEnum = {
        disconnected: { color: "red", text: "Disconnected" },
        connected   : { color: "green", text: "Connected" },
        sent        : { color: "blue", text: "Sent message" },
        received    : { color: "yellow", text: "Received" },
        error       : { color: "grey", text: "Error" },
        nopayload   : { color: "grey", text: "No Payload" }
    };

    /**
     * Global Function
     */
    var setStatus = function (node, status) {
        if (status != null)
            node.status({ fill: status.color, shape: "dot", text: status.text });
        else
            node.status({});
    }

    // Helper function to print results in the console
    function printResultFor(op) {
        return function printResult(err, res) {
            if (err) console.log(op + ' error: ' + err.toString());
            if (res) console.log(op + ' status: ' + res.constructor.name);
        };
    }

    /**
     *
     */
    var disconnectFromIoTHub = function (node) {
        if (node.client) {
            console.log('Disconnecting from Azure IoT Hub');
            //console.log(node.client);
            //node.client.removeAllListeners();
            node.client.close(printResultFor('close'));
            node.client = null;
            setStatus(node, statusEnum.disconnected);
        }
    };

    // Main function called by Node-RED    
    var mutex = false;
    var waitQueue = [];
    
    /**
     * 
     */
    function setAzureIoTEventHubNode(locNode) {
        // set node property
        if (locNode.hasOwnProperty('client')) {
            // Has Problem
            console.log("[ISSUE] The client property is exist! This is cann't accept!!!")
        } 
        locNode.client = null;
        locNode.consumerGroup = '$Default';
        locNode.startTime = Date.now();    

        // set node private function
        locNode.on('input', function (msg) {
            console.log(this);
            this.msg = msg;
        //    node.log('CS: ' + node.credentials.connectionstring);
        //    // check msg object with payload
        //    if (msg.hasOwnProperty('payload')) {
        //        // Sending msg.payload to Azure IoT Hub Hub
        //        //sendMessageToIoTHub(node, msg, nodeConfigUpdated(node.credentials.connectionstring, nodeConfig.protocol));
        //        sendData(node, msg);
        //    } else {
        //        setStatus(node, statusEnum.nopayload);
        //    }
        });
        
        locNode.on('close', function () {
            console.info("========================\nSTART RUN AzureIoTEventHubNode CLOSE\n========================\n");
            disconnectFromIoTHub(this);
        });
        
        // function body
        // console.info("[azureioteventhub.js] locNode.credentials.connectionstring: ", locNode.credentials.connectionstring);
        // check connection string is valid then do create client
        try {
            locNode.client = EventHubClient.fromConnectionString(locNode.credentials.connectionstring);
            locNode.client.open()
                .then(locNode.client.getPartitionIds.bind(locNode.client))
                .then(function (partitionIds) {
                    //console.info("partitionIds: ", partitionIds);
                    setStatus(locNode, statusEnum.connected);
                    var newArr = partitionIds.map(function (partitionId) {
                        var receiver = locNode.client.createReceiver(locNode.consumerGroup, partitionId, { 'startAfterTime' : locNode.startTime}).then(function(receiver) {
                            receiver.on('errorReceived', function (error) {
                                console.log(error.message);
                            });
                            receiver.on('message', function (eventData) {
                                //console.log(locNode);
                                var out = {};
                                out.deviceId = eventData.annotations['iothub-connection-device-id'];
                                var raw = false;
                                var deviceId;
                                if (!deviceId || (deviceId && from === deviceId)) {
                                    if (!raw) console.log('==== From: ' + out.deviceId + ' ====');
                                    if (eventData.body instanceof Buffer) {
                                        out.body = eventData.body.toString();
                                    } else if (typeof eventData.body === 'string') {
                                        out.body = JSON.stringify(eventData.body);
                                    } else {
                                        var other;
                                        if (!raw) {
                                            other = JSON.stringify(eventData.body, null, 2);
                                        } else {
                                            other = JSON.stringify(eventData.body);
                                        }
                                        out.body = other;
                                    }
                                    //console.log(out.body);
        
                                    if (true) {
                                        var annotations;
                                        if (eventData.annotations) {
                                            if (!raw) {
                                                //console.log('---- annotations ----');
                                                annotations = JSON.stringify(eventData.annotations, null, 2);
                                            } else {
                                                annotations = JSON.stringify(eventData.annotations);
                                            }
                                        }
                                        out.annotations = annotations;
        
                                        var properties;
                                        if (eventData.properties) {
                                            if (!raw) {
                                                //console.log('---- properties ----');
                                                properties = JSON.stringify(eventData.properties, null, 2);
                                            } else {
                                                properties = JSON.stringify(eventData.properties);
                                            }
                                        }
                                        out.properties = properties;
                                    }
        
                                    var applicationProperties;
                                    if (eventData.applicationProperties) {
                                        if (!raw) {
                                            //console.log('---- application properties ----');
                                            applicationProperties = JSON.stringify(eventData.applicationProperties, null, 2);
                                        } else {
                                            applicationProperties = JSON.stringify(eventData.applicationProperties);
                                        }
                                    }
                                    out.applicationProperties = applicationProperties;
            
                                    //if (!raw) console.log('====================');
                                }
                                
                                if (!locNode.hasOwnProperty('msg')) {
                                    locNode.msg = {};
                                }
                                locNode.msg.deviceId = out.deviceId;
                                try {
                                    locNode.msg.payload = JSON.parse(out.body);    
                                } catch (e) {
                                    locNode.msg.payload = out.body;
                                }                            
                                locNode.send(locNode.msg);
                                setStatus(locNode, statusEnum.received);
                                //setTimeout(function(){
                                //    setStatus(locNode, null);
                                //},3000);
                            });
                        });
                        return receiver;
                    });
                    return newArr;
                })
                .catch(function (error) {
                    console.log(error.message);
                    setStatus(locNode, { color: "red", text: error.message });
                });
        } catch(e) {
            console.log(e.message);
            setStatus(locNode, { color: "red", text: e.message });
        }

        // end of function
        // check waitQueue
        var waitJob = waitQueue.pop();
        if (waitJob != undefined) {
            console.log("waitJob", waitJob);
            setAzureIoTEventHubNode(waitJob);
        } else {
            mutex = false;
        }
    }

    /**
     *
     */
    function AzureIoTEventHubNode(config) {
        // Create the Node-RED node        
        console.info(util.format('==================================\n  START RUN AzureIoTEventHubNode\n  %s\n==================================\n', config.name));
        RED.nodes.createNode(this, config);
        var vthis = this;
        
        if (mutex) {
            // into queue wait for the previous job complete
            waitQueue.push(vthis);
        } else {
            mutex = true;
            setAzureIoTEventHubNode(vthis);
        }
    }
    
    // Registration of the node into Node-RED
    RED.nodes.registerType("azureioteventhub", AzureIoTEventHubNode, {
        credentials: {
            connectionstring: { type: "text" }
        },
        defaults: {
            name: { value: "Azure IoT Event Hub" }
        }
    });
}
