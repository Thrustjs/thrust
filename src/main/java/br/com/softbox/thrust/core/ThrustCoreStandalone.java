package br.com.softbox.thrust.core;

import java.io.File;
import java.io.IOException;

import javax.script.ScriptException;

public class ThrustCoreStandalone extends ThrustCore {

	public ThrustCoreStandalone(String applicationName) throws ScriptException, IOException, NoSuchMethodException {
		String thrustDirectory = System.getProperty("thrust.root.path");

		if (thrustDirectory == null || "".equals(thrustDirectory)) {
			throw new IllegalStateException("[ERROR] System property \"thrust.root.path\" not set. Please, define it.");
		}

		initialize(thrustDirectory + File.separator + applicationName);
	}

}
