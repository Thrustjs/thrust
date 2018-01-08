package br.com.softbox.thrust.main;

import java.io.File;

import br.com.softbox.thrust.core.ThrustCore;

public class Main {
	public static void main(String[] args) throws Exception {
		if (args.length < 1) {
			return;
		}
		
		File scriptFile = new File(args[0]);
		
		if (scriptFile.exists() && scriptFile.isFile()) {
			new ThrustCore(scriptFile.getPath());
		} else {
			ThrustCore.runCLI(args);
		}
	}
}
