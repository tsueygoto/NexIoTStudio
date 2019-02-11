/**
 *
 */
module.exports = function(RED) {
    "use strict";
    var util = require( "util" );
    var dashServer = require( "./server" );
    /**
    * Global Variable
    */
    var Client = require('azure-iot-device').Client;
    var Protocols = {
        amqp: require('azure-iot-device-amqp').Amqp,
        mqtt: require('azure-iot-device-mqtt').Mqtt,
        http: require('azure-iot-device-http').Http,
        amqpWs: require('azure-iot-device-amqp-ws').AmqpWs
    };
    var Message = require('azure-iot-device').Message;
    var statusEnum = {
        disconnected: { color: "red", text: "Disconnected" },
        connected: { color: "green", text: "Connected" },
        sent: { color: "blue", text: "Sent message" },
        received: { color: "yellow", text: "Received" },
        error: { color: "grey", text: "Error" },
        nopayload: { color: "grey", text: "No Payload" }
    };

    var sysConf = dashServer.init( RED );
    //console.log(sysConf);
    //console.log(RED);
    //RED.ocdCurConf;
    
    /**
     * Main function called by Node-RED    
     */
    //function setAzureIoTHubNode(locNode)
    //{
    //    locNode.client = Client.fromConnectionString(locNode.credentials.connectionstring, Protocols[locNode.protocol]);
    //    
    //    locNode.on('input', function (msg) {
    //        console.log('CS: ' + locNode.credentials.connectionstring);
    //        // check msg object with payload
    //        if (msg.hasOwnProperty('payload')) {
    //            // Sending msg.payload to Azure IoT Hub Hub
    //            //sendMessageToIoTHub(node, msg, nodeConfigUpdated(node.credentials.connectionstring, nodeConfig.protocol));
    //            sendData(locNode, msg);
    //        } else {
    //            setStatus(locNode, statusEnum.nopayload);
    //        }
    //    });
    //
    //    locNode.on('close', function () {
    //        disconnectFromIoTHub(locNode);
    //    });
    //
    //    locNode.client.open(function (err)
    //    {
    //        if (err)
    //        {
    //            locNode.error('Could not connect: ' + err.message);
    //            setStatus(locNode, statusEnum.disconnected);
    //        }
    //        else
    //        {
    //            locNode.log('Connected to Azure IoT Hub.');
    //            setStatus(locNode, statusEnum.connected);
    //
    //            // Check if a message is pending and send it 
    //            //if (pendingMessage) {
    //            //    node.log('Message is pending. Sending it to Azure IoT Hub.');
    //            //    // Send the pending message
    //            //    sendData(pendingMessage);
    //            //}
    //
    //            locNode.client.on('message', function (msg)
    //            {
    //                // We received a message
    //                locNode.log('Message received from Azure IoT Hub\n   Id: ' + msg.messageId + '\n   Payload: ' + msg.data);
    //                var outpuMessage = {};
    //                outpuMessage.messageId = msg.messageId;
    //                outpuMessage.payload = JSON.parse(msg.data);
    //                setStatus(locNode, statusEnum.received);
    //                locNode.send(outpuMessage);
    //                locNode.client.complete(msg, printResultFor(locNode, 'Completed'));
    //            });
    //
    //            locNode.client.on('error', function (err) {
    //                locNode.error(err.message);    
    //            });
    //
    //            locNode.client.on('disconnect', function () {
    //                disconnectFromIoTHub(locNode);
    //            });
    //        }
    //    });
    //
    //    
    //    //return;
    //    //    
    //    //
    //    //setupIoTDeviceClient();
    //    //
    //    //node.log('protocol: ' + JSON.stringify(config));
    //    //console.dir(config);
    //    //node.log('cs: ' + config.credentials.connectionstring);
    //
    //    //node.log('cs: ' + this.credentials.connectionstring);
    //
    //    // end of function
    //    // check waitQueue
    //    var waitJob = waitQueue.pop();
    //    if (waitJob != undefined) {
    //        setAzureIoTHubNode(waitJob);
    //    }
    //    else
    //    {
    //        mutex = false;
    //    }
    //}
    
    /**
     * Global Functions
     */
    var setStatus = function (node, status) {
        node.status({ fill: status.color, shape: "dot", text: status.text });
    }
    
    /**
     *
     */
    var sendData = function (node, dataObj) {
        var data;
        if(dataObj.hasOwnProperty('payload')) {
            if (dataObj.payload instanceof Buffer) {
                data = dataObj.payload.toString();
            } else if (typeof dataObj.payload === 'string') {
                data = JSON.stringify(dataObj.payload);
            } else {
                data = JSON.stringify(dataObj.payload, null, 2);
            }
        }
        RED.log.info('Sending Message to Azure IoT Hub :\n   Payload: ' + data);
        
        // Create a message and send it to the IoT Hub every second
        var message = new Message(data);
        if(dataObj.hasOwnProperty('properties')) {
            for(var key in dataObj.properties) {
                if (dataObj.properties.hasOwnProperty(key)) {
                    var value = dataObj.properties[key];
                    message.properties.add(key, value);
                }
            }
        }
        
        node.client.sendEvent(message, function (err, res) {
            if (err) {
                RED.log.error('Error while trying to send message:' + err.toString());
                setStatus(node, statusEnum.error);
            } else {
                //var outpuMessage = new Message();
                //outpuMessage.payload = 'Message send: ' + data.toString();
                //node.send(outpuMessage);

                RED.log.info('Message sent: ' + data.toString());
                setStatus(node, statusEnum.sent);
            }
        });
    };
    
    /**
     *
     */
    var disconnectFromIoTHub = function (node) {
        if (node.client)
        {
            RED.log.log('Disconnecting from Azure IoT Hub');
            node.client.removeAllListeners();
            node.client.close(printResultFor(node, 'close'));
            node.client = null;
            setStatus(node, statusEnum.disconnected);
        }
    };
    
    /**
     * Helper function to print results in the console
     */
    function printResultFor(node, op) {
        return function printResult(err, res) {
            if (node == null) { return; }
            if (err) { RED.log.error(op + ' error: ' + err.toString()); }
            if (res) { RED.log.info(op + ' status: ' + res.constructor.name); }
        };
    }
    
    /**
        
        Datasource Node Registery Entry
        
     */
    function DatasourceRegistryEntry( config ) {
        
        //console.log('config', config);
        // to modif config add OCD iotHubNodeId for Compatible
        //if (!config.hasOwnProperty('iotHubNodeId'))
        //{
        //    config.iotHubNodeId = "";
        //}
        if (!config.hasOwnProperty('protocol')) {
            config.protocol = "amqp";
        }
        //console.log(config.id);
        //console.log("[" + config.id + "] Credentials:" + RED.nodes.getCredentials(config.id));
        //if (RED.nodes.getCredentials(config.id) == undefined)
        //{
        //    config.cloudReady = false;
        //}
        // console.log(RED.settings.ocdCurConf);
        
        if ((RED.hasOwnProperty('settings')) && 
            (RED.settings.hasOwnProperty('ocdCurConf')) && 
            (RED.settings.ocdCurConf.hasOwnProperty('status')) &&
            (RED.settings.ocdCurConf.status.toLowerCase() == 'ready') &&
            (RED.settings.ocdCurConf.hasOwnProperty('connectionString'))) {
            config.cloudReady = true;
        } else {
            config.cloudReady = false;
        }
        
        RED.nodes.createNode( this, config );
        
        var self = this;
        self.protocol = config.protocol;
        self.client = null;
        
        //console.log(self.id);
        //if (!self.hasOwnProperty('credentials'))
        if (!config.cloudReady) {
            // node no credentials change icon
            self.status({ fill: "red", shape: "dot", text: "OCD Not Ready", key: "cloudReady", keyValue: false });
        }
    
        self.tstampField = config.tstampField.trim() || "tstamp";
        self.dataField = config.dataField.trim() || "data";
        self.dataComponents = undefined;
        if( config.disableDiscover ) { self.dataComponents = null; }
        //this.iotHubNodeId = config.iotHubNodeId.trim() || "";
    
        self.clients = [];
        self.currentHistoryRequest = null;
        self.historyRequests = {};
        self.currentButtonRequest = null;
        self.buttonRequests = {};
        self.currentClickRequest = null;
        self.clickRequests = {};
        self.currentDataBroker = null;
        self.dataBrokers = {};
            
        this.on( "input" , function( msg ) {
            if(!msg.hasOwnProperty( "payload" )) {
                setStatus(self, statusEnum.nopayload);
                return;
            }

            if (sysConf.sysconf.inCloud == 0 &&
                self.hasOwnProperty('credentials') && 
                self.credentials.hasOwnProperty('connectionstring')) {
                // process IoT Hub Device 
                RED.log.info('DS ID: ' + self.id + ' CS: ' + self.credentials.connectionstring);
                // check self.client
                if (!self.client) {
                    try {
                        self.client = Client.fromConnectionString(self.credentials.connectionstring, Protocols[self.protocol]);
                    } catch(e) {
                        console.info("[Dashboard]Iot-hub-device]fromConnectionString Error:", e);
                        return;
                    }
                    
                    self.client.open(function (err)
                    {
                        if (err)
                        {
                            RED.log.error('[Dashboard][' + self.id + '] Could not connect: ' + err.message);
                            disconnectFromIoTHub(self);
                            setStatus(self, statusEnum.disconnected);
                            return;
                        }
                        else
                        {
                            RED.log.info('[Dashboard][' + self.id + '] Connected to Azure IoT Hub.');
                            setStatus(self, statusEnum.connected);
                
                            // Check if a message is pending and send it 
                            //if (pendingMessage) {
                            //    node.log('Message is pending. Sending it to Azure IoT Hub.');
                            //    // Send the pending message
                            //    sendData(pendingMessage);
                            //}
                
                            self.client.on('message', function (msg)
                            {
                                // We received a message
                                RED.log.info('[Dashboard][' + self.id + '] Message received from Azure IoT Hub\n   Id: ' + msg.messageId + '\n   Payload: ' + msg.data);
                                var outpuMessage = {};
                                outpuMessage.messageId = msg.messageId;
                                outpuMessage.payload = JSON.parse(msg.data);
                                setStatus(self, statusEnum.received);
                                self.send(outpuMessage);
                                self.client.complete(msg, printResultFor(self, 'Completed'));
                            });
                
                            self.client.on('error', function (err) 
                            {
                                RED.log.error(err.message);    
                            });
                
                            self.client.on('disconnect', function () 
                            {
                                disconnectFromIoTHub(self);
                            });
                        }
                    });
                } else {
                    sendData(self, msg);
                }
            } else {
                setStatus(self, {color: 'yellow', text: ''});
            }
            // ---            
    
            if( typeof msg.payload == "string" && msg.payload == "reset" ) {
                self.dataComponents = undefined;
                self.sendToAll( JSON.stringify( {
                    type : "config",
                    id : self.id,
                    config : self.getDatasourceConfig()
                }));
                return;
            }
    
            // Deduce(?) data components
            if( self.dataComponents === undefined ) {
                var dataPoint = util.isArray( msg.payload ) ? msg.payload[0] : msg.payload;
                if( dataPoint.hasOwnProperty( self.dataField ) ) {
                    if( typeof dataPoint[ self.dataField ] === "object" ) {
                        self.dataComponents = [];
                        var dataObj = dataPoint[ self.dataField ];
                        for( var key in dataObj )
                        {
                            if( !dataObj.hasOwnProperty( key ) ) { continue; }
                            self.dataComponents.push( key );
                        }
                    }
                    else { self.dataComponents = null; }
                }
    
                var configMsg = {
                    type : "config",
                    id : self.id,
                    config : self.getDatasourceConfig()
                };
    
                self.sendToAll( JSON.stringify( configMsg ) );
            }
    
            var newData;
    
            // Historic data request
            if( !self.currentHistoryRequest && self.historyRequests.hasOwnProperty( msg._msgid ) ) {
                self.currentHistoryRequest = self.historyRequests[ msg._msgid ];
                delete self.historyRequests[ msg._msgid ];
            }
    
            if( self.currentHistoryRequest ) {
                newData = {
                    type : "history",
                    id : self.id,
                    cid : self.currentHistoryRequest.cid,
                    data : msg.payload
                };
                self.currentHistoryRequest.ws.send( JSON.stringify( newData ) );
                self.currentHistoryRequest = null;
            } else {
                newData = {
                    type : "live",
                    id : self.id,
                    data : msg.payload
                };
                newData = JSON.stringify( newData );
    
                // Send live data to all connected clients
                this.sendToAll( newData );
            }
    
        } );
    
        this.on( "close" , function() {
            for( var i = 0; i < self.clients.length; i++ )
            {
                self.clients[i].ws.close();
            }
        } );
    
        // Finds the index of a data point inside an array of data points sorted by unique timestamp
        // If not found, will return the index of the closest data point with timestamp < queried timestamp
        this.findData = function( data , timestamp ) {
            var min = 0, max = data.length - 1, mid = 0;
    
            while( max >= min ) {
                mid = Math.floor( ( min + max ) / 2 );
                if( data[ mid ][ this.tstampField ] == timestamp ) { return mid; }
                else if( data[ mid ][ this.tstampField ] > timestamp ) { max = mid - 1; }
                else { min = mid + 1; }
            }
    
            return data[ mid ][ this.tstampField ] < timestamp ? mid : mid - 1;
        };
    
        this.handleHistoryRequest = function( ws , cid , start , end ) {
            var msg = {
                payload : {
                    start : start,
                    end : end
                },
                deviceId : this.id
            };
    
            var request = {
                ws : ws,
                cid : cid
            };
    
            self.currentHistoryRequest = request;
            this.send( msg );
            self.currentHistoryRequest = null;
            this.historyRequests[ msg._msgid ] = request;
        };
    
        this.handleButtonRequest = function( ws , cid , start , end ) {
            console.log(this.id);
            var msg = {
                payload : {
                    start : start,
                    end : end,
                    button: "button"
                },
                deviceId : this.id
            };
    
            var request = {
                ws : ws,
                cid : cid
            };
    
            self.currentButtonRequest = request;
            this.send( msg );
            self.currentButtonRequest = null;
            this.buttonRequests[ msg._msgid ] = request;
        };
    
        this.handleClickRequest = function( ws , cid , data ) {
            var msg = {
                payload : {
                    data : data
                },
                deviceId : this.id
            };
        
            var request = {
                ws : ws,
                cid : cid
            };
        
            self.currentClickRequest = request;
            this.send( msg );
            self.currentClickRequest = null;
            this.clickRequests[ msg._msgid ] = request;
        };
        
        /**
         *
         */
        this.handleDataBroker = function( ws , cid , data ) {
            var msg = {
                payload : {
                    data : data
                },
                deviceId : this.id
            };
        
            var request = {
                ws : ws,
                cid : cid
            };
        
            self.currentDataBroker = request;
            this.send( msg );
            self.currentDataBroker = null;
            this.dataBrokers[ msg._msgid ] = request;
        };
        
        this.addClient = function( client ) {
            for( var i = 0; i < this.clients.length; i++ ) {
                if( client.ws == this.clients[i].ws ) { return; }
            }
    
            this.clients.push( client );
            var configMsg = {
                type : "config",
                id : this.id,
                config : this.getDatasourceConfig()
            };
    
            // console.log("[addClient] JSON.stringify( configMsg ):" + JSON.stringify( configMsg ))
            client.ws.send( JSON.stringify( configMsg ) );
        };
    
        this.removeClient = function( ws ) {
            for( var i = 0; i < this.clients.length; i++ ) {
                if( this.clients[i].ws == ws ) {
                    this.clients.splice( i , 1 );
                    return;
                }
            }
        };
    
        this.sendToAll = function( msg ) {
            for(var i = 0; i < this.clients.length; i++ ) {
                if( this.clients[i].ws.readyState == this.clients[i].ws.CLOSED ) {
                    this.clients.splice( i-- , 1 );
                    continue;
                }
                this.clients[i].ws.send( msg );
            }
        };
    
        this.getDatasourceConfig = function() {
            return {
                name : this.name,
                tstampField : this.tstampField,
                dataField : this.dataField,
                dataComponents : this.dataComponents
            };
        };
    }
    
    RED.nodes.registerType( "iot-datasource", DatasourceRegistryEntry, {
        credentials: {
            connectionstring: { type: "text" }
        },
        defaults: {
            name: { value: "Azure IoT Hub" },
            tstampField : { value : "" },
            dataField : { value : "" },
            disableDiscover : { value : false },
            //iotHubNodeId : { value : "" },
            cloudReady : { value : false },
            protocol: { value: "amqp" }
        }
    });
    
    /**
    
    
      credentials: {
          connectionstring: 'HostName=ih0916-robin-01.azure-devices.net;DeviceId=cbb573a7.9bf56;SharedAccessKey=Womq6DQH0Bo9nEUsJXtiEGp9LuGX4JYopR0t3TikgEE='
      },
    
     */
    RED.httpAdmin.get("/getCloudStatus", RED.auth.needsPermission("inject.read"), function(req,res) {
        var dsConfig = RED.nodes.getNode(req.query.id);
        console.log('dsConfig',dsConfig);
        
        if (dsConfig.hasOwnProperty('credentials') && 
            dsConfig.credentials.hasOwnProperty('connectionstring') &&
            dsConfig.credentials.connectionstring.match(/HostName=.+;DeviceId=.+;SharedAccessKey=.+/)) {// reg match 
            res.send('ready');
        } else {
            res.send('not ready');
        }

    });
};
