function loadJar(fileName) {
	const ThrustCore = Java.type("br.com.softbox.thrust.core.ThrustCore");
	ThrustCore.loadJar(fileName);
}