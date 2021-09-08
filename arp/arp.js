module.exports = function(RED) {
	"use strict";
	
	const os = require('os');
	const exec = require('child_process').exec;

	function PromiseFunc() {
		this.execCommand = function(cmd) {
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
		let node = this;

		node.on("input", function(msg) {
			if (msg && msg.payload) {
				node.macs = msg.payload.macs || node.macs;

				const interfaces = os.networkInterfaces();

				Object.keys(interfaces).forEach(function(inter) {

					interfaces[inter].forEach(function(details) {

						if (!details.internal && details.family === 'IPv4') {

							let ping = 'echo $(seq 254) | xargs -P255 -I% -d" " ping -W 1 -c 1 ';
							ping += details.address.substr(0, details.address.lastIndexOf('.') + 1) + '%';
							ping += ' | grep -E "[0-1].*?:"';

							node.status({ fill: "yellow", shape: "dot", text: "running" });

							exec(ping, function(error, stdout, stderr) {
								if (error) {
									return;
								}
							});
						}
					});

				});

				const execF = new PromiseFunc();
				execF.execCommand('arp -n').then(function(res) {
					node.status({ fill: "green", shape: "dot", text: "finished" });
					if (res && res.length > 0) {
						const json = [];
						const lines = res.split('\n');

						for (const i in lines) {
							if (i == 0) continue;
							if (lines[i].indexOf('incomplete') < 0) {
								const cols = lines[i].split(' ');
								let ip = '';
								let mac = '';
								let iface = '';

								for (const j in cols) {
									if (cols[j].indexOf('.') >= 0) {
										ip = cols[j];
										continue;
									}
									if (cols[j].indexOf(':') >= 0) {
										mac = cols[j];
										continue;
									}
									if (j == cols.length - 1) {
										iface = cols[j];
										continue;
									}
								}

								if (ip.length > 0) {
									const js = {};
									js.ip = ip;
									js.mac = mac;
									js.iface = iface;

									if (node.macs) {
										if (node.macs.toLowerCase().indexOf(mac) >= 0) {
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
					node.status({ fill: "red", shape: "dot", text: "error" });
					node.error(err);
					msg.payload.error = err;
					return node.send(msg);
				});

			}
		});

	}
	RED.nodes.registerType("arp", ARP);

};
