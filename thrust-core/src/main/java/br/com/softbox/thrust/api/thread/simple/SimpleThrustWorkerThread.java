package br.com.softbox.thrust.api.thread.simple;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;

import br.com.softbox.thrust.api.thread.LocalWorkerThreadPool;
import br.com.softbox.thrust.api.thread.ThrustWorkerThread;

class SimpleThrustWorkerThread extends ThrustWorkerThread {

	private static final Logger logger = Logger.getLogger(SimpleThrustWorkerThread.class.getName());
	private String currentScript;

	SimpleThrustWorkerThread(LocalWorkerThreadPool pool) throws IOException, URISyntaxException {
		super(pool, null, new ArrayList<>());
	}

	private String findScriptPath(String script) {
		File scriptFile = new File(script);
		if (!scriptFile.exists()) {
			scriptFile = Paths.get(pool.getRootPath(), script).toFile();
			if (!scriptFile.exists()) {
				throw new RuntimeException("Script not found: " + script);
			}
		}
		return scriptFile.getAbsolutePath();
	}

	public synchronized void runScript(String script) {
		this.currentScript = findScriptPath(script);
		startCurrentThread();
	}

	@Override
	public void run() {
		while (this.active.get()) {
			addScript();
			pool.returnThrustWorkerThread(this);
			inactivate();
		}
	}

	private synchronized void addScript() {
		try {
			this.thrustContextAPI.require(currentScript);
		} catch (Exception e) {
			logger.log(Level.WARNING, "Failed to load script " + currentScript, e);
		}
	}
}
