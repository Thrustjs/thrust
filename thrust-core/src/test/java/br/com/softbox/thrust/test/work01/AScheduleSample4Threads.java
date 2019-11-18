package br.com.softbox.thrust.test.work01;

import br.com.softbox.thrust.api.thread.LocalWorkerThreadPool;

public class AScheduleSample4Threads {

	private static LocalWorkerThreadPool aSchedulerPool;
	private final String rootPath;

	private static synchronized LocalWorkerThreadPool getASchedulerPool(String rootPath) {
		if (aSchedulerPool == null) {
			aSchedulerPool = new LocalWorkerThreadPool(2, 4, rootPath, new MyThrustWorkerBuilder());
		}
		return aSchedulerPool;
	}

	public AScheduleSample4Threads(String rootPath) {
		this.rootPath = rootPath;
		getASchedulerPool(rootPath);
	}

	public void schedule(int time, String file) {
		MyThrustWorker worker = (MyThrustWorker) getASchedulerPool(rootPath).getThrustWorkerThread();
		worker.schedule(time, file);
	}

}
