module.exports = function(RED) {
	"use strict";
	
	const os = require("os");
	const exec = require("child_process").exec;

	const macMatcher = /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/;
	
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

						if (!details.internal && details.family === "IPv4") {

							let ping = 'echo $(seq 254) | xargs -P255 -I% -d" " ping -W 1 -c 1 ';
							ping += details.address.substr(0, details.address.lastIndexOf(".") + 1) + '%';
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
				execF.execCommand("arp -n").then(function(res) {
					node.status({ fill: "green", shape: "dot", text: "finished" });

					if (res && res.length) {
						const arpEntries = [];
						const lines = res.split("\n");

						for (const line of lines) {
							if (!macMatcher.test(line)) continue;
							
							const cols = line.split(" ");
							let ip = "";
							let mac = "";
							let iface = "";

							for (const col of cols) {
								if (col.includes(".")) {
									ip = col;
									continue;
								}
								if (col.includes(":")) {
									mac = col;
									continue;
								}
								if (cols.indexOf(col) === cols.length - 1) {
									iface = col;
									continue;
								}
							}

							if (ip.length) {
								const arpEntry = { ip, mac, iface };

								if (node.macs) {
									if (node.macs.toLowerCase().includes(mac)) {
										arpEntries.push(arpEntry);
									}
								} else {
									arpEntries.push(arpEntry);
								}
							}
						}

						msg.payload = arpEntries;
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
