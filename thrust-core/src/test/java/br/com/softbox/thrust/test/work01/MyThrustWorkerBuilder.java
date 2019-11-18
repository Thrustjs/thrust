package br.com.softbox.thrust.test.work01;

import java.io.IOException;
import java.net.URISyntaxException;

import br.com.softbox.thrust.api.thread.LocalWorkerThreadPool;
import br.com.softbox.thrust.api.thread.ThrustWorkerThread;
import br.com.softbox.thrust.api.thread.ThrustWorkerThreadBuilder;

public class MyThrustWorkerBuilder implements ThrustWorkerThreadBuilder {

	@Override
	public ThrustWorkerThread build(LocalWorkerThreadPool pool) throws IOException, URISyntaxException {
		return new MyThrustWorker(pool);
	}

}
