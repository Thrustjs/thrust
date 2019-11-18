package br.com.softbox.thrust.test.work01;

import br.com.softbox.thrust.api.thread.LocalWorkerThreadPool;

public class AScheduleSample1Thread {

	private static LocalWorkerThreadPool aSchedulerPool;
	private final String rootPath;

	private static synchronized LocalWorkerThreadPool getASchedulerPool(String rootPath) {
		if (aSchedulerPool == null) {
			aSchedulerPool = new LocalWorkerThreadPool(1, 1, rootPath, new MyThrustWorkerBuilder());
		}
		return aSchedulerPool;
	}

	public AScheduleSample1Thread(String rootPath) {
		this.rootPath = rootPath;
		getASchedulerPool(rootPath);
	}

	public void schedule(int time, String file) {
		MyThrustWorker worker = (MyThrustWorker) getASchedulerPool(rootPath).getThrustWorkerThread();
		worker.schedule(time, file);
	}

}
