/**
 *
 */
var flowUtil = require("../red/runtime/nodes/flows/util");
var activeFlows = require("./flows-ISCD.json");

//console.log(activeFlows);

//
//
var activeFlowsConf = flowUtil.parseConfig(activeFlows.flows);

//console.log(activeFlowsConf);

console.log('');
//
// get ds.z to specific tabs
var devId = '1b180af2.e2ce95';
var tabId = 'd926bf17.ca7be';
var arrNodes = Object.keys(activeFlowsConf.flows[tabId].nodes);
for(var indexNodes=0; indexNodes < arrNodes.length; indexNodes++)
{
    var nodeId = arrNodes[indexNodes];
    var node = activeFlowsConf.flows[tabId].nodes[nodeId];
    if(node.hasOwnProperty('wires'))
    {
        console.log(node.wires);
        for(var index=0; index < node.wires.length; index++)
        {
            if (node.wires[index].indexOf(devId) != -1)
            {
                console.info("Node ID: ", nodeId, " wire with Device ID: ", devId, " FOUND!!!");
            }
        }
        //if (node.wires[devId])
        //{
        //    console.log("FOUND!!!" + arrNodes[indexNodes]);
        //}
    }
}

    //{
//   var node = activeFlowsConf.flows[tabId].nodes[arrNodes[indexNodes]];
//   if(node.hasOwnProperty('wires'))
//   {
//       if (node.wires[devId])
//       {
//           console.log("FOUND!!!" + arrNodes[indexNodes]);
//       }
//   }
//}

   
   
   