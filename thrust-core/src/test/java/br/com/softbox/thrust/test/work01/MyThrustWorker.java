package br.com.softbox.thrust.test.work01;

import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Deque;
import java.util.concurrent.ConcurrentLinkedDeque;

import org.graalvm.polyglot.Value;

import br.com.softbox.thrust.api.thread.LocalWorkerThreadPool;
import br.com.softbox.thrust.api.thread.ThrustWorkerThread;

public class MyThrustWorker extends ThrustWorkerThread {

	private static final String BITCODE_PKG = "test/thrustjs";

	private Deque<ASchedulerTask> queue;

	MyThrustWorker(LocalWorkerThreadPool pool) throws IOException, URISyntaxException {
		super(pool, BITCODE_PKG, Arrays.asList("index.js", "jsscheduler.js"));
		queue = new ConcurrentLinkedDeque<>();
	}

	synchronized void schedule(long time, String file) {
		queue.add(new ASchedulerTask(time, file));
		this.startCurrentThread();
	}

	@Override
	public void run() {
		while (active.get()) {
			if (!queue.isEmpty()) {
				ASchedulerTask task = queue.poll();
				if (task != null) {
					try {
						System.out.println("::: " + getName() + "::: calling runTask for " + task.file + " (Time: "
								+ task.time + ")");
						Value js = listJS.get(1);
						Path path = Paths.get(thrustContextAPI.getRootPath(), task.file);
						js.invokeMember("runTask", task.time, path.toString());
					} catch (Exception e) {
						inactivate();
						throw new RuntimeException("Failed to load " + task.file, e);
					}
				}
				this.pool.returnThrustWorkerThread(this);
			}
			try {
				synchronized (this) {
					if (active.get()) {
						this.wait();
					}
				}
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				throw new RuntimeException(e);
			}
		}
	}

}
