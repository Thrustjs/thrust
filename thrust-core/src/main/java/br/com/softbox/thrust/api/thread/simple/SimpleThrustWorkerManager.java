package br.com.softbox.thrust.api.thread.simple;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import br.com.softbox.thrust.api.thread.LocalWorkerThreadPool;

public class SimpleThrustWorkerManager {

	private LocalWorkerThreadPool pool;
	private List<SimpleThrustWorkerThread> workers;

	public SimpleThrustWorkerManager() {
		this.workers = new ArrayList<>();
		this.pool = null;
	}

	public void initPool(int min, int max, String rootPath) {
		if (pool != null) {
			throw new RuntimeException("Already initiated");
		}
		pool = new LocalWorkerThreadPool(min, max, rootPath, this::build);
	}

	public SimpleThrustWorkerThread build(LocalWorkerThreadPool currentPool) throws IOException, URISyntaxException {
		SimpleThrustWorkerThread worker = new SimpleThrustWorkerThread(currentPool);
		this.workers.add(worker);
		return worker;
	}

	public List<SimpleThrustWorkerThread> getWorkers() {
		return workers;
	}

	public void runScript(String script) {
		SimpleThrustWorkerThread worker = (SimpleThrustWorkerThread) this.pool.getThrustWorkerThread();
		worker.runScript(script);
	}

	public void waitActiveWorkers(long sleepTime) throws InterruptedException {
		while (!this.workers.isEmpty()) {
			Thread.sleep(sleepTime);
			removeNotActives();
		}
	}

	private void removeNotActives() {
		for (Iterator<SimpleThrustWorkerThread> it = this.workers.iterator(); it.hasNext(); ) {
			SimpleThrustWorkerThread worker = it.next();
			if (!worker.isAlive() || worker.isInterrupted()) {
				it.remove();
			}
		}
	}
	
	public void shutdown(boolean force) {
		this.removeNotActives();
		this.pool.shutdown(force);
	}

}
