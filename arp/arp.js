
module.exports = function(RED) {
	"use strict";
	var os = require('os');
	var exec = require('child_process').exec;	
	
	function PromiseFunc() {
	    this.execCommand = function (cmd) {
	        return new Promise(function(resolve, reject) {
	           exec(cmd, function(error, stdout, stderr) {
	             if (error) {
	                reject(error);
	                return;
	            }
	            resolve(stdout)
	           });
	       });
	   }
	};
		
	function ARP(n) {
		RED.nodes.createNode(this, n);
		this.name = n.name;
		this.macs = n.macs;
		var node = this;

		node.on("input", function(msg) {
			if (msg && msg.payload) {
				node.macs = msg.payload.macs || node.macs;

				var interfaces = os.networkInterfaces();

				Object.keys(interfaces).forEach(function(inter) {

					interfaces[inter].forEach(function(details) {
						
						if (!details.internal && details.family==='IPv4') {
							
							var ping = 'echo $(seq 254) | xargs -P255 -I% -d" " ping -W 1 -c 1 ';
							ping += details.address.substr(0, details.address.lastIndexOf('.')+1) + '%';
							ping += ' | grep -E "[0-1].*?:"';
							
							node.status({fill:"yellow",shape:"dot",text:"running"});
							
							exec(ping, function(error, stdout, stderr) {
					             if (error) {
					                return;
					            }
					        });
							
						}
					});

				});
				
				var execF = new PromiseFunc();
				execF.execCommand('arp -a').then(function(res) {
					node.status({fill:"green",shape:"dot",text:"finished"});
					if(res && res.length>0) {
						var json = [];
						var lines = res.split('\n');
						
						for ( var i in lines) {
							if(i==0) continue;
							if(lines[i].indexOf('incomplete')<0) {
								var cols = lines[i].split(' ');
								var ip = '';
								var mac = '';
								var iface = '';
								
								for(var j in cols) {
									if(cols[j].indexOf('.')>=0) {
										ip = cols[j];
										continue;
									}
									if(cols[j].indexOf(':')>=0) {
										mac = cols[j];
										continue;
									}
									if(j==cols.length-1) {
										iface = cols[j];
										continue;
									}
								}
								
								if(ip.length>0) {
									var js = {};
									js.ip = ip;
									js.mac = mac;
									js.iface = iface;
									
									if(node.macs) {
										if(node.macs.toLowerCase().indexOf(mac) >=0) {
											json.push(js);
										}
									} else {
										json.push(js);
									}

									
								}
							}
						}
						

						msg.payload = json;
						
						
						return node.send(msg);
					}

				}).catch(function(err) {
					node.status({fill:"red",shape:"dot",text:"error"});
					node.error(err);
					msg.payload.error = err;
					return node.send(msg);
				});
				

				
			}
		});

	}
	RED.nodes.registerType("arp", ARP);

};
