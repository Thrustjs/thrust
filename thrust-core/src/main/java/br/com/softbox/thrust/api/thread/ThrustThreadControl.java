package br.com.softbox.thrust.api.thread;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;
import java.util.logging.Logger;

class ThrustThreadControl extends Thread {

	private static final Logger logger = Logger.getLogger(ThrustThreadControl.class.getName());

	/**
	 * Tempo em minutos em que a thread será removida do pool caso não seja
	 * utilizada
	 */
	private static final int MAX_IDLE_TIMEOUT = 10;
	/**
	 * Tempo em milisegundos para avaliação e remoção das threads idle
	 */
	private static final int MAX_WAIT_MS = 30000;

	private final LocalWorkerThreadPool pool;

	private final AtomicBoolean active;

	public ThrustThreadControl(LocalWorkerThreadPool threadPool) {
		this.pool = threadPool;
		this.active = new AtomicBoolean(true);
	}

	@Override
	public void run() {
		while (this.active.get()) {
			try {
				Thread.sleep(MAX_WAIT_MS);
				if (pool.getCurrentThreads() > pool.getMinPoolSize()) {
					searchWorkForRemove();
				}
			} catch (InterruptedException e) {
				this.active.set(false);
				Thread.currentThread().interrupt();
				logger.log(Level.FINEST, "Interrupted", e);
			}
		}
	}

	private void searchWorkForRemove() {
		List<ThrustWorkerThread> workersToRemove = new LinkedList<>();
		pool.idle.iterator().forEachRemaining(worker -> searchToRemove(worker, LocalDateTime.now(), workersToRemove));
		workersToRemove.forEach(this::removeWorker);
	}

	private void searchToRemove(ThrustWorkerThread worker, LocalDateTime now,
			List<ThrustWorkerThread> workersToRemove) {
		if (worker.getLastTimeUsed().until(now, ChronoUnit.MINUTES) > MAX_IDLE_TIMEOUT) {
			workersToRemove.add(worker);
		}
	}

	private void removeWorker(ThrustWorkerThread worker) {
		if (pool.getCurrentThreads() > pool.getMinPoolSize() && pool.idle.remove(worker)) {
			pool.removeWorkerThread(worker);
		}
	}

	public void inactivate() {
		this.active.set(false);
	}

}
