package br.com.softbox.thrust.test.thread;

import br.com.softbox.thrust.api.thread.LocalWorkerThreadPool;

public class LocalPoolNullBuilder extends LocalWorkerThreadPool {
	
	public LocalPoolNullBuilder(int min, int max) {
		super(min, max, "src/index", (arg1) -> null);
	}

}
