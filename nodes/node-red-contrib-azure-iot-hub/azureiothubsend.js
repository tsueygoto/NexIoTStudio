/**
 *
 * critira:
 *      no support dynamic connection string and protocol changed
 *
 */

module.exports = function (RED) {
    'use strict';
    var Client = require('azure-iothub').Client;
    var Message = require('azure-iot-common').Message;

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

    /**
     *
     */
    var disconnectFromIoTHub = function (node) {
        if (node.serviceClient) {
            console.log('Disconnecting from Azure IoT Hub Service');
            //console.log(node.client);
            //node.client.removeAllListeners();
            //node.client.close(printResultFor('close'));
            node.serviceClient = null;
            setStatus(node, statusEnum.disconnected);
        }
    };
    
    /**
     *
     */
    function printResultFor(op) {
        return function printResult(err, res) {
            if (err) console.log(op + ' error: ' + err.toString());
            if (res) console.log(op + ' status: ' + res.constructor.name);
        };
    }
    
    /**
     *
     */
    function receiveFeedback(err, receiver){
        receiver.on('message', function (msg) {
            console.log('Feedback message:')
            console.info(' Data:', msg.getData().toString('utf-8'));
        });
    }
    
    /**
     *
     */
    function dataConvert(message)
    {
        var data;
        if (message instanceof Buffer) {
            data = message.toString();
        } else if (typeof message === 'string') {
            data = JSON.stringify(message);
        } else {
            data = JSON.stringify(message, null, 2);
        }
        return data
    }
     
    /**
     * setAzureIoTHubSendNode
     */
    function setAzureIoTHubSendNode(locNode)
    {
        // set node property
        if (locNode.hasOwnProperty('serviceClient'))
        {
            // Has Problem
            console.log("[ISSUE] The serviceClient property is exist! This is cann't accept!!!")
        }
        locNode.serviceClient = null;

        /**
         * set node private function
         * msg object with
         *  deviceId
         *  message
         *  messageId
         */
        locNode.on('input', function (msg)
        {
            console.log(msg);
            locNode.msg = msg;
        
            //var connectionString = locNode.credentials.connectionstring;
            if(msg.deviceId == undefined)   return;
            
            locNode.targetDevice = msg.deviceId;
            locNode.serviceClient = Client.fromConnectionString(locNode.credentials.connectionstring);
            locNode.serviceClient.open(function (err) 
            {
                if (err) 
                {
                    console.error('Could not connect: ' + err.message);
                    setStatus(locNode, statusEnum.error);
                } 
                else 
                {
                    console.log('Service client connected');
                    setStatus(locNode, statusEnum.connected);
                    locNode.serviceClient.getFeedbackReceiver(receiveFeedback);
                    var message = new Message(dataConvert(msg.payload));
                    message.ack = 'full';
                    //if (msg.hasOwnProperty('messageId'))
                    //{
                    //    message.messageId = msg.messageId;
                    //}
                    //else
                    //{
                        message.messageId = locNode.targetDevice;
                    //}                    
                    console.log('Sending message: ' + message.getData());
                    locNode.serviceClient.send(locNode.targetDevice, message, printResultFor('send'));
                }
            });
        });
        
        locNode.on('close', function () {
            disconnectFromIoTHub(locNode);
        });
        
        // end of function
        // check waitQueue
        var waitJob = waitQueue.pop();
        if (waitJob != undefined) {
            AzureIoTHubSendNode(waitJob);
        }
        else
        {
            mutex = false;
        }
    }

    // Main function called by Node-RED    
    var mutex = false;
    var waitQueue = [];
     
    function AzureIoTHubSendNode(config) {
        // Create the Node-RED node
        RED.nodes.createNode(this, config);
        var vthis = this;

        if (mutex) {
            // into queue wait for the previous job complete
            waitQueue.push(vthis);
            return;
        }
        mutex = true;
        setAzureIoTHubSendNode(vthis);
    }
    
    // Registration of the node into Node-RED
    RED.nodes.registerType("azureiothubsend", AzureIoTHubSendNode, {
        credentials: {
            connectionstring: { type: "text" }
        },
        defaults: {
            name: { value: "Azure IoT Hub Send" }
        }
    });
    
}
