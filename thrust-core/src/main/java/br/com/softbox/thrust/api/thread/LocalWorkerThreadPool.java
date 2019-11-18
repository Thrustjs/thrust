package br.com.softbox.thrust.api.thread;

import java.util.Deque;
import java.util.NoSuchElementException;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.logging.Level;
import java.util.logging.Logger;

public class LocalWorkerThreadPool {

	private static final Logger logger = Logger.getLogger(LocalWorkerThreadPool.class.getName());
	protected final Deque<ThrustWorkerThread> idle;
	private final AtomicBoolean active;
	private final AtomicInteger currentThreads;
	private final AtomicLong lastIndex;
	private final int minPoolSize;
	private final int maxPoolSize;
	private final String rootPath;
	private final ThrustWorkerThreadBuilder workerBuilder;
	private ThrustThreadControl workerControl;

	public LocalWorkerThreadPool(int minPoolSize, int maxPoolSize, String rootPath,
			ThrustWorkerThreadBuilder workerBuilder) {
		if (minPoolSize < 0) {
			throw new IllegalArgumentException("Invalid minimum pool size: " + minPoolSize);
		}
		if (maxPoolSize < 0) {
			throw new IllegalArgumentException("Invalid maximum pool size: " + minPoolSize);
		}
		if (minPoolSize > maxPoolSize) {
			throw new IllegalArgumentException("Minimum is greater maximum: " + minPoolSize + " > " + maxPoolSize);
		}
		idle = new ConcurrentLinkedDeque<>();
		currentThreads = new AtomicInteger(0);
		lastIndex = new AtomicLong(0);

		this.rootPath = rootPath;
		this.workerBuilder = workerBuilder;

		this.active = new AtomicBoolean(true);

		this.minPoolSize = minPoolSize;
		this.maxPoolSize = maxPoolSize;

		initThreads();
		initThreadsControl();
	}

	public String getRootPath() {
		return rootPath;
	}

	private void initThreads() {
		for (int i = 0; i < minPoolSize; i++) {
			idle.add(createThread());
		}
	}

	private void initThreadsControl() {
		if (minPoolSize != maxPoolSize) {
			this.workerControl = new ThrustThreadControl(this);
			this.workerControl.start();
		}
	}

	private ThrustWorkerThread createThread() {
		ThrustWorkerThread thread;
		try {
			thread = workerBuilder.build(this);
		} catch (Exception e) {
			throw new RuntimeException("Builder failed to create a new thrust worker builder", e);
		}
		if (thread == null) {
			throw new RuntimeException("Builder didn't create a new thrust worker builder");
		}
		currentThreads.incrementAndGet();
		long threadNumber = lastIndex.incrementAndGet();
		thread.setName("ThrustWorker-" + threadNumber);

		return thread;
	}

	void removeWorkerThread(ThrustWorkerThread worker) {
		if (worker != null) {
			final String threadName = worker.getName();
			try {
				logger.info("Killing thread " + threadName);
				currentThreads.decrementAndGet();
				synchronized (worker) {
					worker.inactivate();
				}
			} catch (Exception e) {
				logger.log(Level.SEVERE, "Failed to kill thread " + threadName, e);
			}
		}
	}

	public ThrustWorkerThread getThrustWorkerThread() {
		if (!this.active.get()) {
			throw new RuntimeException("Pool is not activated");
		}
		if (!idle.isEmpty()) {
			try {
				return idle.removeFirst();
			} catch (NoSuchElementException e) {
				logger.log(Level.FINEST, () -> "Failed to remove first: " + e.getMessage());
			}
		}
		if (currentThreads.get() < maxPoolSize) {
			try {
				return createThread();
			} catch (Exception e) {
				logger.log(Level.SEVERE, "Failed to create a new Thrust thread", e);
			}
		}
		return null;
	}

	public void returnThrustWorkerThread(ThrustWorkerThread worker) {
		if (worker != null && this.active.get()) {
			worker.updateLastTimeUsed();
			idle.addFirst(worker);
		}
	}

	public int getCurrentThreads() {
		return currentThreads.get();
	}

	public int getMinPoolSize() {
		return minPoolSize;
	}

	public int getMaxPoolSize() {
		return maxPoolSize;
	}

	public int getCurrentNumberWorkers() {
		return this.idle.size();
	}

	public void shutdown(boolean force) {
		this.active.set(false);
		removeCurrentWorkers(force);
		stopWorkerControl(force);
	}

	private void stopWorkerControl(boolean force) {
		if (this.workerControl != null) {
			try {
				this.workerControl.inactivate();
				this.workerControl.interrupt();
			} catch (Exception e) {
				String errMsg = "Failed to stop thread worker control";
				if (!force) {
					throw new RuntimeException(errMsg, e);
				} else {
					logger.log(Level.WARNING, errMsg, e);
				}
			} finally {
				this.workerControl = null;
			}
		}
	}

	private void removeCurrentWorkers(boolean force) {
		while (!idle.isEmpty()) {
			ThrustWorkerThread worker = null;
			try {
				worker = idle.poll();
				if (worker != null) {
					worker.inactivate();
					worker.interrupt();
				}
			} catch (Exception e) {
				String errMsg = "Failed to stop thread worker " + (worker != null ? worker.getName() : "");
				if (!force) {
					throw new RuntimeException(errMsg, e);
				} else {
					logger.log(Level.WARNING, errMsg, e);
				}
			}
		}
	}
}
