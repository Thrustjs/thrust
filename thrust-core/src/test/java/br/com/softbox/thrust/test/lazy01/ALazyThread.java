package br.com.softbox.thrust.test.lazy01;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.Collections;

import br.com.softbox.thrust.api.thread.LocalWorkerThreadPool;
import br.com.softbox.thrust.api.thread.ThrustWorkerThread;

public class ALazyThread extends ThrustWorkerThread {

	static final String ROOT_PATH = "./src/test/js/lazy01";

	private static LocalWorkerThreadPool thePool;
	
	public synchronized static LocalWorkerThreadPool getPool() {
		if (thePool == null) {
			thePool = new LocalWorkerThreadPool(1, 2, ROOT_PATH, (pool) -> new ALazyThread(pool));
		}
		return thePool;
	}

	public ALazyThread(LocalWorkerThreadPool pool) throws IOException, URISyntaxException {
		super(pool, "", Collections.emptyList());
		System.out.println(getName() + ": ALazyThread.ALazyThread(): new");
	}

	@Override
	public void run() {
		System.out.println(getName() + ":ALazyThread.run() -  init and sleep");
		try {
			sleep(60040l);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new RuntimeException("Ouch", e);
		}
		System.out.println(getName() + ":ALazyThread.run() -  return to pool");
		pool.returnThrustWorkerThread(this);
		System.out.println(getName() + ":ALazyThread.run() -  ended");
	}

	@Override
	public void inactivate() {
		System.out.println(getName() + ":ALazyThread.inactivate()");
		super.inactivate();
	}

}
