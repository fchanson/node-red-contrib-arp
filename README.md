# node-red-contrib-arp

This node provides the content of the ARP table.<br>
It returns the mapping of the network address (IP address) to a physical address (MAC address) of the devices which are connected to the same LAN.

### Prerequisites

- Node.js v8.10 or later

### Install

From your node-red directory:

    npm install node-red-contrib-arp
    
or
    
in the Node-red, Manage palette, Install node-red-contrib-arp



### Usage


This node provides the content of the ARP table.

The output **msg.payload** is an array of objects containing : <br>

- ip : the IP address of the device.
- mac : the MAC address of the device.
- iface : the network interface of the device.

It is possible to filter the results by MAC address :<br>

- in the node configuration, by providing MAC address (separated by commas if multiple).
- in the input **msg.payload.macs** message string, by providing MAC address (separated by commas if multiple).

### License 

MIT License
     
