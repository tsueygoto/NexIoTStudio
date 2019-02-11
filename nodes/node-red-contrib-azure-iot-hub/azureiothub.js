/**
 *
 * critira:
 *      no support dynamic connection string and protocol changed
 *
 */
module.exports = function (RED) {
    // variable
    var Client = require('azure-iot-device').Client;
    var Protocols = {
        amqp: require('azure-iot-device-amqp').Amqp,
        mqtt: require('azure-iot-device-mqtt').Mqtt,
        http: require('azure-iot-device-http').Http,
        amqpWs: require('azure-iot-device-amqp-ws').AmqpWs
    };
    var Message = require('azure-iot-device').Message;
    var client = null;
    //var clientConnectionString = "";
    var clientProtocol = "";
    var node = null;
    var nodeConfig = null;
    var statusEnum = {
        disconnected: { color: "red", text: "Disconnected" },
        connected: { color: "green", text: "Connected" },
        sent: { color: "blue", text: "Sent message" },
        received: { color: "yellow", text: "Received" },
        error: { color: "grey", text: "Error" },
        nopayload: { color: "grey", text: "No Payload" },
        csInvalid: { color: "red", text: "CS Invalid" }
    };

    // function
    var setStatus = function (node, status) {
        node.status({ 
            fill: (status.color ? status.color : "red"),
            shape: "dot",
            text: (status.text ? status.text : status) 
        });
    }

    var sendData = function (node, dataObj) {
        var data;
        if(dataObj.hasOwnProperty('payload')) {
            data = dataObj.payload;
        }
        RED.log.info('Sending Message to Azure IoT Hub :\n   Payload: ' + data);
        
        // Create a message and send it to the IoT Hub every second
        var message = new Message(data);
        if(dataObj.hasOwnProperty('properties')) {
            for(var key in dataObj.properties) {
                var value = dataObj.properties[key];
                message.properties.add(key, value);
            }
        }
        
        node.client.sendEvent(message, function (err, res) {
            if (err) {
                RED.log.error('Error while trying to send message:' + err.toString());
                setStatus(node, err.toString());
            } else {
                //RED.log.info(JSON.stringify(res));
                var outpuMessage = new Message();
                outpuMessage.payload = 'Message send: ' + data.toString();
                node.send(outpuMessage);

                RED.log.info('Message sent.');
                setStatus(node, statusEnum.sent);
            }
        });
    };

    //var sendMessageToIoTHub = function (node, message, reconnect) {
    //    if (!client || reconnect) {
    //        node.log('Connection to IoT Hub not established or configuration changed. Reconnecting.');
    //        // Update the connection string
    //        clientConnectionString = node.credentials.connectionstring;
    //        // update the protocol
    //        clientProtocol = nodeConfig.protocol;
    //
    //        // If client was previously connected, disconnect first
    //        if (client)
    //            disconnectFromIoTHub();
    //
    //        // Connect the IoT Hub
    //        connectToIoTHub(message);
    //    } else {
    //        sendData(message);
    //    }
    //};
    //
    //var connectToIoTHub = function (pendingMessage) {
    //    node.log('Connecting to Azure IoT Hub:\n   Protocol: ' + clientProtocol + '\n   Connection string :' + clientConnectionString);
    //    client = Client.fromConnectionString(clientConnectionString, Protocols[clientProtocol]);
    //    client.open(function (err) {
    //        if (err) {
    //            node.error('Could not connect: ' + err.message);
    //            setStatus(statusEnum.disconnected);
    //        } else {
    //            node.log('Connected to Azure IoT Hub.');
    //            setStatus(statusEnum.connected);
    //
    //            // Check if a message is pending and send it 
    //            if (pendingMessage) {
    //                node.log('Message is pending. Sending it to Azure IoT Hub.');
    //                // Send the pending message
    //                sendData(pendingMessage);
    //            }
    //
    //            client.on('message', function (msg) {
    //                // We received a message
    //                node.log('Message received from Azure IoT Hub\n   Id: ' + msg.messageId + '\n   Payload: ' + msg.data);
    //                var outpuMessage = new Message();
    //                outpuMessage.payload = msg.data;
    //                setStatus(statusEnum.received);
    //                node.send(outpuMessage);
    //                client.complete(msg, printResultFor(node, 'Completed'));
    //            });
    //
    //            client.on('error', function (err) {
    //                node.error(err.message);
    //
    //            });
    //
    //            client.on('disconnect', function () {
    //                disconnectFromIoTHub();
    //            });
    //        }
    //    });
    //};

    var disconnectFromIoTHub = function (node) {
        if (node.client) {
            RED.log.info('Disconnecting from Azure IoT Hub');
            node.client.removeAllListeners();
            node.client.close(printResultFor('close'));
            node.client = null;
            setStatus(node, statusEnum.disconnected);
        }
    };

    function nodeConfigUpdated(node, cs, proto) {
        return ((clientConnectionString != cs) || (clientProtocol != proto));
    }

    // Main function called by Node-RED    
    var connectionPool = {};
    
    function AzureIoTHubNode(config) {
        // Create the Node-RED node
        RED.nodes.createNode(this, config);

        var node = this;
        node.protocol = config.protocol;

        // Store node for further use
        //var clientConnectionString = "";
        //var nodeConfig = config;
        node.client = null;
        
        var setupIoTDeviceClient = function() {
            try {
                node.client = Client.fromConnectionString(node.credentials.connectionstring, Protocols[node.protocol]);
            } catch(e) {
                RED.log.error(e.message);
                node.client = null;
                setStatus(node, statusEnum.csInvalid);
                return;
            }
                
            node.client.open(function (err) {
                if (err) {
                    RED.log.info('Could not connect: ' + err.message);
                    setStatus(node, statusEnum.disconnected);
                } else {
                    RED.log.info('Connected to Azure IoT Hub.');
                    setStatus(node, statusEnum.connected);
    
                    // Check if a message is pending and send it 
                    //if (pendingMessage) {
                    //    node.log('Message is pending. Sending it to Azure IoT Hub.');
                    //    // Send the pending message
                    //    sendData(pendingMessage);
                    //}
    
                    node.client.on('message', function (msg) {
                        // We received a message
                        RED.log.info('Message received from Azure IoT Hub\n   Id: ' + msg.messageId + '\n   Payload: ' + msg.data);
                        var outpuMessage = new Message();
                        outpuMessage.payload = msg.data;
                        setStatus(node, statusEnum.received);
                        node.send(outpuMessage);
                        node.client.complete(msg, printResultFor('Completed'));
                    });
    
                    node.client.on('error', function (err) {
                        RED.log.error(err.message);    
                    });
    
                    node.client.on('disconnect', function () {
                        disconnectFromIoTHub(node);
                    });
                }
            });
        }
        setupIoTDeviceClient();
        
        //node.log('protocol: ' + JSON.stringify(config));
        //console.dir(config);
        //node.log('cs: ' + config.credentials.connectionstring);

        //node.log('cs: ' + this.credentials.connectionstring);
        this.on('input', function (msg) {
            //console.log('CS: ' + node.credentials.connectionstring);
            // check msg object with payload
            if (msg.hasOwnProperty('payload')) {
                // Sending msg.payload to Azure IoT Hub Hub
                //sendMessageToIoTHub(node, msg, nodeConfigUpdated(node.credentials.connectionstring, nodeConfig.protocol));
                if (node.client) { sendData(node, msg); }
            } else {
                setStatus(node, statusEnum.nopayload);
            }
        });

        this.on('close', function () {
            disconnectFromIoTHub(node);
        });

    }

    // Registration of the node into Node-RED
    RED.nodes.registerType("azureiothub", AzureIoTHubNode, {
        credentials: {
            connectionstring: { type: "text" }
        },
        defaults: {
            name: { value: "Azure IoT Hub" },
            protocol: { value: "amqp" }
        }
    });


    // Helper function to print results in the console
    function printResultFor(op) {
        return function printResult(err, res) {
            if (node == null) { return; }
            if (err) { RED.log.error(op + ' error: ' + err.toString()); }
            if (res) { RED.log.info(op + ' status: ' + res.constructor.name); }
        };
    }
}
