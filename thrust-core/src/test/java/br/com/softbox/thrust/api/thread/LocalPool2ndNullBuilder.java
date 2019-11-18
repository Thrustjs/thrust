package br.com.softbox.thrust.api.thread;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import br.com.softbox.thrust.api.thread.LocalWorkerThreadPool;
import br.com.softbox.thrust.api.thread.ThrustWorkerThread;
import br.com.softbox.thrust.api.thread.ThrustWorkerThreadBuilder;

public class LocalPool2ndNullBuilder extends LocalWorkerThreadPool {
	
	public LocalPool2ndNullBuilder() {
		super(1,2, "src/test/", new Builder());
	}
	
	public static class Builder implements ThrustWorkerThreadBuilder {
		
		private AtomicInteger count = new AtomicInteger(2);
		
		@Override
		public ThrustWorkerThread build(LocalWorkerThreadPool pool)
				throws IOException, URISyntaxException {
			if (count.decrementAndGet() > 0) {
				System.out.println("LocalPool2ndNullBuilder.Builder.build() new worker: " + count.get());
				return new Worker(pool);
			}
			System.out.println("LocalPool2ndNullBuilder.Builder.build() no worker: " + count.get());
			return null;
		}
	}
	
	public static class Worker extends ThrustWorkerThread {
		
		public Worker(LocalWorkerThreadPool pool) throws IOException, URISyntaxException {
			super(pool, "no-pkg", new ArrayList<>()); 
			System.out.println("LocalPool2ndNullBuilder.Worker.Worker()");
		}
		
		@Override
		public void run() {
			System.out.println(getName() + ":LocalPool2ndNullBuilder.Worker.run() - init");
			while (this.active.get()) {
				System.out.println(getName() + ":LocalPool2ndNullBuilder.Worker.run() - waiting");
				try {
					Thread.sleep(5000);
				} catch (InterruptedException e) {
					Thread.currentThread().interrupt();
					throw new RuntimeException(e);
				}
				System.out.println(getName() + ":LocalPool2ndNullBuilder.Worker.run() - return");
				pool.returnThrustWorkerThread(this);
				System.out.println(getName() + ":LocalPool2ndNullBuilder.Worker.run() - inactivate");
				this.inactivate();
			}
		}
	}

}
